import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Explicitly load .env.local for local development
config({ path: ".env.local" });

if (!process.env.DATABASE_URL) {
  config({ path: ".env" });
}

export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
