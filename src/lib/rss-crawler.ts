import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

type CrawledPostInsert = {
  site_name: string;
  title: string;
  content: string | null;
  url: string | null;
  author_id: null;
  matched_keyword: string;
  keyword: string;
  status: "pending";
  detected_at: string;
};

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'");
}

function extractTag(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i"));
  if (!m) return "";
  return m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim();
}

function parseRssItems(xml: string, keyword: string): CrawledPostInsert[] {
  const items = xml.match(/<item>([\s\S]*?)<\/item>/gi) ?? [];
  return items.map((item) => {
    const rawTitle = extractTag(item, "title").replace(/<[^>]+>/g, "");
    const link = extractTag(item, "link");
    const desc = extractTag(item, "description").replace(/<[^>]+>/g, "");
    const pubDate = extractTag(item, "pubDate");
    const source = extractTag(item, "source");

    let detectedAt = new Date().toISOString();
    if (pubDate) {
      const parsed = new Date(pubDate);
      if (!isNaN(parsed.getTime())) detectedAt = parsed.toISOString();
    }

    return {
      site_name: decodeEntities(source) || "Google 뉴스",
      title: decodeEntities(rawTitle).slice(0, 255) || "(제목 없음)",
      content: decodeEntities(desc).slice(0, 1000) || null,
      url: link.trim() || null,
      author_id: null,
      matched_keyword: keyword,
      keyword,
      status: "pending" as const,
      detected_at: detectedAt,
    };
  });
}

export const runRssCrawl = createServerFn({ method: "POST" }).handler(async () => {
  const { data: kws, error: kwErr } = await supabaseAdmin
    .from("keywords")
    .select("keyword")
    .eq("is_active", true);

  if (kwErr) throw kwErr;
  if (!kws || kws.length === 0) throw new Error("NO_ACTIVE_KEYWORDS");

  const allRows: CrawledPostInsert[] = [];

  await Promise.all(
    kws.map(async ({ keyword }) => {
      const feedUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(keyword)}&hl=ko&gl=KR&ceid=KR:ko`;
      try {
        const res = await fetch(feedUrl, {
          headers: { "User-Agent": "SafeWatch/1.0 RSS Crawler" },
        });
        if (!res.ok) return;
        const xml = await res.text();
        const items = parseRssItems(xml, keyword);
        allRows.push(...items.slice(0, 5));
      } catch {
        // skip feeds that fail silently; other keywords still processed
      }
    }),
  );

  if (allRows.length === 0) return 0;

  const { error: insErr } = await supabaseAdmin.from("crawled_posts").insert(allRows);
  if (insErr) throw insErr;

  return allRows.length;
});