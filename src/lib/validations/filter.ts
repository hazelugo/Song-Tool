import { z } from "zod";
import { MUSICAL_KEYS } from "./song";

export const filterSchema = z.object({
  bpmMin: z.coerce.number().int().min(1).max(500).optional(),
  bpmMax: z.coerce.number().int().min(1).max(500).optional(),
  key: z.enum(MUSICAL_KEYS).optional(),
  keySig: z.enum(["major", "minor"] as const).optional(),
  chord: z.string().max(100).optional(),
  lyric: z.string().max(500).optional(),
  tag: z.string().max(100).optional(),
});

export type FilterParams = z.infer<typeof filterSchema>;
