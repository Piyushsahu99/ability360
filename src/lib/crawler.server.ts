// Weekly importer for authentic Indian scholarship / programme / exam / guidance listings.
// Sources are restricted to an admin-managed allowlist of government and trusted portals.
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const FIRECRAWL_V2 = "https://api.firecrawl.dev/v2";
const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

const SOURCES_PER_RUN = 3;
const RESULTS_PER_SOURCE = 4;
const DEFAULT_TTL_DAYS = 30;
const LEASE_MINUTES = 10;

export type CrawlSummary = {
  status: "ok" | "busy" | "paused" | "skipped";
  sources: number;
  found: number;
  saved: number;
  expired: number;
  message?: string;
};

type SourceRow = {
  id: string;
  domain: string;
  label: string;
  category: string;
  query: string;
  region: string;
};

type ExtractedItem = {
  include: boolean;
  title: string;
  summary: string;
  organisation: string;
  benefit: string;
  eligibility: string;
  deadline_label: string;
  deadline_date: string | null;
  region: string;
  tags: string[];
  body: string;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function isAllowedUrl(url: string, domain: string) {
  const host = hostOf(url);
  return host === domain || host.endsWith(`.${domain}`);
}

function clampText(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

/** Keeps a rolling supply of content: never trust a listing without a real title, summary and source link. */
function looksAuthentic(item: ExtractedItem, url: string, domain: string) {
  return (
    item.include &&
    isAllowedUrl(url, domain) &&
    item.title.length >= 8 &&
    item.summary.length >= 40 &&
    item.organisation.length >= 2
  );
}

async function firecrawlSearch(apiKey: string, source: SourceRow) {
  const response = await fetch(`${FIRECRAWL_V2}/search`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `site:${source.domain} ${source.query}`,
      limit: RESULTS_PER_SOURCE,
      lang: "en",
      country: "in",
      tbs: "qdr:y",
      scrapeOptions: { formats: ["markdown"], onlyMainContent: true },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Firecrawl search failed [${response.status}]: ${body}`);
  }

  type Hit = { url?: string; title?: string; markdown?: string; description?: string };
  const payload = (await response.json()) as {
    data?: Hit[] | { web?: Hit[]; news?: Hit[] };
    web?: Hit[];
  };
  const data = payload.data;
  if (Array.isArray(data)) return data;
  return data?.web ?? payload.web ?? [];
}

const SYSTEM_PROMPT = `You verify Indian student listings for a careers platform.
You receive one scraped web page plus its expected category.

For scholarship / program / divyangjan / exam pages, set include=true ONLY when the page describes
ONE specific, real, currently open scheme, programme, internship or examination that a student can act on,
with concrete details (who runs it, who can apply, what it gives).
For the blog category, set include=true when the page is a substantial, genuinely useful guidance article
for Indian college students (a curated list of schemes counts), and false for thin or promotional pages.

Always set include=false for homepages, search/listing/portal pages, login or registration-form pages,
adverts, schemes that have closed, and anything you cannot verify from the page text itself.
Never invent facts: every field must come from the page. Use Indian English and rupee amounts.
Reply with ONLY a JSON object of this exact shape:
{"include":boolean,"title":string,"summary":string,"organisation":string,"benefit":string,
"eligibility":string,"deadline_label":string,"deadline_date":"YYYY-MM-DD"|null,"region":string,
"tags":string[],"body":string}
summary: 1-2 sentences. body: 3-6 short markdown paragraphs explaining what it is, who can apply and how.
region: an Indian state/UT name or "All India". tags: 2-5 short lowercase tags.`;

async function extractItem(
  lovableKey: string,
  source: SourceRow,
  page: { url: string; title?: string; markdown?: string; description?: string },
): Promise<ExtractedItem | null> {
  const content = clampText(page.markdown ?? page.description, 6000);
  if (content.length < 200) return null;

  const response = await fetch(AI_GATEWAY, {
    method: "POST",
    headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3.8-flash",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Source: ${source.label} (${source.domain})\nExpected category: ${source.category}\nURL: ${page.url}\nPage title: ${page.title ?? ""}\n\n${content}`,
        },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    const error = new Error(`AI extraction failed [${response.status}]: ${body}`) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }

  const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const raw = payload.choices?.[0]?.message?.content ?? "";
  const json = raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1);
  if (!json) return null;

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }

  const deadlineDate = clampText(parsed["deadline_date"], 10);
  return {
    include: parsed["include"] === true,
    title: clampText(parsed["title"], 160),
    summary: clampText(parsed["summary"], 400),
    organisation: clampText(parsed["organisation"], 160) || source.label,
    benefit: clampText(parsed["benefit"], 300),
    eligibility: clampText(parsed["eligibility"], 400),
    deadline_label: clampText(parsed["deadline_label"], 120) || "See official site",
    deadline_date: /^\d{4}-\d{2}-\d{2}$/.test(deadlineDate) ? deadlineDate : null,
    region: clampText(parsed["region"], 60) || source.region,
    tags: Array.isArray(parsed["tags"])
      ? (parsed["tags"] as unknown[]).map((tag) => clampText(tag, 32)).filter(Boolean).slice(0, 5)
      : [],
    body: clampText(parsed["body"], 6000),
  };
}

function expiryFor(item: ExtractedItem) {
  if (item.deadline_date) {
    const deadline = new Date(`${item.deadline_date}T23:59:59Z`);
    if (!Number.isNaN(deadline.getTime()) && deadline.getTime() > Date.now()) return deadline.toISOString();
    return null; // already closed — caller drops it
  }
  return new Date(Date.now() + DEFAULT_TTL_DAYS * 86_400_000).toISOString();
}

