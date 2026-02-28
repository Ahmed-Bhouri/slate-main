/**
 * CraftHub API lib: class scenario + personas generation.
 * Adapted from src/index.ts flow; uses same inputs/outputs.
 */
import { OpenAI } from "openai";

export type TeacherIdentitySlice = {
  subjects_taught: string[];
  grade_levels: string[];
};

export type StudentArchetypeConstraint = {
  type: string;
  count: number;
  personality_bias?: Record<string, string>;
  behavior_focus?: string;
  skill_range?: Record<string, string>;
};

export type PersonaGenerationConstraints = {
  num_students_needed: number;
  student_archetypes_needed: StudentArchetypeConstraint[];
};

export type LessonTopicSlice = {
  subject: string;
  grade_level: string;
};

const CLASS_SCENARIO_SYSTEM_PROMPT = `You generate classroom challenges for teacher improvement. Given a teacher profile, create **3 or 4 challenges**. Each challenge must target a **different** weak metric—so 3–4 distinct weaknesses from performance_metrics/weaknesses, one per challenge.

OUTPUT EXACTLY this JSON structure (no extra text, no markdown):

{
  "challenges": [
    {
      "id": "challenge_1",
      "teacher_name": "{teacher_profile.identity.name}",
      "targeted_improvement": "{primary_weak_metric_for_this_challenge}",
      "targeted_metrics": {
        "{weak_metric}": {"current": {current_value}, "expected_gain": {0.05-0.12}}
      },
      "lesson_topic": {
        "subject": "{pick_from_teacher_profile.identity.subjects_taught}",
        "topic": "{specific_topic_for_that_subject_and_grade}",
        "grade_level": "{pick_from_teacher_profile.identity.grade_levels}",
        "objective": "{clear_1_sentence_learning_objective}",
        "persona_generation_constraints": {
          "num_students_needed": {20-30},
          "student_archetypes_needed": [
            {
              "type": "{archetype_name}",
              "count": {2-6},
              "personality_bias": {"{trait}": "{<0.4 OR >0.7}"},
              "behavior_focus": "{specific_behavior_challenging_this_weakness}",
              "skill_range": {"{subject_skill}": "{range_like_0.2-0.4}"}
            }
          ]
        }
      },
      "challenge_scenarios": [
        {
          "phase": "{lesson_phase}",
          "duration_minutes": {3-20},
          "situation": "{describe_problem_using_archetype_types}",
          "success_criteria": "{measurable_teacher_action}"
        }
      ],
      "difficulty": "{easy|medium|hard}",
      "estimated_duration": {30-60}
    }
  ]
}

Repeat the same challenge object structure for challenge_2, challenge_3, and optionally challenge_4. Each element of "challenges" targets a **different** weak metric.
RULES:
1. Output exactly **3 or 4** challenges. Each challenge targets **one** primary weakness.
2. Use ids: "challenge_1", "challenge_2", "challenge_3", "challenge_4".
3. Choose lesson topic from teacher's subjects_taught.
4. Create 2–4 student archetypes per challenge. Sum of archetype counts = num_students_needed.
5. Generate VALID JSON only - no \`\`\` markers, no explanations.`;

const PERSONAS_SYSTEM_PROMPT = `You are an assistant that designs and simulates STUDENT PERSONAS for an educational system.
**Context:** The student is already in class. When they ask questions or say something, it is to the teacher and about the lesson or the class in general.
Your job: Generate structured student personas that match **persona_generation_constraints** and use the teacher's **subjects_taught** and **grade_levels** for context.

You will receive: teacher_identity, lesson_topic, persona_generation_constraints (num_students_needed, student_archetypes_needed).
For each archetype: type, count, personality_bias, behavior_focus, skill_range. Total personas = num_students_needed.
Use lesson_topic.subject as identity.current_class and lesson_topic.grade_level as identity.grade. All numeric metrics in [0, 1].

Output: Return exactly **N** personas (N = num_students_needed) as a JSON array of N objects. Each object:
{
  "identity": { "name": "<first name>", "age": <number>, "grade": "<grade>", "current_class": "<subject>", "background_summary": "<paragraph>" },
  "personality": { "openness": <0-1>, "conscientiousness": <0-1>, "extraversion": <0-1>, "agreeableness": <0-1>, "emotionality": <0-1> },
  "skills": { "<skill_1>": <0-1>, ... },
  "initial_state": { "mood_label": "<label>", "mood_valence": <0-1>, "main_concern": "<string>", "energy": <0-1>, "motivation": <0-1>, "stress": <0-1>, "focus": <0-1>, "engagement_with_lesson": <0-1> },
  "communication_style": { "sentence_length": <0-1>, "verbosity": <0-1>, "formality": <0-1>, "confidence": <0-1>, "warmth": <0-1>, "directness": <0-1>, "hedging": <0-1>, "asks_for_reassurance": <0-1>, "use_of_fillers": <0-1>, "clarity": <0-1>, "pace": <0-1>, "expressiveness": <0-1>, "willingness_to_speak_up": <0-1>, "example_phrases": ["..."], "summary": "<string>" }
}
Always return VALID JSON. No comments, no trailing commas. Every numeric metric in [0, 1].`;

