import { ClassState } from '@/types/classroom';

export function deriveClassMood(classState: ClassState): string {
  const students = Object.values(classState.students)
  if (students.length === 0) return "neutral"
  
  const avgAttention = students.reduce((sum, s) => sum + s.state.attention, 0) / students.length
  const confusedCount = students.filter(s => s.state.status === 'confused').length
  const confusedRatio = confusedCount / students.length
  
  if (avgAttention > 70 && confusedRatio < 0.2) return "engaged"
  if (confusedRatio > 0.4) return "confused"
  if (avgAttention < 40) return "restless"
  return "neutral"
}
