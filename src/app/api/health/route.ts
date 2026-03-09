export async function GET() {
  // db connectivity wired in plan 01-02
  return Response.json({ status: "ok", db: "pending" })
}
