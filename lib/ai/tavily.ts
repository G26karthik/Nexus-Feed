import { tavily } from "@tavily/core";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _tvly: any = null;

function getTavily() {
  if (!_tvly) {
    _tvly = tavily({ apiKey: process.env.TAVILY_API_KEY || "dummy" });
  }
  return _tvly;
}

export interface SearchResult {
  title: string;
  url: string;
  content: string;
}

export async function searchTopic(query: string): Promise<SearchResult[]> {
  try {
    let response = await getTavily().search(query, {
      maxResults: 5,
      searchDepth: "basic",
      days: 1,
    });

    // Fallback to 3 days if no results from the last 24 hours
    if (!response.results || response.results.length === 0) {
      response = await getTavily().search(query, {
        maxResults: 5,
        searchDepth: "basic",
        days: 3,
      });
    }

    return (response.results || []).map((r: { title: string; url: string; content: string }) => ({
      title: r.title,
      url: r.url,
      content: r.content,
    }));
  } catch (error) {
    console.error("Tavily search failed:", error);
    return [];
  }
}

export async function searchTopicMultiQuery(
  queries: string[]
): Promise<SearchResult[]> {
  const allResults: SearchResult[] = [];
  const seenUrls = new Set<string>();

  for (const query of queries) {
    const results = await searchTopic(query);
    for (const result of results) {
      if (!seenUrls.has(result.url)) {
        seenUrls.add(result.url);
        allResults.push(result);
      }
    }
  }

  return allResults;
}

export function formatSearchResultsForLLM(results: SearchResult[]): string {
  return results
    .map(
      (r, i) =>
        `[${i + 1}] Title: ${r.title}\nURL: ${r.url}\nSnippet: ${r.content}\n`
    )
    .join("\n");
}
