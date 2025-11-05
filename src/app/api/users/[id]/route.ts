// src/app/api/users/[id]/route.ts
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

// GET single user by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
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
      { status: 500 }
    );
  }
}

// PUT - Update user (updates both users table AND Supabase Auth metadata)
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { id } = params;
    const body = await request.json();

    console.log("🔄 Updating user:", id);
    console.log("📦 Request body:", JSON.stringify(body, null, 2));

    // Step 1: Update the users table
    const { data: updatedUser, error: userError } = await supabase
      .from("users")
      .update({
        name: body.name,
        role: body.role,
        status: body.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (userError) {
      console.error("❌ Error updating users table:", userError);
      return NextResponse.json({ error: userError.message }, { status: 500 });
    }

    console.log("✅ Users table updated successfully");

    // Step 2: Update Supabase Auth user_metadata (requires service role)
    try {
      const supabaseAdmin = createAdminClient();

      const { data: authUser, error: authError } =
        await supabaseAdmin.auth.admin.updateUserById(id, {
          user_metadata: {
            name: body.name,
            role: body.role,
          },
        });

      if (authError) {
        console.error("⚠️ Warning: Could not update auth metadata:", authError);
        // Don't fail the request - users table is updated
        return NextResponse.json(
          {
            user: updatedUser,
            warning:
              "User table updated but auth metadata update failed. User may need to re-login to see role changes.",
          },
          { status: 200 }
        );
      }

      console.log("✅ Auth metadata updated successfully");
    } catch (adminError) {
      console.error("⚠️ Error creating admin client:", adminError);
      // Continue - users table is updated
    }

    return NextResponse.json({ user: updatedUser }, { status: 200 });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Internal server error while updating user" },
      { status: 500 }
    );
  }
}

// DELETE user
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { id } = params;

    // Delete from users table
    const { error: userError } = await supabase
      .from("users")
      .delete()
      .eq("id", id);

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 500 });
    }

    // Optionally delete from Supabase Auth (requires service role)
    try {
      const supabaseAdmin = createAdminClient();
      await supabaseAdmin.auth.admin.deleteUser(id);
    } catch (adminError) {
      console.error("Warning: Could not delete from auth:", adminError);
      // Continue - users table is deleted
    }

    return NextResponse.json(
      { message: "User deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error while deleting user" },
      { status: 500 }
    );
  }
}
