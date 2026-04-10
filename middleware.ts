import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const PROTECTED_PREFIXES = ["/songs", "/playlists", "/discovery"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only check protected routes — everything else passes through
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/"),
  );
  if (!isProtected) {
    return NextResponse.next();
  }

  // Create Supabase client using the middleware cookie pattern
  // In middleware, cookies() from next/headers is not available — use request/response cookies directly
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response = NextResponse.next({ request: { headers: request.headers } });
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  // Validate JWT with Supabase auth server — getUser() not getSession() (T-05-03)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Redirect unauthenticated users to /login
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt
     * - api routes (have their own requireUser() checks)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|api).*)",
  ],
};
