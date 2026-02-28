import { NextRequest, NextResponse } from "next/server";
import { generateTeacherProfileTurn, type ProfileTurnInput } from "@/lib/crafthub";

/**
 * POST /api/profile
 * Body: { messages?: Array<{ role: "user" | "assistant", content: string }> }
 * - First call: omit messages or send [{ role: "user", content: "I'd like to create my teacher profile." }]
 * - Next calls: send full conversation history (previous messages + user's latest reply)
 * Returns: { assistantMessage: string, profile: object | null }
 * - If profile is non-null, the conversation is complete and profile is the teacher_profile object.
 * - If profile is null, assistantMessage is the next question; client should append it and the user's reply to messages and call again.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    let messages = body?.messages as ProfileTurnInput[] | undefined;
    if (!Array.isArray(messages)) {
      messages = [{ role: "user", content: "I'd like to create my teacher profile." }];
    }
    const { assistantMessage, profile } = await generateTeacherProfileTurn(messages);
    return NextResponse.json({ assistantMessage, profile });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
