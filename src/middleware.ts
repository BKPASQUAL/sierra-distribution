// src/middleware.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Define public routes that don't require authentication
  const publicRoutes = ["/login", "/manifest.webmanifest", "/sw.js", "/icon"];
  const isPublicRoute = publicRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If accessing a public route and user is logged in, redirect to dashboard
  if (isPublicRoute && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // If accessing a protected route and user is NOT logged in, redirect to login
  if (!isPublicRoute && !user) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("message", "Please log in to continue");
    return NextResponse.redirect(redirectUrl);
  }

  // If user is logged in, check their status in the users table
  if (user) {
    const { data: userData, error } = await supabase
      .from("users")
      .select("status")
      .eq("id", user.id)
      .single();

    // If user is Inactive, sign them out and redirect to login
    if (userData && userData.status === "Inactive") {
      await supabase.auth.signOut();
      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set(
        "message",
        "Your account has been deactivated. Please contact an administrator."
      );
      return NextResponse.redirect(redirectUrl);
    }

    // If there was an error fetching user data (user might be deleted)
    if (error && error.code === "PGRST116") {
      await supabase.auth.signOut();
      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set("message", "Your account no longer exists.");
      return NextResponse.redirect(redirectUrl);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api (API routes) ⭐ CRITICAL: API routes must be excluded!
     * - public files (images, svg, png, jpg, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|workbox-.*|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};