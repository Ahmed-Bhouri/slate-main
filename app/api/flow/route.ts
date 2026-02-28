import { NextRequest, NextResponse } from "next/server";
import {
  generateClassScenario,
  generatePersonas,
  flowInputsFromProfileAndChallenge,
} from "@/lib/crafthub";

/**
 * POST /api/flow
 * Body: { profile: object } (teacher profile, same as index.ts main())
 * Runs: profile → classScenario → firstChallenge → personas (same execution flow as index.ts).
 * Returns: { classScenario, firstChallenge, personas }
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
    const challenges = classScenario?.challenges ?? [];
    const firstChallenge = challenges[0] ?? null;

    if (!firstChallenge) {
      return NextResponse.json(
        { classScenario, firstChallenge: null, personas: [] }
      );
    }

    const { teacherIdentity, lessonTopic, constraints } =
      flowInputsFromProfileAndChallenge(profile, firstChallenge);
    const personas = await generatePersonas(
      teacherIdentity,
      constraints,
      lessonTopic
    );

    return NextResponse.json({
      classScenario,
      firstChallenge,
      personas,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
