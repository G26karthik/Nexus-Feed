import { NextRequest, NextResponse } from "next/server";
import { expandTopic } from "@/lib/ai/openai";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic, breadcrumb, depth } = body;

    if (!topic || !breadcrumb) {
      return NextResponse.json(
        { error: "topic and breadcrumb are required" },
        { status: 400 }
      );
    }

    const subTopics = await expandTopic(topic, breadcrumb, depth || 1);
    return NextResponse.json({ subTopics });
  } catch (error) {
    console.error("Topic expansion error:", error);
    return NextResponse.json(
      { error: "Failed to expand topic" },
      { status: 500 }
    );
  }
}
