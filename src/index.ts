import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Source, Opportunity } from "./types.js";
import { fetchPage } from "./fetcher.js";
import { extractOpportunities } from "./extractor.js";
import { makeId, loadSeenStore, saveSeenStore, diffAgainstStore } from "./store.js";
import { buildDigestHtml, buildDigestText } from "./digest.js";
import { sendDigestEmail } from "./mailer.js";
import { writeSiteHtml } from "./site.js";

const DRY_RUN = process.argv.includes("--dry-run");
// Gentle pacing between LLM calls so we don't trip free-tier rate limits
// (e.g. Groq's free tier is 30 req/min - trivial for a handful of sources,
// but this keeps it safe if you add many more).
const REQUEST_DELAY_MS = Number(process.env.REQUEST_DELAY_MS || 8000);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function loadSources(): Promise<Source[]> {
  const raw = await readFile(path.join(process.cwd(), "sources.json"), "utf-8");
  return JSON.parse(raw) as Source[];
}

async function main() {
  const sources = await loadSources();
  console.log(`Loaded ${sources.length} source(s).`);

  const allOpportunities: Opportunity[] = [];

  for (const source of sources) {
    try {
      console.log(`Fetching: ${source.name} (${source.url})`);
      const page = await fetchPage(source.url);
      const raw = await extractOpportunities(source, page);
      console.log(`  -> extracted ${raw.length} opportunity(ies)`);

      for (const item of raw) {
        allOpportunities.push({
          id: makeId(source.url, item.title),
          sourceName: source.name,
          sourceUrl: source.url,
          society: source.society,
          title: item.title,
          amount: item.amount,
          deadline: item.deadline,
          summary: item.summary,
          link: item.link || source.url,
        });
      }
    } catch (err) {
      console.error(`  ! failed for ${source.name}:`, (err as Error).message);
    }
    await sleep(REQUEST_DELAY_MS);
  }

  const seenStore = await loadSeenStore();
  const { changes, updatedStore } = diffAgainstStore(allOpportunities, seenStore);

  console.log(`\n${changes.length} new/changed opportunity(ies) found.`);

  if (DRY_RUN) {
    if (changes.length === 0) {
      console.log("Nothing new/changed - nothing to preview.");
      return;
    }
    const text = buildDigestText(changes);
    console.log("\n--dry-run set, not sending email, updating the store, or regenerating the site. Digest preview:\n");
    console.log(text);
    return;
  }

  // Real run: try to regenerate the site from the full current picture,
  // whether or not anything is new/changed since last time - the site
  // should always reflect everything that's currently open, not just deltas.
  // writeSiteHtml itself refuses to publish a suspiciously empty/degraded
  // run over a known-good site (see site.ts) - a bad rate-limited day should
  // never take the live site down, just skip that day's update.
  const siteResult = await writeSiteHtml(allOpportunities);
  if (siteResult.published) {
    console.log(`Site regenerated at docs/index.html (${allOpportunities.length} total open opportunities).`);
  } else {
    console.warn(`Site NOT updated this run: ${siteResult.reason}`);
  }

  if (changes.length === 0) {
    console.log("Nothing new/changed - no digest email sent.");
    await saveSeenStore(updatedStore);
    return;
  }

  const html = buildDigestHtml(changes);
  const text = buildDigestText(changes);
  const subject = `IEEE Funding Digest - ${changes.filter((c) => c.kind === "new").length} new, ${changes.filter((c) => c.kind === "changed").length} updated`;

  // Email is a nice-to-have on top of the site, not the core function - an
  // unconfigured/failing SMTP setup should never block the site from staying
  // current or the store from saving (which is what used to happen: a thrown
  // error here skipped saveSeenStore entirely, so the next run would just
  // see the exact same "new" items again, forever).
  try {
    await sendDigestEmail(subject, html, text);
    console.log("Digest emailed.");
  } catch (err) {
    console.warn("Digest email NOT sent:", (err as Error).message);
  }

  await saveSeenStore(updatedStore);
  console.log("Store updated.");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