const TEACHER_PROFILE_SYSTEM_PROMPT = `You are a friendly assistant helping a teacher build their professional profile through conversation. This is **profile generation**, not refinement: you are creating an initial profile. Focus only on information **relevant to teaching performance**—do not get personal.

**Critical rules:**
- **Stay professional; avoid personal topics.** Do not ask about family, private life, how they got into teaching, or anything not related to their teaching role and performance. Stick to: what they teach, their experience, their teaching context, their approach, and their professional goals.
- **Default all numeric ratings to 0.5 (average).** Every field in performance_metrics, strengths, weaknesses, and numeric fields in teaching_style (pacing, interaction_level, adaptability) and in assessment_targets (current, target) must be **0.5** unless the user explicitly says something that clearly indicates otherwise. When in doubt, keep 0.5. Do not try to infer subtle ratings from short answers.
- **Never ask the user to rate anything.** Do not ask for scales, numbers, or self-ratings. All 0–1 values are either 0.5 by default or set only when there is clear evidence in their words.
- **Focus questions on teaching and performance-related information only:** Professional identity (name, age, years of experience, subjects taught, grade levels, certifications). Teaching context and approach. Professional goals and improvement areas.
- Ask 1–2 broad, professional questions at a time. Once you have enough to fill identity, teaching_style (0.5 for numeric fields), and goals/assessment_targets, output the complete profile.

**When you have gathered enough information**, respond with exactly this on its own line:
TEACHER_PROFILE_COMPLETE
Then on the next lines output the full JSON object only (no markdown, no code fence), starting with { and ending with }, with root key "teacher_profile". All numeric fields in [0, 1]; use 0.5 for every rating unless the user clearly indicated otherwise.

Schema: teacher_profile.identity (name, age, years_experience, subjects_taught, grade_levels, certifications), performance_metrics (overall_score, last_30_days_score, classroom_engagement, student_growth, behavior_management, assessment_scores), strengths (content_knowledge, explanation_clarity, lesson_planning, assessment_design), weaknesses (classroom_management, student_engagement, differentiation, technology_integration), teaching_style (primary_approach, secondary_approach, pacing, interaction_level, feedback_style, classroom_voice, adaptability), goals (primary_goal, secondary_goal, professional_development_focus), assessment_targets (priority_improvement_areas, success_indicators).

Start by greeting and asking about their teaching role (subject, grade levels, experience, or typical lesson). Keep it professional. Use 0.5 for all ratings unless they clearly say otherwise.`;

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  const baseURL = process.env.OPENAI_BASE_URL;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
  return new OpenAI({ baseURL, apiKey });
}

function tryParseJson(s: string): unknown {
  const cleaned = s.replace(/,(\s*[}\]])/g, "$1");
  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

function extractBalancedJson(str: string, start: number, open: string, close: string): string | null {
  let depth = 0;
  let inString: string | null = null;
  let i = start;
  while (i < str.length) {
    const c = str[i];
    if (inString !== null) {
      if (c === "\\" && i + 1 < str.length) {
        i += 2;
        continue;
      }
      if (c === inString) {
        inString = null;
        i++;
        continue;
      }
      i++;
      continue;
    }
    if (c === '"' || c === "'") {
      inString = c;
      i++;
      continue;
    }
    if (c === open) {
      depth++;
      i++;
      continue;
    }
    if (c === close) {
      depth--;
      if (depth === 0) return str.slice(start, i + 1);
      i++;
      continue;
    }
    i++;
  }
  return null;
}

