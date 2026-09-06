export interface Source {
  name: string;
  url: string;
  notes?: string;
  /** Which society/board this source belongs to, for grouping on the generated site (e.g. "Signal Processing Society"). */
  society: string;
}

export interface Opportunity {
  /** Stable id derived from source url + title, used for dedupe across runs. */
  id: string;
  sourceName: string;
  sourceUrl: string;
  /** Copied from the source's `society` - which group this renders under on the site. */
  society: string;
  title: string;
  /** Free-form amount as stated on the page, e.g. "$5,000-$50,000" or "Not specified". */
  amount: string;
  /** Free-form deadline as stated on the page, e.g. "26 March 2026" or "Rolling / not specified". */
  deadline: string;
  summary: string;
  /** Direct link to the opportunity if the page provides one distinct from the source page. */
  link: string;
}

export interface SeenStore {
  /** Map of opportunity id -> last-seen snapshot (used to detect new + changed entries). */
  [id: string]: Pick<Opportunity, "amount" | "deadline" | "summary" | "title">;
}
