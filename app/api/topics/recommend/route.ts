import { NextResponse } from "next/server";
import { generateCorrelatedTopics } from "@/lib/ai/openai";

export async function POST(req: Request) {
  try {
    const { selected } = await req.json();

    if (!Array.isArray(selected)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const topics = await generateCorrelatedTopics(selected);
    return NextResponse.json({ topics });
  } catch (error) {
    console.error("Recommend topics error:", error);
    return NextResponse.json(
      { error: "Failed to generate recommendations" },
      { status: 500 }
    );
  }
}
