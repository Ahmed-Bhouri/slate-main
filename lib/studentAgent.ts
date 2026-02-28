import { StudentState, Persona, ClassLogEntry } from '@/types/classroom';
import { OpenAI } from 'openai';
import { clamp } from '@/lib/utils';

export interface StudentAgentResult {
  attention_delta: number;
  understanding_delta: number;
  next_status: StudentState['status'];
  pending_question: string | null;
  chat_message: string | null;
  memory_note: string | null;
}

export async function runStudentAgent(params: {
  persona: Persona;
  state: StudentState;
  sentence: string;
  classLog: ClassLogEntry[];
  classMood: string;
  lastStudentInteraction: ClassLogEntry | null;
  teacherAskedQuestion: boolean;
}): Promise<StudentAgentResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  const baseURL = process.env.OPENAI_BASE_URL;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
  
  const openai = new OpenAI({ baseURL, apiKey });

  const { persona, state, sentence, classLog, classMood, lastStudentInteraction, teacherAskedQuestion } = params;

  const systemPrompt = `
You are ${persona.identity.name}, age ${persona.identity.age}.

Background: ${persona.identity.background_summary}

Personality (Big Five):
- Openness: ${persona.personality.openness} (0 = traditional, 1 = curious)
- Conscientiousness: ${persona.personality.conscientiousness} (0 = spontaneous, 1 = organized)
- Extraversion: ${persona.personality.extraversion} (0 = reserved, 1 = outgoing)
- Agreeableness: ${persona.personality.agreeableness} (0 = competitive, 1 = cooperative)
- Emotionality: ${persona.personality.emotionality} (0 = stable, 1 = sensitive)

Communication style:
${persona.communication_style.summary}
Example phrases you naturally use: ${persona.communication_style.example_phrases.join(', ')}
Confidence: ${persona.communication_style.confidence}
Willingness to speak up: ${persona.communication_style.willingness_to_speak_up}

Current emotional state:
- Mood: ${state.mood}
- Energy: ${state.energy}/100

---

Your task: React to what the teacher just said. Output JSON only.

Return format:
{
  "attention_delta": <number from -20 to +20>,
  "understanding_delta": <number from -20 to +20>,
  "next_status": <"listening" | "confused" | "hand_raised" | "zoned_out" | "chatting" | "frustrated">,
  "pending_question": <string or null>,
  "chat_message": <string or null>,
  "memory_note": <string or null>
}

Guidelines:
- attention_delta: how much your focus changed (+10 if engaging, -5 if boring, -15 if completely lost)
- understanding_delta: how much you learned (+5 if clear, -10 if confusing, 0 if neutral)
- next_status: your new state after hearing this
- pending_question: if you want to raise your hand, write the question you'd ask
- chat_message: if you're distracted and messaging a friend, write what you'd say
- memory_note: if something important happened, write a 1-sentence note for yourself

Be realistic based on your personality. Extraverts speak up more. Low conscientiousness = distracted easier. High emotionality = react stronger to confusion.
`;

  const classLogFormatted = classLog.slice(-10).map(e =>
    `[Round ${e.round}] ${e.speaker}: "${e.content}"`
  ).join('\n');

  const lastStudentText = lastStudentInteraction
    ? `Last student who spoke: ${lastStudentInteraction.speaker}\nWhat they said: "${lastStudentInteraction.content}"`
    : "No student has spoken yet.";

  const userPrompt = `
Teacher just said: "${sentence}"
Teacher asked a question: ${teacherAskedQuestion}

Class context (what you heard recently):
${classLogFormatted}

${lastStudentText}

Your current state:
- Attention: ${state.attention.toFixed(1)}/100
- Understanding: ${state.understanding.toFixed(1)}/100
- Status: ${state.status}
- Your recent memory: ${state.memory.slice(-3).join(' | ') || 'nothing yet'}

Class mood right now: ${classMood}

React to the teacher's input. Return JSON only.
`;

  console.log(`Student Agent Prompt (${persona.identity.name}):`, userPrompt);

  try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-mini',
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' },
      });

      const message = response.choices[0]?.message;
      const content = message?.content ?? null;
      if (!content) throw new Error("No content from Student Agent");
      
      console.log(`Student Agent Raw Output (${persona.identity.name}):`, content);

      const raw = JSON.parse(content);
      return validateStudentOutput(raw);
  } catch (error) {
      console.error(`Student Agent error (${persona.identity.name}):`, error);
      return {
          attention_delta: 0,
          understanding_delta: 0,
          next_status: state.status,
          pending_question: null,
          chat_message: null,
          memory_note: null
      };
  }
}

function validateStudentOutput(raw: any): StudentAgentResult {
  const validStatuses: StudentState['status'][] = ['listening', 'confused', 'hand_raised', 'zoned_out', 'chatting', 'frustrated'];
  
  return {
    attention_delta: clamp(raw.attention_delta ?? 0, -20, 20),
    understanding_delta: clamp(raw.understanding_delta ?? 0, -20, 20),
    next_status: validStatuses.includes(raw.next_status)
      ? raw.next_status
      : 'listening',
    pending_question: typeof raw.pending_question === 'string' ? raw.pending_question : null,
    chat_message: typeof raw.chat_message === 'string' ? raw.chat_message : null,
    memory_note: (typeof raw.memory_note === 'string' && raw.memory_note.length < 100) ? raw.memory_note : null
  };
}
