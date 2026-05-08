import OpenAI from "openai";
import { searchTopic, formatSearchResultsForLLM } from "./tavily";

let _openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || "dummy-key-for-build",
    });
  }
  return _openai;
}

// ─── In-memory cache ────────────────────────────────
const cache = new Map<string, { data: unknown; expiry: number }>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiry) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache(key: string, data: unknown, ttlMs: number) {
  cache.set(key, { data, expiry: Date.now() + ttlMs });
}

// ─── Trending Topics (Dynamic via Tavily) ─────────────
export async function generateTrendingTopics(): Promise<string[]> {
  const today = new Date().toISOString().split("T")[0];
  const cacheKey = `trending-live-${today}`;

  const cached = getCached<string[]>(cacheKey);
  if (cached) return cached;

  try {
    let context = "";
    if (process.env.TAVILY_API_KEY && process.env.TAVILY_API_KEY !== "dummy") {
      const results = await searchTopic(`top global news and trending topics today ${today}`);
      context = formatSearchResultsForLLM(results);
    }

    const response = await getOpenAI().chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that returns only valid JSON.",
        },
        {
          role: "user",
          content: `Today is ${today}. Generate 10 globally trending topics right now based on real current events. Make them specific enough to be interesting, but broad enough to have sub-topics. Mix highly relevant current events (tech, geopolitics, markets) with general global interests.\n\n${context ? `Use the following live news context to inform your choices:\n${context}\n\n` : ''}First, provide a brief reasoning for your choices. Then, provide the topics.\nReturn exactly this format:\n{\n  "reasoning": "your thought process",\n  "topics": ["Trending Topic 1", "Trending Topic 2", ...]\n}\n\nReturn only the JSON. No explanation outside JSON.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 400,
    });

    const content = response.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);
    const topics = parsed.topics || [];

    if (topics.length > 0) {
      setCache(cacheKey, topics, 30 * 60 * 1000); // 30m cache for live feeling
    }
    return topics;
  } catch (error) {
    console.error("Failed to generate trending topics:", error);
    return [
      "Artificial Intelligence", "Geopolitics", "Climate & Environment", "Finance & Markets",
      "Space Exploration", "Health & Medicine", "Sports", "Travel", "Consumer Tech", "Culture"
    ];
  }
}

// ─── Correlated Topic Generation ────────────────────
export async function generateCorrelatedTopics(
  selectedInterests: string[]
): Promise<string[]> {
  if (selectedInterests.length === 0) return generateTrendingTopics();

  try {
    const interestsList = selectedInterests.join(", ");
    const response = await getOpenAI().chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You are a world-class recommendation engine that returns only valid JSON.",
        },
        {
          role: "user",
          content: `The user has shown interest in the following topics: [${interestsList}].\n\nGenerate exactly 10 highly correlated, fascinating topics they might also want to explore. Do not just list generic sub-topics; make lateral leaps, connect ideas, and suggest specific current fields related to their interests (e.g., if they selected SpaceX, suggest 'Reusable Rockets', 'Mars Colonization', 'Asteroid Mining').\n\nFirst, provide a brief reasoning for your lateral leaps. Return exactly this format:\n{\n  "reasoning": "your thought process",\n  "topics": ["Correlated Topic 1", "Correlated Topic 2", ...]\n}\n\nReturn only the JSON. No explanation outside JSON.`,
        },
      ],
      temperature: 0.8,
      max_tokens: 400,
    });

    const content = response.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);
    return parsed.topics || [];
  } catch (error) {
    console.error("Failed to generate correlated topics:", error);
    return [];
  }
}

// ─── Search Query Generation ────────────────────────
export async function generateSearchQueries(
  breadcrumb: string
): Promise<string[]> {
  const today = new Date().toISOString().split("T")[0];

  try {
    const response = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that returns only valid JSON.",
        },
        {
          role: "user",
          content: `Generate 3 search queries to find today's (${today}) most important news and developments about: "${breadcrumb}"\n\nQueries should be specific, current, and likely to return quality journalism or expert analysis — not social media or forums.\n\nFirst, provide a brief reasoning for your query choices. Return exactly this format:\n{\n  "reasoning": "your thought process",\n  "queries": ["query1", "query2", "query3"]\n}\n\nReturn only the JSON.`,
        },
      ],
      temperature: 0.6,
      max_tokens: 200,
    });

    const content = response.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);
    return parsed.queries || [];
  } catch (error) {
    console.error("Failed to generate search queries:", error);
    return [`latest news ${breadcrumb} today`];
  }
}

// ─── Digest Summarization ───────────────────────────
export interface DigestItemResult {
  title: string;
  summary: string;
  sourceUrl: string;
  sourceName: string;
  relevanceScore: number;
}

export async function summarizeDigest(
  breadcrumb: string,
  searchResults: string
): Promise<DigestItemResult[]> {
  const today = new Date().toISOString().split("T")[0];

  try {
    const response = await getOpenAI().chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a research assistant creating a concise daily brief. Be factual. No opinion. No fluff. Return only valid JSON.",
        },
        {
          role: "user",
          content: `Topic: "${breadcrumb}"\nDate: ${today}\n\nHere are search results from today:\n${searchResults}\n\nExtract the 3-5 most important, distinct developments from these results. Skip duplicates, skip low-quality sources.\n\nFirst, provide a brief reasoning for which items you selected and why. Then, for each item:\n- title: headline (max 12 words)\n- summary: exactly 2 sentences. Sentence 1: what happened. Sentence 2: why it matters.\n- sourceUrl: the URL\n- sourceName: publication name\n- relevanceScore: 0-100 how relevant to the topic\n\nReturn:\n{\n  "reasoning": "your thought process",\n  "items": [\n    {\n      "title": "...",\n      "summary": "...",\n      "sourceUrl": "...",\n      "sourceName": "...",\n      "relevanceScore": 87\n    }\n  ]\n}\n\nReturn only the JSON.`,
        },
      ],
      temperature: 0.3,
      max_tokens: 1500,
    });

    const content = response.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);
    return parsed.items || [];
  } catch (error) {
    console.error("Failed to summarize digest:", error);
    return [];
  }
}

// ─── Digest Without Search (GPT-only fallback) ─────
export async function generateDigestWithoutSearch(
  breadcrumb: string
): Promise<DigestItemResult[]> {
  const today = new Date().toISOString().split("T")[0];

  try {
    const response = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a research assistant creating a concise daily brief. Be factual. Use your knowledge of recent events and trends. Return only valid JSON.",
        },
        {
          role: "user",
          content: `Topic: "${breadcrumb}"\nDate: ${today}\n\nGenerate 3-5 of the most important recent developments, trends, or news about this topic. Use your training knowledge to create informative summaries.\n\nFirst, provide a brief reasoning for your selections. Then, for each item:\n- title: headline (max 12 words)\n- summary: exactly 2 sentences. Sentence 1: what happened or the key insight. Sentence 2: why it matters.\n- sourceUrl: "#" (no source available)\n- sourceName: "AI Summary"\n- relevanceScore: 0-100 how relevant to the topic\n\nReturn:\n{\n  "reasoning": "your thought process",\n  "items": [\n    {\n      "title": "...",\n      "summary": "...",\n      "sourceUrl": "#",\n      "sourceName": "AI Summary",\n      "relevanceScore": 87\n    }\n  ]\n}\n\nReturn only the JSON.`,
        },
      ],
      temperature: 0.5,
      max_tokens: 1200,
    });

    const content = response.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);
    return parsed.items || [];
  } catch (error) {
    console.error("Failed to generate digest without search:", error);
    return [];
  }
}