function extractChallengeJson(text: string): object | null {
  if (!text?.trim()) return null;
  let str = text.trim();
  const codeBlock = str.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlock) str = codeBlock[1].trim();
  const firstBrace = str.indexOf("{");
  if (firstBrace !== -1) {
    const slice = extractBalancedJson(str, firstBrace, "{", "}");
    if (slice !== null) {
      const parsed = tryParseJson(slice);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed as object;
      if (Array.isArray(parsed)) return { challenges: parsed };
    }
  }
  const firstBracket = str.indexOf("[");
  if (firstBracket !== -1) {
    const slice = extractBalancedJson(str, firstBracket, "[", "]");
    if (slice !== null) {
      const parsed = tryParseJson(slice);
      if (Array.isArray(parsed)) return { challenges: parsed };
    }
  }
  return null;
}

function extractPersonasJson(text: string): object[] | null {
  let str = text.trim();
  const codeBlock = str.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlock) str = codeBlock[1].trim();
  const firstBracket = str.indexOf("[");
  const firstBrace = str.indexOf("{");
  if (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
    let depth = 0;
    for (let i = firstBracket; i < str.length; i++) {
      if (str[i] === "[") depth++;
      else if (str[i] === "]") {
        depth--;
        if (depth === 0) {
          try {
            const arr = JSON.parse(str.slice(firstBracket, i + 1)) as unknown;
            return Array.isArray(arr) ? (arr as object[]) : null;
          } catch {
            return null;
          }
        }
      }
    }
  }
  if (firstBrace !== -1) {
    let depth = 0;
    for (let i = firstBrace; i < str.length; i++) {
      if (str[i] === "{") depth++;
      else if (str[i] === "}") {
        depth--;
        if (depth === 0) {
          try {
            const obj = JSON.parse(str.slice(firstBrace, i + 1)) as object;
            if (obj && "personas" in obj && Array.isArray((obj as { personas: unknown }).personas))
              return (obj as { personas: object[] }).personas;
            return null;
          } catch {
            return null;
          }
        }
      }
    }
  }
  return null;
}

