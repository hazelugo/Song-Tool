import { mkdirSync, writeFileSync } from "fs";
import { config } from "dotenv";

// Load .env.local so NEXT_PUBLIC_* vars are available outside Next.js
config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const TEST_EMAIL = process.env.TEST_USER_EMAIL ?? "haze@test.com";
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD ?? "Password123";

// Max cookie chunk size used by @supabase/ssr
const CHUNK_SIZE = 3180;

async function globalSetup() {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Supabase sign-in failed (${res.status}): ${body}`);
  }

  const session = await res.json();

  const projectRef = new URL(SUPABASE_URL).hostname.split(".")[0];
  const cookieName = `sb-${projectRef}-auth-token`;
  const cookieValue = JSON.stringify(session);

  const cookieBase = {
    domain: "localhost",
    path: "/",
    expires: session.expires_at as number,
    httpOnly: false,
    secure: false,
    sameSite: "Lax" as const,
  };

  const cookies =
    cookieValue.length <= CHUNK_SIZE
      ? [{ name: cookieName, value: cookieValue, ...cookieBase }]
      : Array.from({ length: Math.ceil(cookieValue.length / CHUNK_SIZE) }, (_, i) => ({
          name: `${cookieName}.${i}`,
          value: cookieValue.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE),
          ...cookieBase,
        }));

  mkdirSync("playwright/.auth", { recursive: true });
  writeFileSync(
    "playwright/.auth/user.json",
    JSON.stringify({ cookies, origins: [] }, null, 2),
  );

  console.log(`[global-setup] Signed in as ${TEST_EMAIL} (${cookies.length} cookie chunk(s))`);
}

export default globalSetup;
