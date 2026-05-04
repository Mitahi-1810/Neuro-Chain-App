-- RLS policies for all tables.
-- Cast both sides to text so policies work regardless of whether the column is UUID or TEXT.

-- ─── USERS ───────────────────────────────────────────────────────────────────
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can read all user rows (needed for lookups).
CREATE POLICY "users: authenticated read"
  ON public.users FOR SELECT
  TO authenticated
  USING (true);

-- A user can only insert / update their own row.
CREATE POLICY "users: own insert"
  ON public.users FOR INSERT
  TO authenticated
  WITH CHECK (id::text = auth.uid()::text);

CREATE POLICY "users: own update"
  ON public.users FOR UPDATE
  TO authenticated
  USING (id::text = auth.uid()::text)
  WITH CHECK (id::text = auth.uid()::text);

-- ─── CHILDREN ────────────────────────────────────────────────────────────────
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;

-- Parent can read / write their own children rows.
CREATE POLICY "children: parent read"
  ON public.children FOR SELECT
  TO authenticated
  USING (parent_id::text = auth.uid()::text);

CREATE POLICY "children: parent insert"
  ON public.children FOR INSERT
  TO authenticated
  WITH CHECK (parent_id::text = auth.uid()::text);

CREATE POLICY "children: parent update"
  ON public.children FOR UPDATE
  TO authenticated
  USING (parent_id::text = auth.uid()::text)
  WITH CHECK (parent_id::text = auth.uid()::text);

-- Specialists can read children for their appointments.
CREATE POLICY "children: specialist read via appointment"
  ON public.children FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.appointments a
      JOIN public.specialists s ON s.id = a.specialist_id
      WHERE a.child_id = children.id
        AND s.user_id::text = auth.uid()::text
    )
  );

-- ─── ACTIVITIES_LOG ──────────────────────────────────────────────────────────
ALTER TABLE public.activities_log ENABLE ROW LEVEL SECURITY;

-- Parent can manage activity logs for their own children.
CREATE POLICY "activities_log: parent access"
  ON public.activities_log FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.children c
      WHERE c.id = activities_log.child_id
        AND c.parent_id::text = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.children c
      WHERE c.id = activities_log.child_id
        AND c.parent_id::text = auth.uid()::text
    )
  );

-- ─── ASSESSMENTS ─────────────────────────────────────────────────────────────
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "assessments: parent access"
  ON public.assessments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.children c
      WHERE c.id = assessments.child_id
        AND c.parent_id::text = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.children c
      WHERE c.id = assessments.child_id
        AND c.parent_id::text = auth.uid()::text
    )
  );

-- Specialists can read assessments for their appointment children.
CREATE POLICY "assessments: specialist read"
  ON public.assessments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.appointments a
      JOIN public.specialists s ON s.id = a.specialist_id
      WHERE a.child_id = assessments.child_id
        AND s.user_id::text = auth.uid()::text
    )
  );

-- ─── SPECIALISTS ─────────────────────────────────────────────────────────────
ALTER TABLE public.specialists ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read ACTIVE specialists (for booking).
CREATE POLICY "specialists: public read active"
  ON public.specialists FOR SELECT
  TO authenticated
  USING (status = 'ACTIVE');

-- A specialist can always read their own row regardless of status.
CREATE POLICY "specialists: own read"
  ON public.specialists FOR SELECT
  TO authenticated
  USING (user_id::text = auth.uid()::text);

-- A specialist can insert their own profile (status starts as PENDING).
CREATE POLICY "specialists: own insert"
  ON public.specialists FOR INSERT
  TO authenticated
  WITH CHECK (user_id::text = auth.uid()::text);

-- A specialist can update their own profile.
CREATE POLICY "specialists: own update"
  ON public.specialists FOR UPDATE
  TO authenticated
  USING (user_id::text = auth.uid()::text)
  WITH CHECK (user_id::text = auth.uid()::text);

-- ─── APPOINTMENTS ─────────────────────────────────────────────────────────────
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Parent can read / manage their own appointments.
CREATE POLICY "appointments: parent access"
  ON public.appointments FOR ALL
  TO authenticated
  USING (parent_id::text = auth.uid()::text)
  WITH CHECK (parent_id::text = auth.uid()::text);

-- Specialist can read appointments assigned to them.
CREATE POLICY "appointments: specialist read"
  ON public.appointments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.specialists s
      WHERE s.id = appointments.specialist_id
        AND s.user_id::text = auth.uid()::text
    )
  );

-- Specialist can update status / notes on their appointments.
CREATE POLICY "appointments: specialist update"
  ON public.appointments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.specialists s
      WHERE s.id = appointments.specialist_id
        AND s.user_id::text = auth.uid()::text
    )
  );

-- ─── CLINICAL_SOAP_NOTES ─────────────────────────────────────────────────────
ALTER TABLE public.clinical_soap_notes ENABLE ROW LEVEL SECURITY;

-- Specialist who owns the appointment can read / write SOAP notes.
CREATE POLICY "soap_notes: specialist access"
  ON public.clinical_soap_notes FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.appointments a
      JOIN public.specialists s ON s.id = a.specialist_id
      WHERE a.id = clinical_soap_notes.appointment_id
        AND s.user_id::text = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.appointments a
      JOIN public.specialists s ON s.id = a.specialist_id
      WHERE a.id = clinical_soap_notes.appointment_id
        AND s.user_id::text = auth.uid()::text
    )
  );

-- Parent can read (not write) SOAP notes for their child's appointments.
CREATE POLICY "soap_notes: parent read"
  ON public.clinical_soap_notes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.id = clinical_soap_notes.appointment_id
        AND a.parent_id::text = auth.uid()::text
    )
  );

-- ─── SPECIALIST_BLOCKED_SLOTS ────────────────────────────────────────────────
ALTER TABLE public.specialist_blocked_slots ENABLE ROW LEVEL SECURITY;

-- Specialist manages their own blocked slots.
CREATE POLICY "blocked_slots: specialist access"
  ON public.specialist_blocked_slots FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.specialists s
      WHERE s.id = specialist_blocked_slots.specialist_id
        AND s.user_id::text = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.specialists s
      WHERE s.id = specialist_blocked_slots.specialist_id
        AND s.user_id::text = auth.uid()::text
    )
  );

-- Parents / others can read blocked slots to know availability.
CREATE POLICY "blocked_slots: authenticated read"
  ON public.specialist_blocked_slots FOR SELECT
  TO authenticated
  USING (true);
