import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/** Call at the top of any API route handler that requires authentication.
 *  Returns the authenticated user ID, or a 401 NextResponse to return immediately. */
export async function requireUser(): Promise<
  | { userId: string; error: null }
  | { userId: null; error: NextResponse }
> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      userId: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { userId: user.id, error: null };
}
