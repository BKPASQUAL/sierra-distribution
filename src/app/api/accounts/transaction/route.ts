// src/app/api/accounts/transaction/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const body = await request.json();

  const { type, amount, toAccountId, fromAccountId, notes } = body;
  const parsedAmount = parseFloat(amount);

  if (!type || !parsedAmount || parsedAmount <= 0) {
    return NextResponse.json(
      { error: "Invalid data. Type and a positive amount are required." },
      { status: 400 }
    );
  }

  try {
    // --- HANDLE DEPOSIT ---
    if (type === "deposit") {
      if (!toAccountId) {
        return NextResponse.json(
          { error: "A 'To Account' is required for a deposit." },
          { status: 400 }
        );
      }

      // Get the account to deposit into
      const { data: toAccount, error: toError } = await supabase
        .from("company_accounts")
        .select("current_balance")
        .eq("id", toAccountId)
        .single();

      if (toError || !toAccount) {
        return NextResponse.json(
          { error: "Deposit account not found." },
          { status: 404 }
        );
      }

      // Calculate new balance and update
      const newBalance = (toAccount.current_balance || 0) + parsedAmount;
      const { error: updateError } = await supabase
        .from("company_accounts")
        .update({ current_balance: newBalance })
        .eq("id", toAccountId);

      if (updateError) {
        throw new Error(updateError.message);
      }

      return NextResponse.json(
        { success: true, message: "Deposit successful!" },
        { status: 200 }
      );
    }

    // --- HANDLE TRANSFER ---
    if (type === "transfer") {
      if (!fromAccountId || !toAccountId) {
        return NextResponse.json(
          {
            error: "Both 'From' and 'To' accounts are required for a transfer.",
          },
          { status: 400 }
        );
      }

      if (fromAccountId === toAccountId) {
        return NextResponse.json(
          { error: "Cannot transfer to the same account." },
          { status: 400 }
        );
      }

      // Get 'From' Account
      const { data: fromAccount, error: fromError } = await supabase
        .from("company_accounts")
        .select("current_balance")
        .eq("id", fromAccountId)
        .single();

      if (fromError || !fromAccount) {
        return NextResponse.json(
          { error: "Source account not found." },
          { status: 404 }
        );
      }

      // Check for sufficient funds
      if (fromAccount.current_balance < parsedAmount) {
        return NextResponse.json(
          { error: "Insufficient funds in the source account." },
          { status: 400 }
        );
      }

      // Get 'To' Account
      const { data: toAccount, error: toError } = await supabase
        .from("company_accounts")
        .select("current_balance")
        .eq("id", toAccountId)
        .single();

      if (toError || !toAccount) {
        return NextResponse.json(
          { error: "Destination account not found." },
          { status: 404 }
        );
      }

      // Calculate new balances
      const newFromBalance = fromAccount.current_balance - parsedAmount;
      const newToBalance = (toAccount.current_balance || 0) + parsedAmount;

      // Update 'From' Account (Subtract)
      const { error: fromUpdateError } = await supabase
        .from("company_accounts")
        .update({ current_balance: newFromBalance })
        .eq("id", fromAccountId);

      if (fromUpdateError) {
        throw new Error(
          `Failed to debit source account: ${fromUpdateError.message}`
        );
      }

      // Update 'To' Account (Add)
      const { error: toUpdateError } = await supabase
        .from("company_accounts")
        .update({ current_balance: newToBalance })
        .eq("id", toAccountId);

      if (toUpdateError) {
        // Rollback the debit
        await supabase
          .from("company_accounts")
          .update({ current_balance: fromAccount.current_balance })
          .eq("id", fromAccountId);
        throw new Error(
          `Failed to credit destination account: ${toUpdateError.message}`
        );
      }

      return NextResponse.json(
        { success: true, message: "Transfer successful!" },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: "Invalid transaction type." },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Internal server error." },
      { status: 500 }
    );
  }
}
