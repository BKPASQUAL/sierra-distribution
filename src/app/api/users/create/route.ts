// src/app/api/users/create/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Check if the requester is authenticated and is an admin
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get request body
    const body = await request.json();
    const { email, password, name, role } = body;

    // Validate required fields
    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { error: "Missing required fields: email, password, name, role" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate password strength (minimum 6 characters)
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    // Validate role
    if (!['Admin', 'Staff'].includes(role)) {
      return NextResponse.json(
        { error: "Role must be either 'Admin' or 'Staff'" },
        { status: 400 }
      );
    }

    // Create a new Supabase admin client using service role key
    // This allows creating users without requiring email confirmation
    const supabaseAdmin = await createClient();

    // Create the user in Supabase Auth
    const { data: newUser, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/login`,
      },
    });

    if (signUpError) {
      return NextResponse.json(
        { error: signUpError.message },
        { status: 400 }
      );
    }

    // Create user profile in database (if you have a users table)
    // This is optional - you can store additional user info here
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .insert([
        {
          id: newUser.user?.id,
          email,
          name,
          role,
          status: 'Active',
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (profileError && profileError.code !== '42P01') {
      // 42P01 is "table does not exist" - we can ignore if users table doesn't exist yet
      console.error('Profile creation error:', profileError);
    }

    return NextResponse.json(
      {
        message: "User created successfully",
        user: {
          id: newUser.user?.id,
          email: newUser.user?.email,
          name,
          role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}