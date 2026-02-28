import { ClassState, ClassLogEntry } from '@/types/classroom';
import { OpenAI } from 'openai';
import { clamp } from '@/lib/utils';

export interface OrchestratorOutput {
  students_to_simulate: string[];
  teacher_asked_question: boolean;
  bloom_level: number;
  teacher_tip: string | null;
  called_on_student_id: string | null;
  topic_update?: string | null;
  debug_reason?: string | null;
}

interface StudentSummary {
  id: string
  name: string
  current_status: string
  attention: number
  understanding: number
}

export async function runOrchestrator(
  sentence: string,
  classState: ClassState,
  classLog: ClassLogEntry[]
): Promise<OrchestratorOutput> {
  const apiKey = process.env.OPENAI_API_KEY;
  const baseURL = process.env.OPENAI_BASE_URL;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
  
  const openai = new OpenAI({ baseURL, apiKey });

  const summaries: StudentSummary[] = Object.entries(classState.students).map(([id, s]) => ({
      id,
      name: s.persona.identity.name,
      current_status: s.state.status,
      attention: s.state.attention,
      understanding: s.state.understanding
  }));

  const systemPrompt = `
You are a classroom orchestrator AI. Your job is to decide which students should be actively simulated this round based on what the teacher said.

Your decisions should be:
1. Strategic — simulate students most likely to have a visible reaction
2. Efficient — don't simulate everyone every round (0-5 students max)
3. Pedagogically aware — detect Bloom's taxonomy level and teaching patterns

Bloom's Taxonomy Levels:
1 = Remembering (recall facts)
2 = Understanding (explain concepts)
3 = Applying (use knowledge in new situations)
4 = Analyzing (break down information)
5 = Evaluating (make judgments)
6 = Creating (produce new work)

Student Status Types:
- listening: paying attention, no visible reaction needed
- confused: lost, might need checking in
- hand_raised: wants to speak, definitely simulate
- zoned_out: disengaged, might need calling on
- chatting: distracted, might need intervention
- frustrated: ignored or overwhelmed, needs attention

Return JSON only:
{
  "students_to_simulate": [<array of 0-5 student IDs>],
  "teacher_asked_question": <boolean>,
  "bloom_level": <number 1-6>,
  "called_on_student_id": <string or null>,
  "teacher_tip": <string or null>,
  "topic_update": <string or null>,
  "debug_reason": <string or null>
}

Guidelines:
- ALWAYS simulate students with hand_raised (they want to speak)
- ALWAYS choose at least 1 student to simulate if there is at least 1 student in the room
- Simulate confused/frustrated students if teacher is explaining
- Simulate zoned_out students if teacher asks a question (cold call opportunity)
- Don't simulate listening students unless teacher asks a direct question
- If teacher just lectured, simulate 1-2 students max
- If teacher asked a question, simulate 3-5 students
- teacher_tip: optional 1-sentence coaching advice ("Try calling on quieter students" or "Good use of wait time")
- called_on_student_id: set this if teacher explicitly called on someone by name OR if you recommend calling on someone from hand queue
- topic_update: if the subject matter clearly changed (e.g. "photosynthesis" → "cellular respiration")
`;

  const studentSummaryText = summaries.map(s =>
    `- ${s.name} (${s.id}): ${s.current_status}, attention=${s.attention.toFixed(1)}, understanding=${s.understanding.toFixed(1)}`
  ).join('\n');

  const recentClassLog = classLog.map(e =>
    `[Round ${e.round}] ${e.speaker}: "${e.content}"`
  ).join('\n');

  const userPrompt = `
Teacher just said: "${sentence}"

Current topic: ${classState.topic || 'not set yet'}
Rounds since teacher last asked a question: ${classState.time_since_question}

Recent class activity:
${recentClassLog}

Current student states:
${studentSummaryText}

Decide which students to simulate and analyze the teacher's pedagogical approach.
Return JSON only.
`;

  console.log(`[${new Date().toISOString()}] Running Orchestrator for round ${classState.round_num}`);
  console.log("Orchestrator Prompt:", userPrompt);

  try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-mini',
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0].message.content;
      if (!content) throw new Error("No content from Orchestrator");
      
      console.log("Orchestrator Raw Output:", content);

      const raw = JSON.parse(content);
      return validateOrchestratorOutput(raw, summaries);
  } catch (error) {
      console.error("Orchestrator error:", error);
      return validateOrchestratorOutput({
        students_to_simulate: [],
        teacher_asked_question: false,
        bloom_level: 1,
        teacher_tip: null,
        called_on_student_id: null,
        topic_update: null,
        debug_reason: "orchestrator_error_fallback"
      }, summaries);
  }
}

function validateOrchestratorOutput(raw: any, studentSummary: StudentSummary[]): OrchestratorOutput {
  const validIds = studentSummary.map(s => s.id);
  const byName = new Map(studentSummary.map(s => [s.name.toLowerCase(), s.id] as const));
  
  const handsRaised = studentSummary.filter(s => s.current_status === 'hand_raised').map(s => s.id);
  const rawList: string[] = Array.isArray(raw.students_to_simulate) ? raw.students_to_simulate : [];
  let toSimulate = rawList
    .map((x) => (typeof x === 'string' ? x.trim() : ''))
    .filter(Boolean)
    .map((token) => {
      if (validIds.includes(token)) return token;
      const mapped = byName.get(token.toLowerCase());
      return mapped ?? token;
    })
    .filter((id) => validIds.includes(id));
  
  for (const id of handsRaised) {
    if (!toSimulate.includes(id)) toSimulate.push(id);
  }

  if (toSimulate.length === 0 && studentSummary.length > 0) {
    const priorityStatuses: StudentSummary['current_status'][] = [
      'confused',
      'frustrated',
      'zoned_out',
      'chatting',
      'listening'
    ];

    const pick =
      priorityStatuses
        .flatMap((st) => studentSummary.filter((s) => s.current_status === st))
        .sort((a, b) => a.attention - b.attention || a.understanding - b.understanding)[0] ??
      studentSummary.sort((a, b) => a.attention - b.attention || a.understanding - b.understanding)[0];

    if (pick) {
      toSimulate = [pick.id];
      console.log("[ORCHESTRATOR FALLBACK]", {
        reason: "empty_selection",
        picked: pick.id,
        pickedName: pick.name,
        pickedStatus: pick.current_status,
        rawStudentsToSimulate: rawList
      });
    }
  }
  
  if (toSimulate.length > 5) {
    toSimulate = toSimulate.slice(0, 5);
  }
  
  return {
    students_to_simulate: toSimulate,
    teacher_asked_question: raw.teacher_asked_question ?? false,
    bloom_level: clamp(raw.bloom_level ?? 1, 1, 6),
    called_on_student_id: validIds.includes(raw.called_on_student_id) ? raw.called_on_student_id : null,
    teacher_tip: typeof raw.teacher_tip === 'string' ? raw.teacher_tip : null,
    topic_update: typeof raw.topic_update === 'string' ? raw.topic_update : null,
    debug_reason: typeof raw.debug_reason === 'string' ? raw.debug_reason : null
  };
}
