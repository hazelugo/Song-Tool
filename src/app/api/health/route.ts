import { db } from '@/db'
import { sql } from 'drizzle-orm'

export async function GET() {
  try {
    await db.execute(sql`SELECT 1`)
    return Response.json({ status: 'ok', db: 'ok' })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown'
    return Response.json(
      { status: 'error', db: 'unreachable', error: message },
      { status: 503 }
    )
  }
}
