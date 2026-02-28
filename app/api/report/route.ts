import { NextRequest, NextResponse } from "next/server";
import { ClassState, KPIs } from "@/types/classroom";
import { OpenAI } from "openai";

export async function POST(request: NextRequest) {
  try {
    const { classState, kpis, teacherProfile } = await request.json();

    if (!classState || !kpis || !teacherProfile) {
      return NextResponse.json(
        { error: "Missing required fields: classState, kpis, or teacherProfile" },
        { status: 400 }
      );
    }

    const report = await generateReport(classState, kpis, teacherProfile);
    const updatedProfile = await updateTeacherProfile(teacherProfile, report, kpis);

    return NextResponse.json({ report, updatedProfile });
  } catch (error) {
    console.error("Report generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

async function generateReport(classState: ClassState, kpis: KPIs, teacherProfile: any) {
  const apiKey = process.env.OPENAI_API_KEY;
  const baseURL = process.env.OPENAI_BASE_URL;
  const openai = new OpenAI({ baseURL, apiKey });

  const classLogSummary = classState.class_log
    .map((e) => `[${e.type.toUpperCase()}] ${e.speaker}: ${e.content}`)
    .join("\n");

  const teacherName = teacherProfile.identity?.name || teacherProfile.teacher_profile?.identity?.name || "Teacher";

  const systemPrompt = `
You are an expert pedagogical analyst. Your job is to analyze a classroom simulation session and generate a detailed performance report for the teacher.

Context:
- Teacher: ${teacherName}
- Topic: ${classState.topic}
- Session KPIs: 
  - Engagement: ${(kpis.engagement * 100).toFixed(1)}%
  - Talk Ratio (Teacher/Student): ${kpis.talk_ratio.teacher.toFixed(1)} / ${kpis.talk_ratio.students.toFixed(1)}
  - Bloom Level Average: ${kpis.bloom_level.toFixed(1)}
  - Inclusion Score: ${(kpis.inclusion_score * 100).toFixed(1)}%

You MUST respond with valid JSON only, no markdown or extra text. Use exactly this structure:

{
  "summary": "<2-3 sentence overview of the session>",
  "strengths": ["<first strength with optional example from log>", "<second strength>", "<third strength>"],
  "areas_for_improvement": ["<first actionable improvement>", "<second improvement>", "<third improvement>"],
  "score_adjustment": {
    "classroom_management": <number from -0.1 to 0.1>,
    "student_engagement": <number from -0.1 to 0.1>,
    "content_knowledge": <number from -0.1 to 0.1>,
    "instructional_clarity": <number from -0.1 to 0.1>
  }
}

Rules:
- "summary": One string, 2-3 sentences.
- "strengths": Exactly 3 strings. Each string describes one thing the teacher did well; you may include a brief example from the transcript.
- "areas_for_improvement": Exactly 3 strings. Each string is one specific, actionable piece of advice.
- "score_adjustment": Object with exactly the four keys above. Each value is a number between -0.1 and 0.1 (e.g. 0.05, -0.08). Use 0 if no change.
- Do not add any other keys. Do not wrap the JSON in code blocks or markdown.
`;

  const userPrompt = `
Classroom Transcript:
${classLogSummary}
`;

  const response = await openai.chat.completions.create({
    model: "gpt-5-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0].message.content;
  if (!content) throw new Error("No report generated");

  let parsed: Record<string, unknown>;
  try {
    const raw = content.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new Error("Report response was not valid JSON");
  }

  return normalizeReport(parsed);
}

/** Ensure the report has the exact shape expected by the frontend. */
function normalizeReport(parsed: Record<string, unknown>): Record<string, unknown> {
  const summary =
    typeof parsed.summary === "string"
      ? parsed.summary
      : "Session analysis complete.";

  const strengths = Array.isArray(parsed.strengths)
    ? parsed.strengths
        .filter((s): s is string => typeof s === "string")
        .slice(0, 3)
    : [];
  while (strengths.length < 3) strengths.push("—");

  const areas_for_improvement = Array.isArray(parsed.areas_for_improvement)
    ? parsed.areas_for_improvement
        .filter((s): s is string => typeof s === "string")
        .slice(0, 3)
    : [];
  while (areas_for_improvement.length < 3) areas_for_improvement.push("—");

  const rawAdj = parsed.score_adjustment;
  const score_adjustment: Record<string, number> = {
    classroom_management: 0,
    student_engagement: 0,
    content_knowledge: 0,
    instructional_clarity: 0,
  };
  if (rawAdj && typeof rawAdj === "object" && !Array.isArray(rawAdj)) {
    for (const key of Object.keys(score_adjustment)) {
      const v = (rawAdj as Record<string, unknown>)[key];
      if (typeof v === "number" && v >= -0.1 && v <= 0.1) score_adjustment[key] = v;
    }
  }

  return {
    summary,
    strengths,
    areas_for_improvement,
    score_adjustment,
  };
}

async function updateTeacherProfile(currentProfile: any, report: any, kpis: KPIs) {
  // Deep copy to avoid mutation issues
  const newProfile = JSON.parse(JSON.stringify(currentProfile));

  // Ensure performance_metrics exists
  if (!newProfile.performance_metrics) {
    if (newProfile.teacher_profile?.performance_metrics) {
       // Handle nested structure
       newProfile.performance_metrics = newProfile.teacher_profile.performance_metrics;
    } else {
       newProfile.performance_metrics = {
         overall_score: 0.5,
         classroom_engagement: 0.5,
         student_growth: 0.5,
         behavior_management: 0.5,
         assessment_scores: 0.5,
       };
    }
  }

  // Helper to clamp values between 0 and 1
  const clamp = (num: number) => Math.max(0, Math.min(1, num));

  // Apply score adjustments from the report
  const adjustments = report.score_adjustment || {};
  
  // Map report categories to profile metrics
  // Profile metrics: overall_score, classroom_engagement, student_growth, behavior_management
  
  // 1. Classroom Engagement
  if (adjustments.student_engagement) {
    newProfile.performance_metrics.classroom_engagement = clamp(
      newProfile.performance_metrics.classroom_engagement + adjustments.student_engagement
    );
  }

  // 2. Behavior Management (mapped from classroom_management)
  if (adjustments.classroom_management) {
    newProfile.performance_metrics.behavior_management = clamp(
      newProfile.performance_metrics.behavior_management + adjustments.classroom_management
    );
  }

  // 3. Instructional Clarity (maps to explanation_clarity in strengths if it existed, or we can average it into student_growth)
  // For now, let's impact student_growth based on instructional_clarity + content_knowledge
  const instructionalGain = (adjustments.instructional_clarity || 0) + (adjustments.content_knowledge || 0);
  if (instructionalGain !== 0) {
    newProfile.performance_metrics.student_growth = clamp(
      newProfile.performance_metrics.student_growth + (instructionalGain / 2)
    );
  }

  // 4. Update Overall Score (simple average of the main metrics)
  const metrics = newProfile.performance_metrics;
  newProfile.performance_metrics.overall_score = clamp(
    (metrics.classroom_engagement + metrics.student_growth + metrics.behavior_management) / 3
  );

  return newProfile;
}
