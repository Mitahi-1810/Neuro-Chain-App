-- Create specialists table (Postgres)
CREATE TABLE IF NOT EXISTS public.specialists (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  full_name TEXT,
  medical_reg_number TEXT,
  specialty TEXT,
  clinic_name TEXT,
  city TEXT,
  consultation_fee_bdt INTEGER,
  languages TEXT,
  bio TEXT,
  profile_photo_url TEXT,
  bank_account_encrypted TEXT,
  calendly_url TEXT,
  status TEXT CHECK (status IN ('PENDING', 'ACTIVE', 'INACTIVE')),
  is_verified INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  sync_status INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS specialists_user_id_idx ON public.specialists (user_id);
CREATE INDEX IF NOT EXISTS specialists_status_idx ON public.specialists (status);
