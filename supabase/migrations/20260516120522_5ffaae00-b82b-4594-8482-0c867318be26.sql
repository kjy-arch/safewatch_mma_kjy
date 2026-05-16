ALTER TABLE public.keywords
  ADD COLUMN IF NOT EXISTS severity text NOT NULL DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

ALTER TABLE public.keywords DROP CONSTRAINT IF EXISTS keywords_severity_check;
ALTER TABLE public.keywords ADD CONSTRAINT keywords_severity_check CHECK (severity IN ('low','medium','high'));