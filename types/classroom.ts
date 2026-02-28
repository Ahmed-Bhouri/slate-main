export interface ClassState {
  session_id: string
  round_num: number
  topic: string
  class_log: ClassLogEntry[]
  hand_queue: string[]
  time_since_question: number
  students: Record<string, Student>
}

export interface ClassLogEntry {
  round: number
  type: 'teacher' | 'student'
  speaker: string
  content: string
}

export interface Persona {
  identity: {
    name: string
    age: number
    grade: string
    current_class: string
    background_summary: string
  }
  personality: {
    openness: number
    conscientiousness: number
    extraversion: number
    agreeableness: number
    emotionality: number
  }
  skills: Record<string, number>
  initial_state: {
    mood_label: string
    mood_valence: number
    main_concern: string
    energy: number
    motivation: number
    stress: number
    focus: number
    engagement_with_lesson: number
  }
  communication_style: {
    sentence_length: number
    verbosity: number
    formality: number
    confidence: number
    warmth: number
    directness: number
    hedging: number
    asks_for_reassurance: number
    use_of_fillers: number
    clarity: number
    pace: number
    expressiveness: number
    willingness_to_speak_up: number
    example_phrases: string[]
    summary: string
  }
}

export interface Student {
  persona: Persona
  state: StudentState
}

export interface StudentState {
  attention: number
  understanding: number
  status: 'listening' | 'confused' | 'hand_raised' | 'zoned_out' | 'chatting' | 'frustrated'
  memory: string[]
  pending_question: string | null
  last_interacted_round: number
  rounds_hand_raised?: number
  mood: string
  energy: number
}

export interface RoundEntry {
  round: number
  sentence: string
  bloom_level: number
  teacher_asked_question: boolean
  student_spoke: boolean
  student_spoke_id: string | null
  new_hands_raised: number
  teacher_tip: string | null
  engagement_snapshot: number
}

export interface KPIs {
  engagement: number
  engagement_trend: number
  talk_ratio: { teacher: number; students: number }
  bloom_level: number
  confusion_index: number
  hand_raise_rate: number
  ignored_hands: number
  cold_call_risk: number
  inclusion_score: number
  latest_tip: string | null
}