function extractTeacherProfileJson(text: string): object | null {
  const marker = "TEACHER_PROFILE_COMPLETE";
  const idx = text.indexOf(marker);
  if (idx === -1) return null;
  const after = text.slice(idx + marker.length).replace(/^\s*\n?/, "");
  let depth = 0;
  let start = -1;
  for (let i = 0; i < after.length; i++) {
    if (after[i] === "{") {
      if (depth === 0) start = i;
      depth++;
    } else if (after[i] === "}") {
      depth--;
      if (depth === 0 && start !== -1) {
        try {
          return JSON.parse(after.slice(start, i + 1)) as object;
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

export type ProfileTurnInput = { role: "user" | "assistant"; content: string };
export type ProfileTurnResult = { assistantMessage: string; profile: object | null };

/** One conversational turn for teacher profile generation. Send messages history; returns assistant reply and profile if complete. */
export async function generateTeacherProfileTurn(messages: ProfileTurnInput[]): Promise<ProfileTurnResult> {
  const client = getClient();
  if (!messages.length) {
    messages = [{ role: "user", content: "I'd like to create my teacher profile." }];
  }
  const completion = await client.chat.completions.create({
    model: "gpt-5-mini",
    messages: [
      { role: "system", content: TEACHER_PROFILE_SYSTEM_PROMPT },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ],
    stream: false,
  });
  const response = { output_text: completion.choices[0]?.message?.content || "" };
  const assistantMessage = (response as { output_text?: string }).output_text ?? "";
  const profile = extractTeacherProfileJson(assistantMessage);
  return { assistantMessage, profile };
}

export type ClassScenarioOutput = { challenges?: object[] };

export async function generateClassScenario(teacherProfile: object): Promise<ClassScenarioOutput> {
  const client = getClient();
  const profileJson = JSON.stringify(teacherProfile, null, 2);
  const userMessage = `Generate 3 or 4 challenges for this teacher (each targeting a different weakness):\n${profileJson}`;

  const completion = await client.chat.completions.create({
    model: "gpt-5-mini",
    messages: [
      { role: "system", content: CLASS_SCENARIO_SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ],
    stream: false,
  });
  
  const response = { output_text: completion.choices[0]?.message?.content || "" };

  let outputText = response.output_text;
  // Fallback for different response shapes if needed, but chat completion is standard
  if (!outputText && (response as any).output) {
    const out = (response as any).output;
    outputText = out
      .filter((o: any) => o.type === "message" && Array.isArray(o.content))
      .flatMap((o: any) => (o.content ?? []).filter((c: any) => c.type === "output_text").map((c: any) => (c as { text?: string }).text ?? ""))
      .join("");
  }
  const parsed = extractChallengeJson(outputText);
  if (parsed) return parsed as ClassScenarioOutput;
  const snippet = outputText.slice(0, 500).replace(/\n/g, " ");
  throw new Error(`Failed to parse challenge JSON. Snippet: ${snippet}${outputText.length > 500 ? "..." : ""}`);
}

const MAX_PERSONAS = 8;

export async function generatePersonas(
  teacherIdentity: TeacherIdentitySlice,
  personaConstraints: PersonaGenerationConstraints,
  lessonTopic: LessonTopicSlice
): Promise<object[]> {
  const client = getClient();
  const cappedConstraints: PersonaGenerationConstraints = {
    ...personaConstraints,
    num_students_needed: Math.min(personaConstraints.num_students_needed, MAX_PERSONAS),
  };
  const inputPayload = {
    teacher_identity: teacherIdentity,
    lesson_topic: lessonTopic,
    persona_generation_constraints: cappedConstraints,
  };
  const userContent = `Generate student personas from these constraints (output a JSON array of exactly ${cappedConstraints.num_students_needed} persona objects):\n${JSON.stringify(inputPayload, null, 2)}`;

  const completion = await client.chat.completions.create({
    model: "gpt-5-mini",
    messages: [
      { role: "system", content: PERSONAS_SYSTEM_PROMPT },
      { role: "user", content: userContent },
    ],
    stream: false,
  });
  
  const response = { output_text: completion.choices[0]?.message?.content || "" };

  const outputText = (response as { output_text?: string }).output_text ?? "";
  const parsed = extractPersonasJson(outputText);
  if (parsed) return parsed.slice(0, MAX_PERSONAS);
  try {
    const arr = JSON.parse(outputText) as object[];
    return Array.isArray(arr) ? arr.slice(0, MAX_PERSONAS) : [];
  } catch {
    return [];
  }
}

/** From profile + firstChallenge build teacherIdentity, lessonTopic, constraints (capped at 8). */
export function flowInputsFromProfileAndChallenge(profile: object, firstChallenge: object): {
  teacherIdentity: TeacherIdentitySlice;
  lessonTopic: LessonTopicSlice;
  constraints: PersonaGenerationConstraints;
} {
  const identity = (profile as { teacher_profile?: { identity?: { subjects_taught?: string[]; grade_levels?: string[] } } }).teacher_profile?.identity;
  const teacherIdentity: TeacherIdentitySlice = identity
    ? { subjects_taught: identity.subjects_taught ?? [], grade_levels: identity.grade_levels ?? [] }
    : { subjects_taught: [], grade_levels: [] };
  const lessonTopicObj = (firstChallenge as { lesson_topic?: { subject?: string; grade_level?: string } }).lesson_topic;
  const lessonTopic: LessonTopicSlice = lessonTopicObj
    ? { subject: lessonTopicObj.subject ?? "math", grade_level: lessonTopicObj.grade_level ?? "9th" }
    : { subject: "math", grade_level: "9th" };
  const raw = (firstChallenge as { lesson_topic?: { persona_generation_constraints?: PersonaGenerationConstraints } }).lesson_topic?.persona_generation_constraints
    ?? { num_students_needed: 5, student_archetypes_needed: [{ type: "mixed", count: 5 }] };
  const constraints: PersonaGenerationConstraints = {
    ...raw,
    num_students_needed: Math.min(raw.num_students_needed, MAX_PERSONAS),
  };
  return { teacherIdentity, lessonTopic, constraints };
}
