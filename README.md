# IEEE Funding Digest / FundUndo

Scrapes a curated list of IEEE / IEEE-affiliated funding pages, uses an LLM to
pull out structured opportunities (title, amount, deadline, summary, link),
diffs them against what was seen last run, emails you a digest of what's new
or changed, and regenerates **FundUndo** — a static website (`docs/index.html`)
showing every currently-open opportunity, grouped by society, with working
search and filter chips.

**Why scraping instead of RSS:** IEEE has no unified feed for funding
opportunities — grants, scholarships, and travel awards are spread across the
IEEE Foundation site, `students.ieee.org`, and dozens of individual society
pages, each formatted differently. This tracks a list of pages you choose and
uses an LLM to normalize whatever it finds into a consistent format.

## Setup

```bash
npm install
cp .env.example .env
```

Then fill in `.env`:

- **LLM_BASE_URL / LLM_API_KEY / LLM_MODEL** — any OpenAI-compatible
  `/chat/completions` endpoint works, so you can use a free provider instead
  of a paid one. `.env.example` has ready-to-use blocks for:
  - **Groq** (default, recommended) — fast, free, no card. Key from
    [console.groq.com/keys](https://console.groq.com/keys).
  - **OpenRouter** — many `:free` models, smaller daily quota.
  - **Google Gemini** (OpenAI-compat endpoint) — large token budget.
  - **Local Ollama** — fully free, nothing leaves your machine, no API key.
- **SMTP_USER / SMTP_PASS** — e.g. a Gmail address + App Password.
- **DIGEST_TO** — where the digest gets sent.

Free tiers are rate-limited, and the exact numbers vary by model and change
over time — check current limits at
[console.groq.com/docs/rate-limits](https://console.groq.com/docs/rate-limits)
before adding many more sources. For a handful of sources run occasionally,
any of Groq's free models are comfortably enough. `index.ts` also paces
requests (`REQUEST_DELAY_MS`, default 2s) and retries on 429s with backoff.

## Usage

```bash
# Preview what would be extracted/sent, without emailing or updating state:
npm run dev:dry

# Real run: fetches sources, emails a digest of new/changed items, saves state:
npm run dev

# Or build once and run compiled JS (e.g. from cron):
npm run build
npm start
```

The first real run will treat everything found as "new" (nothing seen yet).
After that, only genuinely new or changed opportunities are included.

## Adding more sources

Edit `sources.json` — it's a plain array, add as many pages as you like:

```json
{
  "name": "Some IEEE Society - Grants Page",
  "url": "https://example.ieee-society.org/grants",
  "society": "Some IEEE Society",
  "notes": "Optional context for your own reference."
}
```

`society` controls which section of the FundUndo site the opportunity
lands under (and its color/icon) — add a matching entry to `SOCIETY_META`
in `src/site.ts` for a new society, or it'll render with a generic fallback
look rather than breaking the build. No other code changes needed; each
source is fetched and extracted independently, so a bad/unreachable URL
just logs an error and the rest still run.

## The FundUndo site

Every real (non-dry) run regenerates `docs/index.html` from the complete
current set of opportunities — not just what's new — so it always reflects
everything currently open, independent of the diff-based email logic.
`docs/` maps directly to GitHub Pages' "deploy from `/docs` on `main`"
option, so no build step or extra branch is needed on GitHub's side.

## Scheduling & auto-publishing

`scripts/publish.sh` does the full loop: builds the project, runs it for
real, and — only if the site actually changed — commits and pushes
`docs/` so GitHub Pages redeploys automatically. It sets its own `PATH`
since cron's environment is minimal.

Install it as a daily cron job:

```
0 8 * * * /Users/agu/Project-FT/scripts/publish.sh >> /Users/agu/Project-FT/cron.log 2>&1
```

Pushing needs its own credentials since cron runs unattended — this repo
uses a dedicated SSH deploy key (`~/.ssh/fundundo_deploy_key`, write access
scoped to just this repo) rather than your personal SSH key or a broad
personal access token, set as this repo's `core.sshCommand`.

## How it works

```
sources.json → fetch each page (fetcher.ts)
             → strip to text + links
             → LLM extracts structured opportunities (extractor.ts)
             → follow each opportunity's own link to fill in any amount/deadline
               still missing (enrichMissingFields in index.ts), capped per run
               via MAX_ENRICHMENT_FETCHES (default 40)
             → diff against data/seen.json (store.ts) → email digest (digest.ts, mailer.ts)
             → regenerate docs/index.html from the full current set (site.ts)
             → save updated seen-state
```

`data/seen.json` is the dedupe store — tracked in git (not gitignored),
since GitHub Actions runs from a clean checkout each time and needs this
state to persist between scheduled runs. Delete it locally to force
everything to be reported as "new" again.

## Notes / limitations

- Pages that require JavaScript to render their content won't work with the
  plain `fetch` used here — if a source (or an opportunity's own linked page,
  for the enrichment step above) returns near-empty text, it likely needs a
  headless browser (not included in this v1). Some IEEE application portals
  (e.g. WizeHive-hosted ones) are JS-rendered and will stay "Not specified"
  for this reason even after the enrichment pass.
- A backlog of missing amounts/deadlines works down gradually, at most
  `MAX_ENRICHMENT_FETCHES` per run — expect it to take a few runs to fully
  catch up after adding a lot of new sources at once.
- Extraction quality depends on the LLM reading the page correctly; spot-check
  a `--dry-run` after adding a new source before trusting it unattended.
