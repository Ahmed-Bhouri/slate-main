/**
 * Shared types and data for class cards (home + training pages).
 */

/** Data for a single class card. */
export type ClassCardData = {
  variant: "featured" | "default";
  classNumber?: string;
  badgeLabel?: string;
  title: string;
  titleColor?: string;
  subtitle: string;
  difficultyTags: { text: string; tagClass: string }[];
  skillsTags: { text: string; tagClass: string }[];
  durationTag: { text: string; tagClass: string };
  buttonText: string;
  buttonClass: string;
  showDecorativeStar?: boolean;
  href?: string;
  onClick?: () => void;
  challenge?: ClassScenarioChallenge; // Add full challenge object for click handler access
};

/** Shape of one challenge from POST /api/class-scenario (classScenario.challenges[]). */
export type ClassScenarioChallenge = {
  id?: string;
  teacher_name?: string;
  targeted_improvement?: string;
  targeted_metrics?: Record<string, { current?: number; expected_gain?: number }>;
  lesson_topic?: {
    subject?: string;
    topic?: string;
    grade_level?: string;
    objective?: string;
    persona_generation_constraints?: {
      num_students_needed: number;
      student_archetypes_needed: { type: string; count: number }[];
    };
  };
  difficulty?: string;
  estimated_duration?: number;
};

export function mapChallengeToClassCard(
  challenge: ClassScenarioChallenge,
  index: number
): ClassCardData {
  const lesson = challenge.lesson_topic ?? {};
  const subject = lesson.subject ?? "Class";
  const topic = lesson.topic ?? "General";
  const objective = lesson.objective ?? "";
  const difficulty = (challenge.difficulty ?? "medium").toLowerCase();
  const duration = challenge.estimated_duration ?? 30;
  const improvement = challenge.targeted_improvement ?? "Improvement";
  const metricKeys = challenge.targeted_metrics
    ? Object.keys(challenge.targeted_metrics).filter((k) => k && k !== improvement)
    : [];

  const difficultyTagClass =
    difficulty === "easy"
      ? "bg-[#05c770]"
      : difficulty === "hard"
        ? "bg-[#f13704]"
        : "bg-[#f1b903]";
  const titleColors = ["#04a2f1", "#01a65c"] as const;
  const titleColor = titleColors[index % titleColors.length];

  return {
    variant: index === 0 ? "featured" : "default",
    classNumber: index === 0 ? undefined : String(index + 1),
    badgeLabel: index === 0 ? "Adaptive class" : undefined,
    title: `${subject} - ${topic}`,
    titleColor: index === 0 ? undefined : titleColor,
    subtitle: objective,
    difficultyTags: [
      { text: improvement, tagClass: "bg-[#031bf1]" },
      {
        text: difficulty.charAt(0).toUpperCase() + difficulty.slice(1) + " topic",
        tagClass: difficultyTagClass,
      },
    ],
    skillsTags: (() => {
      const fromMetrics = metricKeys.slice(0, 2).map((k) => ({
        text: k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        tagClass: "bg-[#f1044f]" as const,
      }));
      if (fromMetrics.length >= 2) return fromMetrics;
      return [
        ...fromMetrics,
        { text: "Clarity", tagClass: "bg-[#f1044f]" as const },
      ].slice(0, 2);
    })(),
    durationTag: { text: `${duration} mins`, tagClass: "bg-[#04a2f1]" },
    buttonText: "Start Class",
    buttonClass: "bg-[#05c770]",
    showDecorativeStar: index === 0,
    href: challenge.id ? `/course-in-progress/${challenge.id}` : undefined,
    challenge // Pass original challenge object
  };
}

export const DEFAULT_CLASS_CARDS: ClassCardData[] = [
  {
    variant: "featured",
    badgeLabel: "Adaptive class",
    title: "Algebra - Basic",
    subtitle: "Basic set theory operations",
    difficultyTags: [
      { text: "big headcount", tagClass: "bg-[#f13704]" },
      { text: "Easy topic", tagClass: "bg-[#05c770]" },
    ],
    skillsTags: [
      { text: "Challenge", tagClass: "bg-[#a705c7]" },
      { text: "Clarity", tagClass: "bg-[#f1044f]" },
    ],
    durationTag: { text: "20 mins", tagClass: "bg-[#04a2f1]" },
    buttonText: "Start Class",
    buttonClass: "bg-[#05c770]",
    showDecorativeStar: true,
    href: "/course-in-progress",
  },
  {
    variant: "default",
    classNumber: "3",
    title: "Calculus - Intermediate",
    titleColor: "#04a2f1",
    subtitle: "Calculate the slope of a linear function",
    difficultyTags: [
      { text: "Huge skill gaps", tagClass: "bg-[#f13704]" },
      { text: "Medium topic", tagClass: "bg-[#f1b903]" },
    ],
    skillsTags: [
      { text: "Adaptivity", tagClass: "bg-[#031bf1]" },
      { text: "Clarity", tagClass: "bg-[#f1044f]" },
    ],
    durationTag: { text: "20 mins", tagClass: "bg-[#04a2f1]" },
    buttonText: "Start Class",
    buttonClass: "bg-[#05c770]",
    href: "/course-in-progress",
  },
  {
    variant: "default",
    classNumber: "4",
    title: "Calculus - Intermediate",
    titleColor: "#01a65c",
    subtitle: "Calculate the slope of a derivative function",
    difficultyTags: [
      { text: "Huge skill gaps", tagClass: "bg-[#f13704]" },
      { text: "Medium topic", tagClass: "bg-[#f1b903]" },
    ],
    skillsTags: [
      { text: "Adaptability", tagClass: "bg-[#031bf1]" },
      { text: "Clarity", tagClass: "bg-[#f1044f]" },
    ],
    durationTag: { text: "20 mins", tagClass: "bg-[#04a2f1]" },
    buttonText: "Start Class",
    buttonClass: "bg-[#05c770]",
    href: "/course-in-progress",
  },
];
