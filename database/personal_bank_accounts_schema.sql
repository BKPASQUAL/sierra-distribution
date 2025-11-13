-- Personal Bank Accounts Schema
-- This schema allows users to manage their personal bank accounts directly
-- without requiring a separate banks table with bank codes

-- Drop existing foreign key constraint if it exists
ALTER TABLE public.bank_accounts
  DROP CONSTRAINT IF EXISTS bank_accounts_bank_id_fkey;

-- Modify bank_accounts table to remove bank_id and add bank_name directly
ALTER TABLE public.bank_accounts
  DROP COLUMN IF EXISTS bank_id;

ALTER TABLE public.bank_accounts
  ADD COLUMN IF NOT EXISTS bank_name text NOT NULL DEFAULT '';

-- Updated bank_accounts table structure
CREATE TABLE IF NOT EXISTS public.bank_accounts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  account_name text NOT NULL,
  account_number text NOT NULL UNIQUE,
  bank_name text NOT NULL,  -- Direct bank name instead of foreign key
  account_type text NOT NULL CHECK (account_type = ANY (ARRAY['current'::text, 'savings'::text, 'cash'::text])),
  branch text,
  opening_balance numeric DEFAULT 0,
  current_balance numeric DEFAULT 0,
  currency text DEFAULT 'LKR'::text,
  is_active boolean DEFAULT true,
  is_primary boolean DEFAULT false,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT bank_accounts_pkey PRIMARY KEY (id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bank_accounts_bank_name ON public.bank_accounts(bank_name);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_is_active ON public.bank_accounts(is_active);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_is_primary ON public.bank_accounts(is_primary);

-- Create or replace function to ensure only one primary account
CREATE OR REPLACE FUNCTION ensure_single_primary_bank_account()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_primary = true THEN
    UPDATE public.bank_accounts
    SET is_primary = false
    WHERE id != NEW.id AND is_primary = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for primary account enforcement
DROP TRIGGER IF EXISTS trigger_ensure_single_primary_bank_account ON public.bank_accounts;
CREATE TRIGGER trigger_ensure_single_primary_bank_account
  BEFORE INSERT OR UPDATE ON public.bank_accounts
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_primary_bank_account();

-- The banks table is now optional and can be kept for reference only
-- It will not have foreign key relationships with bank_accounts

COMMENT ON TABLE public.bank_accounts IS 'Personal bank accounts that can be managed directly without requiring bank codes';
COMMENT ON COLUMN public.bank_accounts.bank_name IS 'Direct bank name entry - no foreign key constraint';
COMMENT ON COLUMN public.bank_accounts.account_name IS 'Friendly name for the account (e.g., "Main Business Account", "Petty Cash Account")';
COMMENT ON COLUMN public.bank_accounts.account_type IS 'Type of account: current, savings, or cash';
COMMENT ON COLUMN public.bank_accounts.is_primary IS 'Indicates if this is the primary bank account for transactions';
