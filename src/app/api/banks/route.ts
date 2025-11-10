// src/app/api/banks/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all active banks ordered by name
    const { data: banks, error } = await supabase
      .from("banks")
      .select("*")
      .eq("is_active", true)
      .order("bank_name", { ascending: true });

    if (error) {
      console.error("Error fetching banks:", error);
      return NextResponse.json(
        { error: "Failed to fetch banks" },
        { status: 500 }
      );
    }

    return NextResponse.json({ banks });
  } catch (error) {
    console.error("Error in banks API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
