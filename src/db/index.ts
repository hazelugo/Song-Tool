import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// prepare: false is REQUIRED for Supabase Transaction pool mode (port 6543)
// Without this, production throws "prepared statement already exists"
const client = postgres(process.env.DATABASE_URL!, { prepare: false });
export const db = drizzle({ client, schema });