async function retireExpired() {
  const { data, error } = await supabaseAdmin
    .from("resources")
    .update({ is_published: false })
    .eq("auto_imported", true)
    .eq("is_published", true)
    .lt("expires_at", new Date().toISOString())
    .select("id");
  if (error) throw error;
  return data?.length ?? 0;
}

export async function runResourceCrawl(): Promise<CrawlSummary> {
  const firecrawlKey = process.env["FIRECRAWL_API_KEY"];
  const lovableKey = process.env["LOVABLE_API_KEY"];
  if (!firecrawlKey || !lovableKey) {
    return { status: "skipped", sources: 0, found: 0, saved: 0, expired: 0, message: "Importer keys are not configured." };
  }

  const now = new Date();
  const leaseUntil = new Date(now.getTime() + LEASE_MINUTES * 60_000).toISOString();

  // Single-flight: only one run may hold the lease.
  const { data: leased, error: leaseError } = await supabaseAdmin
    .from("crawl_state")
    .update({ lease_until: leaseUntil, updated_at: now.toISOString() })
    .eq("id", "resources")
    .or(`lease_until.is.null,lease_until.lt.${now.toISOString()}`)
    .select("id, is_paused, pause_reason")
    .maybeSingle();
  if (leaseError) throw leaseError;
  if (!leased) return { status: "busy", sources: 0, found: 0, saved: 0, expired: 0 };

  const paused = leased.is_paused === true;
  const sourceLimit = paused ? 1 : SOURCES_PER_RUN; // paused runs send a single probe only

  let found = 0;
  let saved = 0;
  let expired = 0;
  let pauseReason: string | null = null;

  try {
    expired = await retireExpired();

    const { data: sources, error: sourcesError } = await supabaseAdmin
      .from("crawl_sources")
      .select("id, domain, label, category, query, region")
      .eq("is_active", true)
      .order("last_crawled_at", { ascending: true, nullsFirst: true })
      .limit(sourceLimit);
    if (sourcesError) throw sourcesError;

    for (const source of (sources ?? []) as SourceRow[]) {
      let pages: Awaited<ReturnType<typeof firecrawlSearch>> = [];
      try {
        pages = await firecrawlSearch(firecrawlKey, source);
      } catch (error) {
        console.error(`[crawl] ${source.domain}`, error);
        continue;
      }

      for (const page of pages) {
        const url = typeof page.url === "string" ? page.url : "";
        if (!url || !isAllowedUrl(url, source.domain)) continue;
        if (/\.pdf($|\?)/i.test(url)) continue; // keep the library to readable web pages
        found += 1;

        let item: ExtractedItem | null = null;
        try {
          item = await extractItem(lovableKey, source, { ...page, url });
        } catch (error) {
          const status = (error as { status?: number }).status;
          if (status === 402 || status === 403) {
            pauseReason = `AI service unavailable (${status}).`;
            break;
          }
          console.error(`[crawl] extract ${url}`, error);
          continue;
        }

        if (!item || !looksAuthentic(item, url, source.domain)) {
          console.log(`[crawl] rejected ${url}`, item ? { include: item.include, title: item.title } : "no extraction");
          continue;
        }

        const expiresAt = expiryFor(item);
        if (!expiresAt) {
          console.log(`[crawl] closed ${url} (${item.deadline_date})`);
          continue; // deadline already passed
        }

        const nowIso = new Date().toISOString();
        const { error: upsertError } = await supabaseAdmin.from("resources").upsert(
          {
            slug: `${slugify(item.title)}-${slugify(source.domain).slice(0, 12)}`,
            title: item.title,
            category: source.category,
            summary: item.summary,
            body: item.body,
            organisation: item.organisation,
            benefit: item.benefit,
            eligibility: item.eligibility,
            deadline_label: item.deadline_label,
            region: item.region,
            tags: item.tags,
            link: url,
            image_key: `${source.category}s`,
            is_published: true,
            auto_imported: true,
            source_url: url,
            source_domain: source.domain,
            expires_at: expiresAt,
            last_seen_at: nowIso,
            updated_at: nowIso,
          },
          { onConflict: "source_url" },
        );

        if (upsertError) {
          console.error(`[crawl] save ${url}`, upsertError);
          continue;
        }
        saved += 1;
      }

      await supabaseAdmin
        .from("crawl_sources")
        .update({ last_crawled_at: new Date().toISOString() })
        .eq("id", source.id);

      if (pauseReason) break;
    }

    const summary: CrawlSummary = {
      status: pauseReason ? "paused" : "ok",
      sources: sourceLimit,
      found,
      saved,
      expired,
      ...(pauseReason ? { message: pauseReason } : {}),
    };

    await supabaseAdmin
      .from("crawl_state")
      .update({
        lease_until: null,
        last_run_at: new Date().toISOString(),
        last_result: summary,
        is_paused: pauseReason !== null,
        pause_reason: pauseReason,
        updated_at: new Date().toISOString(),
      })
      .eq("id", "resources");

    return summary;
  } catch (error) {
    await supabaseAdmin
      .from("crawl_state")
      .update({
        lease_until: null,
        last_run_at: new Date().toISOString(),
        last_result: { status: "error", message: String(error) },
        updated_at: new Date().toISOString(),
      })
      .eq("id", "resources");
    throw error;
  }
}
