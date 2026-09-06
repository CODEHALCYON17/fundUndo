import type { Change } from "./store.js";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildDigestHtml(changes: Change[]): string {
  const newOnes = changes.filter((c) => c.kind === "new");
  const updated = changes.filter((c) => c.kind === "changed");

  const row = (c: Change) => {
    const o = c.opportunity;
    return `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #eee;">
          <a href="${escapeHtml(o.link)}" style="font-weight:600;color:#0b5fff;text-decoration:none;">${escapeHtml(o.title)}</a>
          <div style="color:#666;font-size:12px;">${escapeHtml(o.sourceName)}</div>
        </td>
        <td style="padding:8px;border-bottom:1px solid #eee;white-space:nowrap;">${escapeHtml(o.amount)}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;white-space:nowrap;">${escapeHtml(o.deadline)}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(o.summary)}</td>
      </tr>`;
  };

  const table = (items: Change[]) => `
    <table style="border-collapse:collapse;width:100%;font-family:sans-serif;font-size:14px;">
      <thead>
        <tr style="text-align:left;background:#f7f7f7;">
          <th style="padding:8px;">Opportunity</th>
          <th style="padding:8px;">Amount</th>
          <th style="padding:8px;">Deadline</th>
          <th style="padding:8px;">Summary</th>
        </tr>
      </thead>
      <tbody>${items.map(row).join("")}</tbody>
    </table>`;

  return `
    <div style="font-family:sans-serif;color:#222;max-width:800px;">
      <h2>IEEE Funding Digest</h2>
      <p style="color:#666;">${new Date().toDateString()}</p>
      ${newOnes.length ? `<h3>New (${newOnes.length})</h3>${table(newOnes)}` : ""}
      ${updated.length ? `<h3 style="margin-top:24px;">Updated (${updated.length})</h3>${table(updated)}` : ""}
    </div>`;
}

export function buildDigestText(changes: Change[]): string {
  return changes
    .map((c) => {
      const o = c.opportunity;
      return `[${c.kind.toUpperCase()}] ${o.title} (${o.sourceName})\n  Amount: ${o.amount}\n  Deadline: ${o.deadline}\n  ${o.summary}\n  ${o.link}\n`;
    })
    .join("\n");
}
