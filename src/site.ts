import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Opportunity } from "./types.js";

const SITE_DIR = path.join(process.cwd(), "docs");
const META_PATH = path.join(process.cwd(), "data", "site-meta.json");

interface SiteMeta {
  lastCount: number;
  lastGeneratedAt: string;
}

async function loadSiteMeta(): Promise<SiteMeta | null> {
  try {
    return JSON.parse(await readFile(META_PATH, "utf-8")) as SiteMeta;
  } catch {
    return null;
  }
}

async function saveSiteMeta(meta: SiteMeta): Promise<void> {
  await mkdir(path.dirname(META_PATH), { recursive: true });
  await writeFile(META_PATH, JSON.stringify(meta, null, 2), "utf-8");
}

/** Visual identity per society/board group. Add an entry here whenever a new
 * `society` value shows up in sources.json, or it'll fall back to a generic
 * look (see DEFAULT_META below) rather than breaking the build. */
const SOCIETY_META: Record<string, { tag: string; hue: number; icon: string }> = {
  "IEEE Foundation": {
    tag: "FOUNDATION",
    hue: 250,
    icon: `<path d="M4 8L11 3L18 8" stroke="{{c}}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><line x1="4" y1="8" x2="18" y2="8" stroke="{{c}}" stroke-width="1.6" stroke-linecap="round"/><line x1="5.5" y1="8" x2="5.5" y2="16" stroke="{{c}}" stroke-width="1.6" stroke-linecap="round"/><line x1="11" y1="8" x2="11" y2="16" stroke="{{c}}" stroke-width="1.6" stroke-linecap="round"/><line x1="16.5" y1="8" x2="16.5" y2="16" stroke="{{c}}" stroke-width="1.6" stroke-linecap="round"/><line x1="3.5" y1="16.5" x2="18.5" y2="16.5" stroke="{{c}}" stroke-width="1.6" stroke-linecap="round"/>`,
  },
  "Humanitarian Technologies Board": {
    tag: "HTB",
    hue: 150,
    icon: `<path d="M11 18C11 18 3 13 3 7.5C3 4.8 5.1 3 7.3 3C9 3 10.3 4 11 5.2C11.7 4 13 3 14.7 3C16.9 3 19 4.8 19 7.5C19 13 11 18 11 18Z" stroke="{{c}}" stroke-width="1.5" stroke-linejoin="round"/>`,
  },
  "Signal Processing Society": {
    tag: "SPS",
    hue: 300,
    icon: `<path d="M2 11H5L7 5L10 17L13 8L15 14L17 11H20" stroke="{{c}}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`,
  },
  "Robotics & Automation Society": {
    tag: "RAS",
    hue: 65,
    icon: `<circle cx="11" cy="7" r="3" stroke="{{c}}" stroke-width="1.6"/><line x1="11" y1="10" x2="11" y2="14" stroke="{{c}}" stroke-width="1.6" stroke-linecap="round"/><line x1="11" y1="14" x2="6" y2="19" stroke="{{c}}" stroke-width="1.6" stroke-linecap="round"/><line x1="11" y1="14" x2="16" y2="19" stroke="{{c}}" stroke-width="1.6" stroke-linecap="round"/>`,
  },
  "Antennas & Propagation Society": {
    tag: "AP-S",
    hue: 20,
    icon: `<line x1="11" y1="4" x2="11" y2="20" stroke="{{c}}" stroke-width="1.6" stroke-linecap="round"/><path d="M6 8C6 5 8.2 3 11 3C13.8 3 16 5 16 8" stroke="{{c}}" stroke-width="1.6" stroke-linecap="round"/><path d="M3 8C3 3.5 6.5 1 11 1C15.5 1 19 3.5 19 8" stroke="{{c}}" stroke-width="1.4" stroke-linecap="round" opacity="0.6"/><circle cx="11" cy="20" r="1.6" fill="{{c}}"/>`,
  },
  "Computer Society": {
    tag: "CS",
    hue: 335,
    icon: `<rect x="6" y="6" width="10" height="10" rx="1.5" stroke="{{c}}" stroke-width="1.6"/><rect x="9" y="9" width="4" height="4" stroke="{{c}}" stroke-width="1.3"/><line x1="11" y1="1.5" x2="11" y2="6" stroke="{{c}}" stroke-width="1.4" stroke-linecap="round"/><line x1="11" y1="16" x2="11" y2="20.5" stroke="{{c}}" stroke-width="1.4" stroke-linecap="round"/><line x1="1.5" y1="11" x2="6" y2="11" stroke="{{c}}" stroke-width="1.4" stroke-linecap="round"/><line x1="16" y1="11" x2="20.5" y2="11" stroke="{{c}}" stroke-width="1.4" stroke-linecap="round"/>`,
  },
  "Power & Energy Society": {
    tag: "PES",
    hue: 100,
    icon: `<path d="M12 2L4 12H10L9 20L18 9H12L12 2Z" stroke="{{c}}" stroke-width="1.5" stroke-linejoin="round"/>`,
  },
  "Communications Society": {
    tag: "COMSOC",
    hue: 205,
    icon: `<circle cx="11" cy="15" r="1.8" fill="{{c}}"/><path d="M6.5 12C8 10 14 10 15.5 12" stroke="{{c}}" stroke-width="1.5" stroke-linecap="round"/><path d="M3.5 8.5C7 4.5 15 4.5 18.5 8.5" stroke="{{c}}" stroke-width="1.4" stroke-linecap="round" opacity="0.65"/>`,
  },
  "Young Professionals": {
    tag: "YP",
    hue: 165,
    icon: `<path d="M4 18L13 9" stroke="{{c}}" stroke-width="1.6" stroke-linecap="round"/><path d="M9 9H14V14" stroke="{{c}}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="17" cy="5" r="2" stroke="{{c}}" stroke-width="1.4"/>`,
  },
  "IEEE-wide": {
    tag: "IEEE",
    hue: 235,
    icon: `<circle cx="11" cy="11" r="8" stroke="{{c}}" stroke-width="1.6"/><ellipse cx="11" cy="11" rx="3.2" ry="8" stroke="{{c}}" stroke-width="1.3"/><line x1="3" y1="11" x2="19" y2="11" stroke="{{c}}" stroke-width="1.3"/>`,
  },
};

