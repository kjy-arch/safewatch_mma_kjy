
CREATE TABLE public.keywords (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  keyword TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.crawled_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_name TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT,
  keyword TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_crawled_posts_detected_at ON public.crawled_posts(detected_at DESC);
CREATE INDEX idx_crawled_posts_status ON public.crawled_posts(status);

ALTER TABLE public.keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crawled_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view keywords" ON public.keywords FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert keywords" ON public.keywords FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update keywords" ON public.keywords FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete keywords" ON public.keywords FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view posts" ON public.crawled_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert posts" ON public.crawled_posts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update posts" ON public.crawled_posts FOR UPDATE TO authenticated USING (true);
