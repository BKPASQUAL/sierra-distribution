// src/app/api/users/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET all users
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    
    // Check if the requester is authenticated
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Try to fetch from users table if it exists
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (usersError && usersError.code !== '42P01') {
      // 42P01 is "table does not exist"
      return NextResponse.json(
        { error: usersError.message },
        { status: 500 }
      );
    }

    // If table doesn't exist or is empty, return the current user
    if (!users || users.length === 0) {
      return NextResponse.json({
        users: [{
          id: currentUser.id,
          email: currentUser.email,
          name: currentUser.user_metadata?.name || 'Admin User',
          role: currentUser.user_metadata?.role || 'Admin',
          status: 'Active',
          created_at: currentUser.created_at,
        }]
      });
    }

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}