const DEFAULT_META = { tag: "OTHER", hue: 60, icon: `<circle cx="11" cy="11" r="8" stroke="{{c}}" stroke-width="1.6"/>` };

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(s: string): string {
  // For use inside a single-quoted HTML attribute (data-search).
  return escapeHtml(s).replace(/'/g, "&#39;");
}

function iconSvg(society: string, hex: string): string {
  const meta = SOCIETY_META[society] || DEFAULT_META;
  return `<svg width="22" height="22" viewBox="0 0 22 22" fill="none" style="flex-shrink:0;">${meta.icon.replace(/\{\{c\}\}/g, hex)}</svg>`;
}

function cardHtml(opp: Opportunity, hex: string, featured: boolean): string {
  const bg = featured
    ? `oklch(93% 0.045 ${SOCIETY_META[opp.society]?.hue ?? DEFAULT_META.hue} / 0.5); border:1.5px solid oklch(78% 0.09 ${SOCIETY_META[opp.society]?.hue ?? DEFAULT_META.hue})`
    : `oklch(99% 0.01 85); border:1.5px solid oklch(88% 0.02 75)`;
  const titleSize = featured ? "19px" : "16px";
  const rotate = featured ? "" : `transform:rotate(${(((opp.id.charCodeAt(0) % 5) - 2) * 0.4).toFixed(1)}deg);`;
  return `
        <div class="fu-card" data-search="${escapeAttr((opp.title + " " + opp.summary).toLowerCase())}" style="background:${bg}; border-radius:14px; padding:${featured ? 24 : 20}px; display:flex; flex-direction:column; gap:10px; ${rotate}">
          <div style="font-family:'Bricolage Grotesque', serif; font-weight:700; font-size:${titleSize}; color:oklch(19% 0.025 50); line-height:1.3;">${escapeHtml(opp.title)}</div>
          <div style="display:flex; align-items:center; gap:10px; font-size:13px; font-weight:600; flex-wrap:wrap;">
            <span style="color:oklch(46% 0.16 38); font-weight:800;">${escapeHtml(opp.amount)}</span>
            <span style="color:oklch(70% 0.02 60);">·</span>
            <span style="color:oklch(42% 0.025 55);">${escapeHtml(opp.deadline)}</span>
          </div>
          <p style="margin:0; font-size:13.5px; color:oklch(38% 0.03 55); line-height:1.55;">${escapeHtml(opp.summary)}</p>
          <a href="${escapeAttr(opp.link)}" target="_blank" rel="noopener" class="fu-link" style="margin-top:auto; padding-top:4px; font-size:13px; font-weight:700; color:oklch(46% 0.16 38); display:flex; align-items:center; gap:5px;">
            View call
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M2 7H12M8 3L12 7L8 11" stroke="oklch(46% 0.16 38)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </a>
        </div>`;
}

function sectionHtml(society: string, opportunities: Opportunity[], index: number): string {
  const meta = SOCIETY_META[society] || DEFAULT_META;
  const hex = `oklch(38% 0.13 ${meta.hue})`;
  const cards = opportunities
    .map((opp, i) => cardHtml(opp, hex, i === 0))
    .join("");
  return `
    <section class="fu-section" data-society="${escapeAttr(meta.tag)}" style="position:relative;">
      <span class="fu-index-num" style="position:absolute; left:-6px; top:-30px; font-family:'Bricolage Grotesque', serif; font-weight:800; font-size:80px; color:oklch(90% 0.06 ${meta.hue}); z-index:0; user-select:none;">${String(index + 1).padStart(2, "0")}</span>
      <div style="position:relative; display:flex; align-items:flex-end; justify-content:space-between; margin-bottom:16px; flex-wrap:wrap; gap:12px;">
        <div style="display:flex; align-items:center; gap:14px; min-width:0;">
          ${iconSvg(society, hex)}
          <div style="min-width:0;">
            <span class="fu-society-name" style="font-family:'Bricolage Grotesque', serif; font-weight:700; font-size:23px; color:oklch(19% 0.025 50);">${escapeHtml(society)}</span>
          </div>
        </div>
        <span style="padding:4px 12px; border-radius:7px; background:oklch(92% 0.08 ${meta.hue}); color:oklch(32% 0.13 ${meta.hue}); border:1px solid oklch(76% 0.11 ${meta.hue}); font-size:12.5px; font-weight:700;">${opportunities.length} open</span>
      </div>
      <div class="fu-grid" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(min(280px, 100%), 1fr)); gap:18px;">${cards}
      </div>
    </section>`;
}

export function buildSiteHtml(opportunities: Opportunity[], generatedAt: Date): string {
  const groups = new Map<string, Opportunity[]>();
  for (const opp of opportunities) {
    const list = groups.get(opp.society) ?? [];
    list.push(opp);
    groups.set(opp.society, list);
  }

  // Consistent, deliberate ordering rather than whatever order sources.json happens to list them in.
  const order = [
    "IEEE Foundation",
    "Humanitarian Technologies Board",
    "Signal Processing Society",
    "Robotics & Automation Society",
    "Antennas & Propagation Society",
    "Computer Society",
    "Power & Energy Society",
    "Communications Society",
    "Young Professionals",
    "IEEE-wide",
  ];
  const societies = [...groups.keys()].sort((a, b) => {
    const ai = order.indexOf(a);
    const bi = order.indexOf(b);
    return (ai === -1 ? order.length : ai) - (bi === -1 ? order.length : bi);
  });

  const chips = societies
    .map((s) => {
      const meta = SOCIETY_META[s] || DEFAULT_META;
      return `<button class="fu-chip" data-filter="${escapeAttr(meta.tag)}" style="padding:6px 13px; border-radius:8px; border:1.5px solid oklch(88% 0.02 75); font-size:13px; font-weight:600; color:oklch(42% 0.025 55); display:flex; align-items:center; gap:6px; background:white; cursor:pointer; font-family:'Karla', sans-serif;"><span style="width:7px; height:7px; border-radius:50%; background:oklch(58% 0.15 ${meta.hue}); flex-shrink:0;"></span>${escapeHtml(meta.tag)}</button>`;
    })
    .join("");

  // Mobile-only alternative to the chip row - a native <select> reads better
  // and takes far less vertical space than a wrapped row of 9+ buttons on a
  // phone. Swapped in via CSS (.fu-chip-row / .fu-filter-select) at the
  // existing 820px breakpoint; driven by the same applyFilters() as the chips.
  const selectOptions = societies
    .map((s) => {
      const meta = SOCIETY_META[s] || DEFAULT_META;
      return `<option value="${escapeAttr(meta.tag)}">${escapeHtml(s)}</option>`;
    })
    .join("");

  const sections = societies.map((s, i) => sectionHtml(s, groups.get(s)!, i)).join("");

  const total = opportunities.length;
  const generatedLabel = generatedAt.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  });

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>FundUndo — IEEE Funding, In One Place</title>
<meta name="description" content="Every open IEEE grant, scholarship, fellowship, and travel award, tracked automatically and organized by society.">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,600;12..96,700;12..96,800&family=Karla:wght@400;500;600;700&family=Caveat:wght@600;700&display=swap">
<style>
  * { box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  html, body { overflow-x: hidden; max-width: 100%; }
  body { margin: 0; font-family: 'Karla', -apple-system, 'Segoe UI', sans-serif; background: oklch(96.5% 0.02 85) radial-gradient(oklch(89% 0.02 75) 1px, transparent 1.4px); background-size: 100% 100%, 16px 16px; color: oklch(19% 0.025 50); }
  a { color: inherit; text-decoration: none; }
  input { font-size: 16px; } /* prevents iOS Safari auto-zoom on focus */
  .fu-link:hover { color: oklch(35% 0.16 38) !important; }
  .fu-chip:hover { border-color: oklch(60% 0.02 60) !important; }
  .fu-chip.fu-active { background: oklch(66% 0.18 42) !important; color: white !important; border-color: oklch(66% 0.18 42) !important; }
  .fu-chip.fu-active span { background: white !important; }
  [hidden] { display: none !important; }
  .fu-filter-select { display: none; }
  @media (max-width: 820px) {
    .fu-header, .fu-statsbar, .fu-hero, .fu-sections, .fu-tracked, .fu-footer { padding-left: 24px !important; padding-right: 24px !important; }
    .fu-hero h1 { font-size: 28px !important; }
    .fu-hero { padding-top: 32px !important; padding-bottom: 24px !important; }
    .fu-index-num { font-size: 56px !important; top: -20px !important; }
    .fu-chip { padding-top: 8px !important; padding-bottom: 8px !important; }
    .fu-chip-row { display: none !important; }
    .fu-filter-select { display: block !important; width: 100%; }
    .fu-statsbar { flex-direction: column; align-items: stretch !important; }
  }
  @media (max-width: 480px) {
    .fu-header, .fu-statsbar, .fu-hero, .fu-sections, .fu-tracked, .fu-footer { padding-left: 16px !important; padding-right: 16px !important; }
    .fu-header { flex-direction: column; align-items: stretch !important; }
    .fu-search-wrap { width: 100% !important; }
    .fu-hero h1 { font-size: 23px !important; }
    .fu-hero p { font-size: 14px !important; }
    .fu-sections { gap: 40px !important; }
    .fu-blob { display: none; }
    .fu-index-num { display: none; }
    .fu-society-name { font-size: 19px !important; }
  }
</style>
</head>
<body>

<div class="fu-header" style="min-height:76px; background:oklch(27% 0.08 250); display:flex; align-items:center; justify-content:space-between; padding:14px 64px; flex-wrap:wrap; gap:12px;">
  <div style="display:flex; align-items:center; gap:11px;">
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <path d="M16 14c-0.8-4-4-6-4.3-6.2 -0.2 0.5 0.6 4.4 4.3 6.2z" stroke="oklch(76% 0.15 55)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M16 14c0.8-4 4-6 4.3-6.2 0.2 0.5-0.6 4.4-4.3 6.2z" stroke="oklch(76% 0.15 55)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      <line x1="16" y1="14" x2="16" y2="17.5" stroke="oklch(76% 0.15 55)" stroke-width="1.5" stroke-linecap="round"/>
      <circle cx="16" cy="22.5" r="8" stroke="white" stroke-width="1.6"/>
    </svg>
    <span style="font-family:'Bricolage Grotesque', serif; font-weight:700; font-size:22px; color:white;">FundUndo</span>
  </div>
  <div class="fu-search-wrap" style="position:relative; width:270px; max-width:100%;">
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none" style="position:absolute; left:14px; top:50%; transform:translateY(-50%);">
      <circle cx="8.5" cy="8.5" r="6" stroke="oklch(50% 0.03 60)" stroke-width="1.7"/>
      <path d="M13.2 13.2L17 17" stroke="oklch(50% 0.03 60)" stroke-width="1.7" stroke-linecap="round"/>
    </svg>
    <input id="fu-search" type="text" placeholder="Search opportunities…" style="width:100%; height:38px; border-radius:10px; background:oklch(98% 0.01 85); border:1px solid oklch(85% 0.02 75); padding-left:38px; font-size:13px; color:oklch(23% 0.03 55); font-family:'Karla', sans-serif;">
  </div>
</div>

<div class="fu-statsbar" style="min-height:60px; background:oklch(98% 0.012 85); border-bottom:1px solid oklch(88% 0.02 75); display:flex; align-items:center; justify-content:space-between; padding:12px 64px; flex-wrap:wrap; gap:12px;">
  <div style="font-size:13px; color:oklch(42% 0.025 55); display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
    <span style="position:relative; display:inline-flex; width:7px; height:7px; border-radius:50%; background:oklch(70% 0.16 145);"></span>
    <span>Checked ${escapeHtml(generatedLabel)} UTC</span>
    <span style="color:oklch(80% 0.01 70);">·</span>
    <span style="font-weight:700; color:oklch(19% 0.025 50);">${total} open opportunities</span>
  </div>
  <div class="fu-chip-row" style="display:flex; align-items:center; gap:7px; flex-wrap:wrap;">
    <button class="fu-chip fu-active" data-filter="ALL" style="padding:6px 15px; border-radius:8px; font-size:13px; font-weight:700; border:1.5px solid oklch(88% 0.02 75); cursor:pointer; font-family:'Karla', sans-serif;">All</button>
    ${chips}
  </div>
  <select id="fu-filter-select" class="fu-filter-select" style="height:40px; border-radius:8px; border:1.5px solid oklch(88% 0.02 75); background:white; font-size:13px; font-weight:600; color:oklch(42% 0.025 55); font-family:'Karla', sans-serif; padding:0 10px;">
    <option value="ALL" selected>All societies</option>
    ${selectOptions}
  </select>
</div>

<div class="fu-hero" style="padding:48px 64px 32px 64px; position:relative;">
  <div class="fu-blob" style="position:absolute; left:380px; top:10px; width:340px; height:340px; background:oklch(76% 0.15 55 / 0.22); border-radius:50%; filter:blur(60px); pointer-events:none;"></div>
  <h1 style="margin:0; position:relative; font-family:'Bricolage Grotesque', serif; font-weight:700; font-size:38px; line-height:1.2; max-width:680px;">Every open IEEE funding call. In one place, finally.</h1>
  <p style="margin:16px 0 0 0; font-size:15.5px; color:oklch(42% 0.025 55); line-height:1.65; max-width:600px;">Grants, scholarships, fellowships, and travel awards — tracked automatically across every IEEE Foundation, board, and society page we could find.</p>
</div>

<div class="fu-sections" style="padding:0 64px; display:flex; flex-direction:column; gap:52px;">
${sections}
</div>

<div class="fu-footer" style="margin-top:36px; padding:24px 64px 44px 64px; font-size:12.5px; color:oklch(55% 0.02 60);">
  FundUndo quietly checks ${societies.length} society/board pages so you don't have to. Not affiliated with IEEE — always confirm details on the linked official page before applying.
</div>

<script>
(function () {
  var search = document.getElementById('fu-search');
  var select = document.getElementById('fu-filter-select');
  var chips = Array.prototype.slice.call(document.querySelectorAll('.fu-chip'));
  var sections = Array.prototype.slice.call(document.querySelectorAll('.fu-section'));
  var activeFilter = 'ALL';

  function applyFilters() {
    var q = (search.value || '').trim().toLowerCase();
    sections.forEach(function (section) {
      var matchesSociety = activeFilter === 'ALL' || section.getAttribute('data-society') === activeFilter;
      var cards = Array.prototype.slice.call(section.querySelectorAll('.fu-card'));
      var visibleCount = 0;
      cards.forEach(function (card) {
        var matchesQuery = !q || (card.getAttribute('data-search') || '').indexOf(q) !== -1;
        var show = matchesSociety && matchesQuery;
        card.hidden = !show;
        if (show) visibleCount++;
      });
      section.hidden = !matchesSociety || visibleCount === 0;
    });
  }

  // Chips (desktop/tablet) and the <select> (phone - see the 820px
  // breakpoint) both drive the same activeFilter, kept in sync so either
  // control reflects reality if the viewport is resized across the
  // breakpoint without a reload.
  function setFilter(tag) {
    activeFilter = tag;
    chips.forEach(function (c) { c.classList.toggle('fu-active', c.getAttribute('data-filter') === tag); });
    if (select.value !== tag) select.value = tag;
    applyFilters();
  }

  chips.forEach(function (chip) {
    chip.addEventListener('click', function () { setFilter(chip.getAttribute('data-filter')); });
  });

  select.addEventListener('change', function () { setFilter(select.value); });

  search.addEventListener('input', applyFilters);
})();
</script>

</body>
</html>
`;
}

export interface PublishResult {
  published: boolean;
  reason?: string;
}

/**
 * Regenerates docs/index.html from the current opportunity list - but only if
 * this run looks healthy enough to trust. A badly rate-limited or mostly-failed
 * run could otherwise overwrite a good, complete site with a near-empty one.
 * If this run found nothing, or found far fewer opportunities than last time
 * (more than a 50% drop), the last published site is left untouched instead.
 */
export async function writeSiteHtml(opportunities: Opportunity[]): Promise<PublishResult> {
  const count = opportunities.length;
  const meta = await loadSiteMeta();

  if (count === 0) {
    return { published: false, reason: "0 opportunities extracted this run - keeping the last published site." };
  }
  if (meta && count < meta.lastCount * 0.5) {
    return {
      published: false,
      reason: `Only ${count} opportunities this run, down from ${meta.lastCount} last time (>50% drop, likely a bad/rate-limited run) - keeping the last published site.`,
    };
  }

  await mkdir(SITE_DIR, { recursive: true });
  const html = buildSiteHtml(opportunities, new Date());
  await writeFile(path.join(SITE_DIR, "index.html"), html, "utf-8");
  await saveSiteMeta({ lastCount: count, lastGeneratedAt: new Date().toISOString() });
  return { published: true };
}
