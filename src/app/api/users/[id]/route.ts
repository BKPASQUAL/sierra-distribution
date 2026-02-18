// src/app/api/users/[id]/route.ts
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

// GET single user by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = await createClient();
    const { id } = params;

    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error while fetching user" },
      { status: 500 },
    );
  }
}

// PUT - Update user
export async function PUT(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;
    const body = await request.json();
    const supabaseAdmin = createAdminClient(); // Use admin for all ops to ensure consistency

    console.log("🔄 Updating user:", id);

    // 1. Check uniqueness if username is being changed
    if (body.username) {
      const { data: existingUser } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("username", body.username)
        .neq("id", id) // Exclude current user
        .single();

      if (existingUser) {
        return NextResponse.json(
          { error: "Username already taken by another user" },
          { status: 400 },
        );
      }
    }

    // 2. Prepare database update object
    const dbUpdateData: any = {
      name: body.name,
      role: body.role,
      status: body.status,
      username: body.username || null,
      updated_at: new Date().toISOString(),
    };

    // 3. Update the users table
    const { data: updatedUser, error: userError } = await supabaseAdmin
      .from("users")
      .update(dbUpdateData)
      .eq("id", id)
      .select()
      .single();

    if (userError) {
      console.error("❌ Error updating users table:", userError);
      return NextResponse.json({ error: userError.message }, { status: 500 });
    }

    // 4. Update Supabase Auth (Password & Metadata)
    try {
      const authUpdateData: any = {
        user_metadata: {
          name: body.name,
          role: body.role,
        },
      };

      // Add password to update if provided
      if (body.password && body.password.trim() !== "") {
        console.log("🔐 Updating password for user");
        authUpdateData.password = body.password;
      }

      const { error: authError } =
        await supabaseAdmin.auth.admin.updateUserById(id, authUpdateData);

      if (authError) {
        console.error("⚠️ Warning: Could not update auth:", authError);
        return NextResponse.json(
          {
            user: updatedUser,
            warning:
              "User profile updated, but password/metadata update failed.",
          },
          { status: 200 },
        );
      }

      console.log("✅ Auth updated successfully");
    } catch (adminError) {
      console.error("⚠️ Error in admin auth update:", adminError);
    }

    return NextResponse.json({ user: updatedUser }, { status: 200 });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Internal server error while updating user" },
      { status: 500 },
    );
  }
}

// DELETE user
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;
    const supabaseAdmin = createAdminClient();

    // Delete from users table
    const { error: userError } = await supabaseAdmin
      .from("users")
      .delete()
      .eq("id", id);

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 500 });
    }

    // Delete from Supabase Auth
    try {
      await supabaseAdmin.auth.admin.deleteUser(id);
    } catch (adminError) {
      console.error("Warning: Could not delete from auth:", adminError);
    }

    return NextResponse.json(
      { message: "User deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error while deleting user" },
      { status: 500 },
    );
  }
}
