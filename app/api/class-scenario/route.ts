import { NextRequest, NextResponse } from "next/server";
import { generateClassScenario } from "@/lib/crafthub";

/**
 * POST /api/class-scenario
 * Body: { profile: object } (teacher profile, same shape as index.ts main() profile)
 * Returns: { classScenario: { challenges: object[] } }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const profile = body?.profile ?? body;
    if (!profile || typeof profile !== "object") {
      return NextResponse.json(
        { error: "Missing or invalid body: expected { profile: object }" },
        { status: 400 }
      );
    }
    const classScenario = await generateClassScenario(profile);
    return NextResponse.json({ classScenario });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
