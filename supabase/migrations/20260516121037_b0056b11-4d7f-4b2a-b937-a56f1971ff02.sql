ALTER TABLE public.crawled_posts
  ADD COLUMN IF NOT EXISTS content text,
  ADD COLUMN IF NOT EXISTS author_id text,
  ADD COLUMN IF NOT EXISTS matched_keyword text;

UPDATE public.crawled_posts SET matched_keyword = keyword WHERE matched_keyword IS NULL;