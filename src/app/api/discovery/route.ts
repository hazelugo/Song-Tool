import { NextResponse } from "next/server";
import { db } from "@/db";
import { songs, tags } from "@/db/schema";
import { and, isNull, gte, lte, eq, ilike, exists, or, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { z } from "zod";
import { MUSICAL_KEYS, TIME_SIGNATURES } from "@/lib/validations/song";
import { requireUser } from "@/lib/auth";
import { GoogleGenerativeAI, SchemaType, FunctionCallingMode } from "@google/generative-ai";

const requestSchema = z.object({ prompt: z.string().min(1).max(500) });

interface Filters {
  key?: string;
  keySig?: "major" | "minor";
  timeSig?: string;
  bpmMin?: number;
  bpmMax?: number;
  searchTerm?: string;
}

async function extractFiltersWithGemini(prompt: string): Promise<Filters> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    tools: [
      {
        functionDeclarations: [
          {
            name: "extract_filters",
            description:
              "Extract structured search filters from a natural-language song-search prompt. " +
              "Return only the fields clearly implied by the prompt — omit anything not mentioned.",
            parameters: {
              type: SchemaType.OBJECT,
              properties: {
                key: {
                  type: SchemaType.STRING,
                  format: "enum",
                  enum: [...MUSICAL_KEYS],
                  description: "Musical key (e.g. 'C', 'F#', 'Bb'). Omit if not specified.",
                },
                keySig: {
                  type: SchemaType.STRING,
                  format: "enum",
                  enum: ["major", "minor"],
                  description: "Major or minor mode. Omit if not specified.",
                },
                timeSig: {
                  type: SchemaType.STRING,
                  format: "enum",
                  enum: [...TIME_SIGNATURES],
                  description: "Time signature (e.g. '4/4', '3/4'). Omit if not specified.",
                },
                bpmMin: {
                  type: SchemaType.NUMBER,
                  description:
                    "Minimum BPM. Use when an explicit BPM or mood word implies a lower bound (e.g. 'upbeat' → 120). Omit if not applicable.",
                },
                bpmMax: {
                  type: SchemaType.NUMBER,
                  description:
                    "Maximum BPM. Use when an explicit BPM or mood word implies an upper bound (e.g. 'slow' → 90). Omit if not applicable.",
                },
                searchTerm: {
                  type: SchemaType.STRING,
                  description:
                    "Free-text remainder to search song names, lyrics, and tags. Strip filter-related words already captured in other fields. Omit if nothing meaningful remains.",
                },
              },
            },
          },
        ],
      },
    ],
    toolConfig: {
      functionCallingConfig: {
        mode: FunctionCallingMode.ANY,
        allowedFunctionNames: ["extract_filters"],
      },
    },
    systemInstruction:
      "You are a filter extraction assistant for a musician's song library. " +
      "The library stores songs with: BPM (tempo), musical key (e.g. C, F#, Bb), " +
      "key signature (major/minor), time signature (e.g. 4/4, 3/4), lyrics, and tags. " +
      "Your job is to call extract_filters with the structured search parameters " +
      "implied by the user's natural-language prompt. Be conservative — only set fields " +
      "the prompt clearly implies.",
  });

  const result = await model.generateContent(prompt);
  const call = result.response.functionCalls()?.[0];
  if (!call) return {};

  const input = call.args as Filters;

  // Validate against known enum values before returning
  const filters: Filters = {};
  if (input.key && (MUSICAL_KEYS as readonly string[]).includes(input.key)) {
    filters.key = input.key;
  }
  if (input.keySig === "major" || input.keySig === "minor") {
    filters.keySig = input.keySig;
  }
  if (input.timeSig && (TIME_SIGNATURES as readonly string[]).includes(input.timeSig)) {
    filters.timeSig = input.timeSig;
  }
  if (typeof input.bpmMin === "number" && input.bpmMin >= 1) {
    filters.bpmMin = Math.round(input.bpmMin);
  }
  if (typeof input.bpmMax === "number" && input.bpmMax <= 500) {
    filters.bpmMax = Math.round(input.bpmMax);
  }
  if (typeof input.searchTerm === "string" && input.searchTerm.trim().length > 1) {
    filters.searchTerm = input.searchTerm.trim();
  }

  return filters;
}

export async function POST(request: Request) {
  const { userId, error: authError } = await requireUser();
  if (authError) return authError;

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not configured" },
      { status: 503 },
    );
  }

  try {
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { prompt } = parsed.data;
    const filters = await extractFiltersWithGemini(prompt);

    const conditions: SQL[] = [isNull(songs.deletedAt), eq(songs.userId, userId)];

    if (filters.bpmMin !== undefined) conditions.push(gte(songs.bpm, filters.bpmMin));
    if (filters.bpmMax !== undefined) conditions.push(lte(songs.bpm, filters.bpmMax));
    if (filters.key) conditions.push(eq(songs.musicalKey, filters.key as any));
    if (filters.keySig) conditions.push(eq(songs.keySignature, filters.keySig as any));
    if (filters.timeSig) conditions.push(eq(songs.timeSignature, filters.timeSig as any));

    if (filters.searchTerm) {
      const term = filters.searchTerm;
      const words = term.split(/\s+/).filter((w) => w.length > 1);
      const tagExistsConditions = words.map((word) =>
        exists(
          db
            .select({ id: sql<number>`1` })
            .from(tags)
            .where(and(eq(tags.songId, songs.id), ilike(tags.name, `%${word}%`))),
        ),
      );

      conditions.push(
        or(
          ilike(songs.name, `%${term}%`),
          sql`${songs.lyricsSearch} @@ websearch_to_tsquery('english', ${term})`,
          ...tagExistsConditions,
        )!,
      );
    }

    const results = await db.query.songs.findMany({
      where: and(...conditions),
      with: { tags: true },
      orderBy: (songs, { desc }) => [desc(songs.createdAt)],
    });

    return NextResponse.json({ results, parsedFilters: filters });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("POST /api/discovery error:", err);
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
