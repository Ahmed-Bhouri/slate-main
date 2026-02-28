import { ClassState, RoundEntry, KPIs } from '@/types/classroom';

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((sum, n) => sum + n, 0) / nums.length;
}

export function calculateAvgAttention(classState: ClassState): number {
  const students = Object.values(classState.students);
  if (students.length === 0) return 0;
  return avg(students.map(s => s.state.attention));
}

export function calculateKPIs(
  classState: ClassState,
  roundHistory: RoundEntry[]
): KPIs {
  const students = Object.values(classState.students);
  const totalRounds = classState.round_num;

  // 1. Engagement
  const engagement = calculateAvgAttention(classState);

  // 2. Engagement Trend
  const engagement_trend = (() => {
    if (roundHistory.length < 10) return 0;
    const last5 = roundHistory.slice(-5).map(r => r.engagement_snapshot);
    const prev5 = roundHistory.slice(-10, -5).map(r => r.engagement_snapshot);
    return avg(last5) - avg(prev5);
  })();

  // 3. Talk Ratio
  const studentSpokeRounds = roundHistory.filter(r => r.student_spoke).length;
  const talk_ratio = {
    teacher: totalRounds > 0 ? ((totalRounds - studentSpokeRounds) / totalRounds) * 100 : 100,
    students: totalRounds > 0 ? (studentSpokeRounds / totalRounds) * 100 : 0
  };

  // 4. Bloom Level
  const bloom_level = roundHistory.length > 0 
    ? avg(roundHistory.slice(-5).map(r => r.bloom_level ?? 1))
    : 1;

  // 5. Confusion Index
  const confusedCount = students.filter(s =>
    ['confused', 'zoned_out', 'frustrated'].includes(s.state.status)
  ).length;
  const confusion_index = students.length > 0 ? (confusedCount / students.length) * 100 : 0;

  // 6. Hand Raise Rate
  const hand_raise_rate = roundHistory
    .slice(-10)
    .filter(r => r.new_hands_raised > 0).length;

  // 7. Ignored Hands
  const ignored_hands = students.filter(s => s.state.status === 'frustrated').length;

  // 8. Cold Call Risk
  const cold_call_risk = students.filter(s => {
    const roundsSince = totalRounds - (s.state.last_interacted_round ?? 0);
    return s.state.status === 'zoned_out' && roundsSince > 5;
  }).length;

  // 9. Inclusion Score
  const uniqueSpeakers = new Set(
    roundHistory.map(r => r.student_spoke_id).filter(Boolean)
  );
  const inclusion_score = students.length > 0 ? (uniqueSpeakers.size / students.length) * 100 : 0;

  // 10. Latest Tip
  const latest_tip = roundHistory.length > 0
    ? roundHistory[roundHistory.length - 1].teacher_tip
    : null;

  return {
    engagement,
    engagement_trend,
    talk_ratio,
    bloom_level,
    confusion_index,
    hand_raise_rate,
    ignored_hands,
    cold_call_risk,
    inclusion_score,
    latest_tip
  };
}
