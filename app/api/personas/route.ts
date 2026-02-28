import { NextRequest, NextResponse } from "next/server";
import {
  generatePersonas,
  type TeacherIdentitySlice,
  type PersonaGenerationConstraints,
  type LessonTopicSlice,
} from "@/lib/crafthub";

/**
 * POST /api/personas
 * Body: {
 *   teacher_identity: { subjects_taught: string[], grade_levels: string[] },
 *   persona_generation_constraints: { num_students_needed: number, student_archetypes_needed: object[] },
 *   lesson_topic: { subject: string, grade_level: string }
 * }
 * Returns: { personas: object[] } (max 8)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const teacherIdentity = body?.teacher_identity as TeacherIdentitySlice | undefined;
    const personaGenerationConstraints = body?.persona_generation_constraints as PersonaGenerationConstraints | undefined;
    const lessonTopic = body?.lesson_topic as LessonTopicSlice | undefined;

    if (
      !teacherIdentity ||
      !personaGenerationConstraints ||
      !lessonTopic
    ) {
      return NextResponse.json(
        {
          error:
            "Missing body fields: teacher_identity, persona_generation_constraints, lesson_topic",
        },
        { status: 400 }
      );
    }

    const personas = await generatePersonas(
      teacherIdentity,
      personaGenerationConstraints,
      lessonTopic
    );
    return NextResponse.json({ personas });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
