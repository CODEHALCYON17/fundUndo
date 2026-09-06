import type { FetchedPage } from "./fetcher.js";
import type { Source } from "./types.js";

// Generic OpenAI-compatible chat-completions client. Works unchanged with
// Groq, OpenRouter, Google's Gemini OpenAI-compat endpoint, a local Ollama
// server, or anything else speaking the same wire format — swap via .env.
const LLM_BASE_URL = process.env.LLM_BASE_URL || "https://api.groq.com/openai/v1";
const LLM_API_KEY = process.env.LLM_API_KEY;
const LLM_MODEL = process.env.LLM_MODEL || "openai/gpt-oss-120b";

// Groq's free/on-demand tier caps gpt-oss-120b at 8,000 tokens TOTAL per
// request (prompt + completion combined) - go over and you get a hard 413,
// not a retryable 429. The PAGE TEXT/LINKS slice sizes below and max_tokens
// in chatComplete() are sized to stay comfortably under that with margin to
// spare for very content-heavy pages. If you switch LLM_MODEL to something
// with a bigger budget, these can be loosened.

interface RawExtractedItem {
  title: string;
  amount: string;
  deadline: string;
  summary: string;
  link: string;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// A single source demanding a very long Retry-After (we've seen 1000s+
// during heavy free-tier usage) shouldn't be allowed to block the entire
// run - with 28 sources, a few of those would blow past any sane job
// timeout and mean NOTHING gets published, not even the sources that
// would have succeeded quickly. Past this cap, skip the source for this
// run instead of waiting it out (it'll just get picked up again next run).
const MAX_RETRY_WAIT_SECONDS = Number(process.env.MAX_RETRY_WAIT_SECONDS || 120);

/**
 * Calls the configured OpenAI-compatible /chat/completions endpoint, with a
 * couple of retries on 429 (free-tier rate limits are easy to hit).
 */
async function chatComplete(prompt: string): Promise<string> {
  if (!LLM_API_KEY) {
    throw new Error(
      "Missing LLM_API_KEY. Set it in .env (see .env.example) - e.g. a free Groq key from https://console.groq.com/keys"
    );
  }

  // gpt-oss models on Groq are reasoning models: without a token budget and
  // reasoning turned down, they can burn the whole response on chain-of-thought
  // and truncate the actual JSON answer mid-string.
  const isGptOss = LLM_MODEL.includes("gpt-oss");
  const body: Record<string, unknown> = {
    model: LLM_MODEL,
    temperature: 0,
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  };
  if (isGptOss) {
    body.reasoning_effort = "low";
    body.include_reasoning = false;
  }

  const maxAttempts = 4;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const res = await fetch(`${LLM_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LLM_API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    if (res.status === 429 && attempt < maxAttempts) {
      const retryAfter = Number(res.headers.get("retry-after")) || attempt * 5;
      if (retryAfter > MAX_RETRY_WAIT_SECONDS) {
        throw new Error(
          `rate limited, requested ${retryAfter}s wait exceeds the ${MAX_RETRY_WAIT_SECONDS}s cap - skipping this source for now rather than blocking the whole run`
        );
      }
      console.warn(`  rate limited, retrying in ${retryAfter}s (attempt ${attempt}/${maxAttempts})`);
      await sleep(retryAfter * 1000);
      continue;
    }

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`LLM request failed: ${res.status} ${res.statusText} - ${body.slice(0, 300)}`);
    }

    const json = await res.json();
    return json.choices?.[0]?.message?.content ?? "";
  }

  throw new Error("LLM request failed after retries.");
}

/**
 * Asks the LLM to pull out distinct funding/grant/scholarship/award
 * opportunities from a page's text, matching each to a link where possible.
 */
export async function extractOpportunities(
  source: Source,
  page: FetchedPage
): Promise<RawExtractedItem[]> {
  const linksBlock = page.links
    .slice(0, 200) // keep prompt bounded on link-heavy pages
    .map((l) => `- "${l.text}" -> ${l.href}`)
    .join("\n");

  const prompt = `You are extracting funding opportunities (grants, scholarships, fellowships, travel awards, or similar) from a page belonging to IEEE or an IEEE-affiliated organization.

Page name: ${source.name}
Page URL: ${source.url}

PAGE TEXT:
"""
${page.text.slice(0, 8000)}
"""

LINKS FOUND ON PAGE (text -> href):
"""
${linksBlock.slice(0, 2000)}
"""

Identify every DISTINCT funding opportunity named on this page — something a person or team can actively APPLY for to RECEIVE MONEY supporting their study, research, travel, or project (a scholarship, grant, fellowship, or travel award).

Do NOT include honorific/recognition awards that merely recognize past achievement and aren't something you apply for funding through — e.g. best-paper awards, career-achievement awards, meritorious-service awards, chapter-leadership awards, "Pioneer in X" awards, or similar plaques/prizes given for prior accomplishment. Also skip generic navigation items. If a page is entirely this kind of recognition award with no actual funding/scholarship/grant program, respond with an empty array: [].

Some pages list an archive of many individual past-funded instances (e.g. years of past summer schools, past conferences, or past event recipients) below the description of the funding program itself. Do NOT create a separate entry for each historical instance — collapse them into the one ongoing program/track that funds them (e.g. one entry per named track/tier, not one per year or one per past event).

For each genuine funding opportunity, output:
- title: the opportunity's name, exactly as written
- amount: the funding amount/range as stated (e.g. "$5,000-$50,000"). If not stated on this page, use "Not specified"
- deadline: the application deadline/cycle as stated (e.g. "26 March 2026" or "Rolling"). If not stated, use "Not specified"
- summary: one or two plain sentences on what it funds / who it's for, based only on what's on the page
- link: the best matching URL from the links list for this specific opportunity (its "learn more" / "apply" link). If no specific link matches, use the page URL itself: ${source.url}

Respond with ONLY a JSON array of objects with exactly these keys: title, amount, deadline, summary, link. No markdown fences, no commentary, no explanation before or after. If the page lists no genuine funding opportunities, respond with an empty array: []`;

  const content = await chatComplete(prompt);

  // Free/open models are more prone to wrapping JSON in prose or fences than
  // Claude was — pull out the first top-level [...] block defensively.
  let raw = content.trim().replace(/^```(json)?/i, "").replace(/```$/, "").trim();
  const start = raw.indexOf("[");
  const end = raw.lastIndexOf("]");
  if (start !== -1 && end !== -1 && end > start) {
    raw = raw.slice(start, end + 1);
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is RawExtractedItem =>
        item && typeof item.title === "string" && item.title.trim().length > 0
    );
  } catch (err) {
    console.error(`Failed to parse extraction JSON for ${source.name}:`, err);
    console.error("Raw response was:", content.slice(0, 500));
    return [];
  }
}
