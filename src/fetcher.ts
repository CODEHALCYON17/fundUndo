import * as cheerio from "cheerio";

export interface FetchedPage {
  text: string;
  links: { text: string; href: string }[];
}

/**
 * Fetches a page and reduces it to plain text plus its links, so it's cheap
 * to hand to an LLM for extraction. Strips nav/script/style noise.
 */
export async function fetchPage(url: string): Promise<FetchedPage> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; ieee-funding-digest/0.1; personal research bot)",
    },
  });
  if (!res.ok) {
    throw new Error(`Fetch failed for ${url}: ${res.status} ${res.statusText}`);
  }
  const html = await res.text();
  const $ = cheerio.load(html);

  $("script, style, nav, footer, noscript, svg").remove();

  const text = $("body").text().replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n").trim();

  const links: { text: string; href: string }[] = [];
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    const linkText = $(el).text().trim();
    if (href && linkText) {
      links.push({ text: linkText, href: new URL(href, url).toString() });
    }
  });

  return { text, links };
}
