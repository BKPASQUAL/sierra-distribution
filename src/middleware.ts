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

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If user is logged in, check their status in the users table
  if (user) {
    const { data: userData, error } = await supabase
      .from("users")
      .select("status")
      .eq("id", user.id)
      .single();

    // If user is Inactive, sign them out and redirect to login
    if (userData && userData.status === "Inactive") {
      // Sign out the user
      await supabase.auth.signOut();

      // Redirect to login with a message
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
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
