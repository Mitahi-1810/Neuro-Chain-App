-- Full schema migration (Postgres)
CREATE TABLE
    IF NOT EXISTS public.users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE,
        full_name TEXT,
        role TEXT CHECK (
            role IN ('PARENT', 'SPECIALIST', 'CAREGIVER', 'ADMIN')
        ),
        tier_level TEXT CHECK (tier_level IN ('FREE', 'BASIC', 'PREMIUM')),
        created_at TIMESTAMP
        WITH
            TIME ZONE,
            updated_at TIMESTAMP
        WITH
            TIME ZONE,
            sync_status INTEGER DEFAULT 0
    );

CREATE INDEX IF NOT EXISTS users_role_idx ON public.users (role);

CREATE TABLE
    IF NOT EXISTS public.children (
        id TEXT PRIMARY KEY,
        parent_id TEXT REFERENCES public.users (id) ON DELETE CASCADE,
        first_name TEXT,
        date_of_birth TEXT,
        gender TEXT,
        primary_concerns TEXT,
        created_at TIMESTAMP
        WITH
            TIME ZONE,
            updated_at TIMESTAMP
        WITH
            TIME ZONE,
            sync_status INTEGER DEFAULT 0
    );

CREATE INDEX IF NOT EXISTS children_parent_id_idx ON public.children (parent_id);

CREATE TABLE
    IF NOT EXISTS public.activities_log (
        id TEXT PRIMARY KEY,
        child_id TEXT REFERENCES public.children (id) ON DELETE CASCADE,
        game_id TEXT,
        duration_ms INTEGER,
        accuracy_percentage INTEGER,
        timestamp TEXT,
        game_specific_metrics JSONB,
        ai_vision_metrics JSONB,
        created_at TIMESTAMP
        WITH
            TIME ZONE,
            sync_status INTEGER DEFAULT 0
    );

CREATE INDEX IF NOT EXISTS activities_log_child_id_idx ON public.activities_log (child_id);

CREATE INDEX IF NOT EXISTS activities_log_timestamp_idx ON public.activities_log (timestamp);

CREATE TABLE
    IF NOT EXISTS public.assessments (
        id TEXT PRIMARY KEY,
        child_id TEXT REFERENCES public.children (id) ON DELETE CASCADE,
        test_type TEXT,
        raw_answers JSONB,
        risk_score INTEGER,
        risk_level TEXT CHECK (risk_level IN ('LOW', 'MODERATE', 'HIGH')),
        timestamp TEXT,
        created_at TIMESTAMP
        WITH
            TIME ZONE,
            sync_status INTEGER DEFAULT 0
    );

CREATE INDEX IF NOT EXISTS assessments_child_id_idx ON public.assessments (child_id);

CREATE TABLE
    IF NOT EXISTS public.specialists (
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
        created_at TIMESTAMP
        WITH
            TIME ZONE,
            updated_at TIMESTAMP
        WITH
            TIME ZONE,
            sync_status INTEGER DEFAULT 0
    );

CREATE INDEX IF NOT EXISTS specialists_user_id_idx ON public.specialists (user_id);

CREATE INDEX IF NOT EXISTS specialists_status_idx ON public.specialists (status);

CREATE TABLE
    IF NOT EXISTS public.appointments (
        id TEXT PRIMARY KEY,
        parent_id TEXT REFERENCES public.users (id) ON DELETE CASCADE,
        specialist_id TEXT REFERENCES public.specialists (id) ON DELETE CASCADE,
        child_id TEXT REFERENCES public.children (id) ON DELETE CASCADE,
        scheduled_at TEXT,
        session_type TEXT,
        status TEXT CHECK (
            status IN ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED')
        ),
        amount_paid_bdt REAL,
        discount_applied_pct REAL DEFAULT 0,
        payment_gateway TEXT,
        payment_reference TEXT,
        created_at TIMESTAMP
        WITH
            TIME ZONE,
            updated_at TIMESTAMP
        WITH
            TIME ZONE,
            sync_status INTEGER DEFAULT 0
    );

CREATE INDEX IF NOT EXISTS appointments_specialist_id_idx ON public.appointments (specialist_id);

CREATE INDEX IF NOT EXISTS appointments_parent_id_idx ON public.appointments (parent_id);

CREATE TABLE
    IF NOT EXISTS public.clinical_soap_notes (
        id TEXT PRIMARY KEY,
        appointment_id TEXT REFERENCES public.appointments (id) ON DELETE CASCADE,
        ai_generated_json JSONB,
        specialist_edited_json JSONB,
        is_signed INTEGER DEFAULT 0,
        signed_at TEXT,
        signed_by TEXT REFERENCES public.users (id) ON DELETE SET NULL,
        created_at TIMESTAMP
        WITH
            TIME ZONE,
            updated_at TIMESTAMP
        WITH
            TIME ZONE,
            sync_status INTEGER DEFAULT 0
    );

CREATE INDEX IF NOT EXISTS clinical_soap_notes_appointment_id_idx ON public.clinical_soap_notes (appointment_id);

CREATE TABLE
    IF NOT EXISTS public.specialist_blocked_slots (
        id TEXT PRIMARY KEY,
        specialist_id TEXT REFERENCES public.specialists (id) ON DELETE CASCADE,
        slot_start TEXT,
        slot_end TEXT,
        reason TEXT,
        created_at TIMESTAMP
        WITH
            TIME ZONE,
            updated_at TIMESTAMP
        WITH
            TIME ZONE,
            sync_status INTEGER DEFAULT 0
    );

CREATE INDEX IF NOT EXISTS specialist_blocked_slots_specialist_id_idx ON public.specialist_blocked_slots (specialist_id);


select count(*) from public.specialists;
