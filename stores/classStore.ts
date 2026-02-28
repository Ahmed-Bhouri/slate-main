import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { ClassState, RoundEntry, KPIs, Student } from '@/types/classroom'
import { calculateKPIs, calculateAvgAttention } from '@/lib/calculateKPIs'
import { deriveClassMood } from '@/lib/deriveClassMood'

interface SessionData {
  classState: ClassState
  roundHistory: RoundEntry[]
  lastUpdated: number
}

interface ClassStore {
  // Active session
  classState: ClassState | null
  roundHistory: RoundEntry[]
  isProcessing: boolean
  /** True after session is ended (e.g. via End session → report); cleared when a new class is initialized */
  sessionEnded: boolean

  // All saved sessions
  sessions: Record<string, SessionData>

  // Actions
  initializeClass: (classState: ClassState) => void
  updateFromRound: (newClassState: ClassState, orchestratorOutput: any) => void
  loadSession: (sessionId: string) => void
  deleteSession: (sessionId: string) => void
  /** Clears active session. Pass { markSessionEnded: false } when starting fresh (e.g. Start new session). */
  reset: (options?: { markSessionEnded?: boolean }) => void
  
  // Getters
  getKPIs: () => KPIs | null
  getStudent: (id: string) => Student | null
  getClassMood: () => string
}

export const useClassStore = create<ClassStore>()(
  devtools(
    persist(
      (set, get) => ({
        classState: null,
        roundHistory: [],
        sessions: {},
        isProcessing: false,
        sessionEnded: false,

        initializeClass: (classState: ClassState) => {
          const { sessions } = get()

          const newSession: SessionData = {
            classState,
            roundHistory: [],
            lastUpdated: Date.now()
          }

          set({
            classState,
            roundHistory: [],
            isProcessing: false,
            sessionEnded: false,
            sessions: {
              ...sessions,
              [classState.session_id]: newSession
            }
          })
        },

        updateFromRound: (newClassState: ClassState, orchestratorOutput: any) => {
          const { classState, roundHistory, sessions } = get()
          
          if (!classState) return;

          const entry: RoundEntry = {
            round: newClassState.round_num,
            sentence: newClassState.class_log[newClassState.class_log.length - 1]?.content ?? "",
            bloom_level: orchestratorOutput.bloom_level ?? 1,
            teacher_asked_question: orchestratorOutput.teacher_asked_question ?? false,
            student_spoke: orchestratorOutput.called_on_student_id !== null,
            student_spoke_id: orchestratorOutput.called_on_student_id ?? null,
            new_hands_raised: Math.max(0, newClassState.hand_queue.length - (classState?.hand_queue.length ?? 0)),
            teacher_tip: orchestratorOutput.teacher_tip ?? null,
            engagement_snapshot: calculateAvgAttention(newClassState)
          }
          
          const updatedHistory = [...roundHistory, entry]
          
          set({
            classState: newClassState,
            roundHistory: updatedHistory,
            isProcessing: false,
            sessions: {
              ...sessions,
              [newClassState.session_id]: {
                classState: newClassState,
                roundHistory: updatedHistory,
                lastUpdated: Date.now()
              }
            }
          })
        },

        loadSession: (sessionId: string) => {
          const { sessions } = get()
          const session = sessions[sessionId]
          if (session) {
            set({
              classState: session.classState,
              roundHistory: session.roundHistory,
              isProcessing: false
            })
          } else {
            set({
              classState: null,
              roundHistory: [],
              isProcessing: false
            })
          }
        },

        deleteSession: (sessionId: string) => {
          const { sessions, classState } = get()
          const newSessions = { ...sessions }
          delete newSessions[sessionId]
          
          // If deleting the active session, clear active state
          const isActive = classState?.session_id === sessionId
          
          set({
            sessions: newSessions,
            ...(isActive ? { classState: null, roundHistory: [] } : {})
          })
        },

        reset: (options) => {
          const markSessionEnded = options?.markSessionEnded !== false
          set({
            classState: null,
            roundHistory: [],
            isProcessing: false,
            sessionEnded: markSessionEnded
          })
          // We intentionally DO NOT clear sessions here,
          // so "End Session" just clears active state but keeps history.
        },

        getKPIs: () => {
          const { classState, roundHistory } = get()
          if (!classState) return null
          
          return calculateKPIs(classState, roundHistory)
        },

        getStudent: (id: string) => {
          const { classState } = get()
          return classState?.students[id] ?? null
        },

        getClassMood: () => {
          const { classState } = get()
          if (!classState) return "neutral"
          
          return deriveClassMood(classState)
        }
      }),
      {
        name: 'classroom-session',
        partialize: (state) => ({
          classState: state.classState,
          roundHistory: state.roundHistory,
          sessions: state.sessions,
          sessionEnded: state.sessionEnded
        })
      }
    )
  )
)
