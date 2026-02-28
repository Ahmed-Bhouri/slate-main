import { NextRequest, NextResponse } from "next/server";
import {
  generateClassScenario,
  generatePersonas,
  flowInputsFromProfileAndChallenge,
} from "@/lib/crafthub";

import { ClassState, Student, Persona } from "@/types/classroom";

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
    const challenges = (classScenario as any)?.challenges ?? [];
    const firstChallenge = challenges[0] ?? null;

    if (!firstChallenge) {
      return NextResponse.json(
        { error: "Could not generate challenge from profile" }, 
        { status: 500 }
      );
    }

    const { teacherIdentity, lessonTopic, constraints } =
      flowInputsFromProfileAndChallenge(profile, firstChallenge);
    
    const rawPersonas = await generatePersonas(
      teacherIdentity,
      constraints,
      lessonTopic
    );

    const personas = rawPersonas as unknown as Persona[];
    const students: Record<string, Student> = {};

    personas.forEach((persona, index) => {
        // Use name as ID if unique, otherwise append index
        const safeName = persona.identity.name.toLowerCase().replace(/\s+/g, '_');
        const id = `${safeName}_${index}`;
        
        students[id] = {
            persona,
            state: {
                attention: 75,
                understanding: 50, // Default baseline
                status: 'listening',
                memory: [],
                pending_question: null,
                last_interacted_round: 0,
                mood: persona.initial_state.mood_label,
                energy: persona.initial_state.energy
            }
        };
    });

    const topic = (firstChallenge as any).lesson_topic?.topic 
      ? `${lessonTopic.subject}: ${(firstChallenge as any).lesson_topic.topic}`
      : lessonTopic.subject;

    const classState: ClassState = {
        session_id: `session_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        round_num: 0,
        topic,
        class_log: [],
        hand_queue: [],
        time_since_question: 0,
        students
    };

    return NextResponse.json({
      classState
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
