import { NextResponse } from "next/server";
import { generateTrendingTopics } from "@/lib/ai/openai";

export async function GET() {
  try {
    const topics = await generateTrendingTopics();
    return NextResponse.json({ topics });
  } catch (error) {
    console.error("Trending topics error:", error);
    return NextResponse.json(
      { error: "Failed to generate trending topics" },
      { status: 500 }
    );
  }
}
