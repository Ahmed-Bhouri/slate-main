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

Task:
Generate a structured JSON report evaluating the teacher's performance.
The report must include:
1. "summary": A 2-3 sentence overview of the session.
2. "strengths": Array of 3 specific things the teacher did well (with examples from the log).
3. "areas_for_improvement": Array of 3 specific actionable advice (with examples of what went wrong).
4. "score_adjustment": A recommendation for how to adjust the teacher's profile scores (-0.1 to +0.1) for these categories:
   - "classroom_management"
   - "student_engagement"
   - "content_knowledge"
   - "instructional_clarity"

Return JSON only.
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

  return JSON.parse(content);
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
