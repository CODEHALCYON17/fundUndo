import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import type { Opportunity, SeenStore } from "./types.js";

const STORE_PATH = path.join(process.cwd(), "data", "seen.json");

export function makeId(sourceUrl: string, title: string): string {
  return createHash("sha1").update(`${sourceUrl}::${title.trim().toLowerCase()}`).digest("hex");
}

export async function loadSeenStore(): Promise<SeenStore> {
  try {
    const raw = await readFile(STORE_PATH, "utf-8");
    return JSON.parse(raw) as SeenStore;
  } catch {
    return {};
  }
}

export async function saveSeenStore(store: SeenStore): Promise<void> {
  await mkdir(path.dirname(STORE_PATH), { recursive: true });
  await writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf-8");
}

export type ChangeKind = "new" | "changed";

export interface Change {
  kind: ChangeKind;
  opportunity: Opportunity;
  /** For "changed" entries, what was different before. */
  previous?: Pick<Opportunity, "amount" | "deadline" | "summary" | "title">;
}

/** Compares freshly extracted opportunities against the seen-store, returns diffs and the updated store. */
export function diffAgainstStore(
  opportunities: Opportunity[],
  store: SeenStore
): { changes: Change[]; updatedStore: SeenStore } {
  const updatedStore: SeenStore = { ...store };
  const changes: Change[] = [];

  for (const opp of opportunities) {
    const prev = store[opp.id];
    if (!prev) {
      changes.push({ kind: "new", opportunity: opp });
    } else if (
      prev.amount !== opp.amount ||
      prev.deadline !== opp.deadline ||
      prev.summary !== opp.summary
    ) {
      changes.push({ kind: "changed", opportunity: opp, previous: prev });
    }
    updatedStore[opp.id] = {
      title: opp.title,
      amount: opp.amount,
      deadline: opp.deadline,
      summary: opp.summary,
    };
  }

  return { changes, updatedStore };
}
