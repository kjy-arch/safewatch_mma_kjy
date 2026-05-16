CREATE TABLE IF NOT EXISTS public.members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'viewer',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT members_role_check CHECK (role IN ('admin','viewer'))
);

ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view members"
  ON public.members FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert members"
  ON public.members FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update members"
  ON public.members FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete members"
  ON public.members FOR DELETE TO authenticated USING (true);