"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import clsx from "clsx";
import svgPaths from "@/lib/home-svg-paths";
import {
  mapChallengeToClassCard,
  DEFAULT_CLASS_CARDS,
  type ClassCardData,
  type ClassScenarioChallenge,
} from "@/lib/class-cards";
import { useProfileStore } from "@/stores/profileStore";
import { ClassCard } from "@/components/class-card";

// loadProfileFromStorage removed
function Wrapper1({ children }: React.PropsWithChildren) {
  return (
    <div className="overflow-clip rounded-[inherit] size-full">
      <div className="content-stretch flex flex-col gap-[16px] items-start p-[16px] relative w-full">
        {children}
      </div>
    </div>
  );
}

type WrapperProps = {
  additionalClassNames?: string;
};

function Wrapper({
  children,
  additionalClassNames = "",
}: React.PropsWithChildren<WrapperProps>) {
  return (
    <div className={clsx("relative shrink-0 w-full", additionalClassNames)}>
      <Wrapper1>{children}</Wrapper1>
      <div
        aria-hidden
        className="absolute border border-[#d6d6d6] border-solid inset-[-0.5px] pointer-events-none"
      />
    </div>
  );
}

function Helper3() {
  return (
    <div className="bg-white flex-[1_0_0] h-[10px] min-h-px min-w-px relative">
      <div
        aria-hidden
        className="absolute border border-[#d6d6d6] border-solid inset-0 pointer-events-none"
      />
      <div className="flex flex-row items-center justify-center size-full">
        <div className="size-full" />
      </div>
    </div>
  );
}

/** One skill/performance metric for the stats and metric cards (value 0–1). */
export type SkillMetric = {
  name: string;
  value: number;
  color: string;
};

const SKILL_METRIC_PALETTE = [
  "#031bf1", // Adaptability blue
  "#f1044f", // Clarity pink
  "#9ac705", // Inclusion green
  "#a705c7", // Challenge purple
  "#01a6bb", // Safety teal
  "#f1b903", // extra
  "#f13704", // extra
] as const;

const DEFAULT_SKILL_METRICS: SkillMetric[] = [
  { name: "Adaptability", value: 7 / 21, color: "#031bf1" },
  { name: "Clarity", value: 7 / 21, color: "#f1044f" },
  { name: "Inclusion", value: 9 / 21, color: "#9ac705" },
  { name: "Challenge", value: 7 / 21, color: "#a705c7" },
  { name: "Safety", value: 7 / 21, color: "#01a6bb" },
];

/** Extract skill metrics from stored teacher profile (performance_metrics + strengths + weaknesses). */
function getSkillMetricsFromProfile(profile: object | null): SkillMetric[] {
  if (!profile || typeof profile !== "object") return DEFAULT_SKILL_METRICS;
  const tp = (profile as { teacher_profile?: Record<string, unknown> }).teacher_profile;
  if (!tp) return DEFAULT_SKILL_METRICS;

  const metrics: { name: string; value: number }[] = [];
  const addNumeric = (obj: Record<string, unknown> | undefined, prefix = "") => {
    if (!obj || typeof obj !== "object") return;
    for (const [key, val] of Object.entries(obj)) {
      if (typeof val === "number" && val >= 0 && val <= 1) {
        const label = key
          .replace(/_/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());
        metrics.push({ name: prefix ? `${prefix}: ${label}` : label, value: val });
      }
    }
  };

  addNumeric(tp.performance_metrics as Record<string, unknown> | undefined);
  addNumeric(tp.strengths as Record<string, unknown> | undefined, "Strength");
  addNumeric(tp.weaknesses as Record<string, unknown> | undefined, "Focus");

  if (metrics.length === 0) return DEFAULT_SKILL_METRICS;
  return metrics.map((m, i) => ({
    ...m,
    color: SKILL_METRIC_PALETTE[i % SKILL_METRIC_PALETTE.length],
  }));
}

/** Data for the "My personal card" section, derived from profile. */
export type PersonalCardData = {
  cardName: string;
  description: string;
  teachingStyles: string[];
};

const DEFAULT_PERSONAL_CARD: PersonalCardData = {
  cardName: "The Rushing River",
  description:
    "You ignite fast learners but occasionally leave quieter students behind",
  teachingStyles: ["Socratic", "Narrative", "Dominatory"],
};

function getPersonalCardFromProfile(profile: object | null): PersonalCardData {
  if (!profile || typeof profile !== "object") return DEFAULT_PERSONAL_CARD;
  const tp = (profile as { teacher_profile?: Record<string, unknown> })
    .teacher_profile;
  if (!tp) return DEFAULT_PERSONAL_CARD;

  const identity = tp.identity as Record<string, unknown> | undefined;
  const teachingStyle = tp.teaching_style as
    | { primary_approach?: string; secondary_approach?: string }
    | undefined;
  const goals = tp.goals as
    | {
        primary_goal?: string;
        secondary_goal?: string;
        professional_development_focus?: string;
      }
    | undefined;

  const name = identity?.name as string | undefined;
  const primary = teachingStyle?.primary_approach;
  const secondary = teachingStyle?.secondary_approach;
  const styles = [primary, secondary].filter(
    (s): s is string => typeof s === "string" && s.length > 0
  );
  const cardName =
    (goals?.primary_goal as string) ||
    (name ? `${name}'s profile` : null) ||
    DEFAULT_PERSONAL_CARD.cardName;
  const description =
    (goals?.professional_development_focus as string) ||
    (goals?.secondary_goal as string) ||
    DEFAULT_PERSONAL_CARD.description;

  return {
    cardName: typeof cardName === "string" ? cardName : DEFAULT_PERSONAL_CARD.cardName,
    description:
      typeof description === "string" ? description : DEFAULT_PERSONAL_CARD.description,
    teachingStyles:
      styles.length > 0 ? styles : DEFAULT_PERSONAL_CARD.teachingStyles,
  };
}

const SEGMENTS_PER_BAR = 21;

function SkillMetricCard({ name, value, color }: SkillMetric) {
  const filled = Math.round(value * SEGMENTS_PER_BAR);
  const empty = Math.max(0, SEGMENTS_PER_BAR - filled);
  const barStyle = { backgroundColor: color };
  return (
    <Wrapper additionalClassNames="bg-white">
      <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
        <p
          className="font-bold leading-[1.2] relative shrink-0 text-[24px]"
          style={{ color }}
        >
          {name}
        </p>
      </div>
      <div className="content-stretch flex gap-[4px] items-start relative shrink-0 w-full flex-wrap">
        {Array.from({ length: filled }, (_, i) => (
          <Helper2 key={`f-${i}`} additionalClassNames="" style={barStyle} />
        ))}
        {Array.from({ length: empty }, (_, i) => (
          <Helper3 key={`e-${i}`} />
        ))}
      </div>
    </Wrapper>
  );
}

function SkillMetricCards({ metrics }: { metrics: SkillMetric[] }) {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full">
      {metrics.map((m) => (
        <SkillMetricCard key={m.name} {...m} />
      ))}
    </div>
  );
}

type Helper2Props = {
  additionalClassNames?: string;
  style?: React.CSSProperties;
};

function Helper2({ additionalClassNames = "", style }: Helper2Props) {
  return (
    <div
      className={clsx(
        "flex-[1_0_0] h-[10px] min-h-px min-w-px relative",
        additionalClassNames
      )}
      style={style}
    >
      <div className="flex flex-row items-center justify-center size-full">
        <div className="size-full" />
      </div>
    </div>
  );
}

type Text3Props = {
  text: string;
  additionalClassNames?: string;
};

function Text3({ text, additionalClassNames = "" }: Text3Props) {
  return (
    <div
      className={clsx(
        "content-stretch flex items-center justify-center px-[6px] py-[12px] relative",
        additionalClassNames
      )}
    >
      <p className="flex-[1_0_0] font-medium leading-[1.2] min-h-px min-w-px relative text-[14px] text-white whitespace-pre-wrap">
        {text}
      </p>
    </div>
  );
}

type Text2Props = {
  text: string;
};

function Text2({ text }: Text2Props) {
  return (
    <div className="bg-white content-stretch flex items-center justify-center px-[6px] py-[4px] relative shrink-0">
      <p className="font-medium leading-[1.2] relative shrink-0 text-[12px] text-black uppercase">
        {text}
      </p>
    </div>
  );
}

type TextProps = {
  text: string;
  additionalClassNames?: string;
};

function Text({ text, additionalClassNames = "" }: TextProps) {
  return (
    <div
      className={clsx(
        "content-stretch flex items-center justify-center px-[6px] py-[4px] relative shrink-0",
        additionalClassNames
      )}
    >
      <p className="font-medium leading-[1.2] relative shrink-0 text-[12px] text-white uppercase">
        {text}
      </p>
    </div>
  );
}

/** Re-export for consumers that import from the home page. */
export type { ClassCardData } from "@/lib/class-cards";

export default function Home() {
  const router = useRouter();
  const [classCards, setClassCards] = useState<ClassCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [skillMetrics, setSkillMetrics] = useState<SkillMetric[]>(DEFAULT_SKILL_METRICS);
  const [personalCard, setPersonalCard] = useState<PersonalCardData>(DEFAULT_PERSONAL_CARD);

  const { teacherProfile, classScenario, setClassScenario, hasHydrated } = useProfileStore();

  useEffect(() => {
    if (!hasHydrated) return;

    if (!teacherProfile) {
      router.replace("/profile-chat");
      return;
    }

    setSkillMetrics(getSkillMetricsFromProfile(teacherProfile));
    setPersonalCard(getPersonalCardFromProfile(teacherProfile));

    if (classScenario?.challenges && classScenario.challenges.length > 0) {
      setClassCards(classScenario.challenges.map((c, i) => mapChallengeToClassCard(c, i)));
      setLoading(false);
      return;
    }

    let cancelled = false;
    setError(null);
    fetch("/api/class-scenario", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile: teacherProfile }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(res.status === 400 ? "Invalid profile" : "Failed to load challenges");
        return res.json();
      })
      .then((data: { classScenario?: { challenges?: ClassScenarioChallenge[] }; error?: string }) => {
        if (cancelled) return;
        if (data.error) throw new Error(data.error);
        const challenges = data.classScenario?.challenges ?? [];
        if (challenges.length > 0) {
          setClassScenario({ challenges });
          setClassCards(challenges.map((c, i) => mapChallengeToClassCard(c, i)));
        } else {
          setClassCards(DEFAULT_CLASS_CARDS);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load class scenarios");
          setClassCards(DEFAULT_CLASS_CARDS);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [hasHydrated, teacherProfile, classScenario, router, setClassScenario]);

  if (!hasHydrated) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-white">
          <p className="text-gray-500">Loading...</p>
        </div>
      );
  }

  return (
    <div
      className="bg-white content-stretch flex flex-col gap-[12px] items-center pb-[80px] relative size-full min-h-screen"
      data-name="Home"
    >
      <div
        className="content-stretch flex items-center justify-center overflow-clip px-[48px] py-[24px] relative shrink-0 w-full max-w-[1512px]"
        data-name="navbar"
      >
        <div className="flex-[1_0_0] max-w-[1280px] min-h-px min-w-px relative w-full">
          <div className="flex flex-row items-center max-w-[inherit] size-full">
            <div className="content-stretch flex items-center justify-between max-w-[inherit] px-[32px] relative w-full flex-wrap gap-4">
              <div className="content-stretch flex items-center relative shrink-0 min-w-0">
                <svg
                  width="107"
                  height="24"
                  viewBox="0 0 107 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="block shrink-0"
                  aria-hidden
                >
                  <path d="M48.7593 1.16655C50.2138 1.16656 51.5035 1.41873 52.6283 1.92294C53.7725 2.40779 54.6648 3.14479 55.3048 4.13388C55.9642 5.10357 56.2938 6.32543 56.2938 7.79936V8.67205H52.512V7.79936C52.512 7.02361 52.3569 6.40295 52.0466 5.9375C51.7557 5.45267 51.329 5.10361 50.7666 4.89027C50.2042 4.65755 49.5351 4.5412 48.7593 4.54119C47.5957 4.54119 46.7326 4.76418 46.1702 5.21023C45.6272 5.6369 45.3556 6.22854 45.3556 6.98491C45.3556 7.48907 45.4817 7.91568 45.7338 8.26474C46.0053 8.61383 46.4029 8.90488 46.9266 9.13761C47.4502 9.37032 48.1193 9.57386 48.9339 9.7484L49.6029 9.894C51.0574 10.2043 52.318 10.6018 53.3847 11.0866C54.4707 11.5715 55.3144 12.2115 55.9156 13.0066C56.5168 13.8017 56.909 14.8929 56.909 16.1341C56.909 17.3753 56.4975 18.3983 55.8575 19.3485C55.2369 20.2794 54.3446 21.0163 53.181 21.5593C52.0368 22.0829 50.6793 22.3448 49.1084 22.3448C47.5375 22.3448 46.1508 22.0636 44.9484 21.5012C43.746 20.9388 42.8053 20.1339 42.1265 19.0866C41.4477 18.0394 41.1084 16.7788 41.1084 15.3049V14.4902H44.8902V15.3049C44.8902 16.5267 45.2684 17.4479 46.0248 18.0685C46.7811 18.6697 47.809 18.9703 49.1084 18.9703C50.4272 18.9703 51.4066 18.7085 52.0466 18.1848C52.706 17.6612 53.0356 16.9921 53.0356 16.1776C53.0356 15.6151 52.8708 15.1593 52.5411 14.8102C52.2308 14.4611 51.7654 14.1799 51.1448 13.9666C50.5436 13.7339 49.8066 13.5206 48.9339 13.3267L48.2646 13.1811C46.8683 12.8708 45.6659 12.483 44.6574 12.0176C43.6683 11.5327 42.9023 10.9024 42.3593 10.1266C41.8357 9.35085 41.5738 8.3424 41.5738 7.10121C41.5738 5.86 41.8646 4.80295 42.4465 3.93022C43.0477 3.0381 43.8818 2.35945 44.9484 1.894C46.0345 1.40916 47.3048 1.16655 48.7593 1.16655Z" fill="#011627" />
                  <path fillRule="evenodd" clipRule="evenodd" d="M71.6995 7.10121C73.6001 7.10121 75.1031 7.57635 76.2085 8.52663C77.314 9.47693 77.8667 10.8539 77.8667 12.6575V18.0394C77.8668 18.6212 78.1384 18.9121 78.6814 18.9121H79.8449V21.9375H77.4014C76.6838 21.9375 76.0921 21.763 75.6267 21.4139C75.1613 21.0648 74.9285 20.5994 74.9285 20.0176V19.9885H74.3758C74.2982 20.2212 74.1237 20.5315 73.8522 20.9194C73.5807 21.2879 73.154 21.6175 72.5722 21.9084C71.9904 22.1993 71.1952 22.3448 70.1867 22.3448C69.1589 22.3448 68.2377 22.1703 67.4232 21.8212C66.6087 21.4527 65.9588 20.9291 65.474 20.2504C65.0085 19.5522 64.7758 18.7084 64.7758 17.7193C64.7758 16.7302 65.0086 15.906 65.474 15.2466C65.9588 14.5678 66.6182 14.0635 67.4521 13.7338C68.3055 13.3848 69.2752 13.2102 70.3612 13.2102H74.3177V12.3958C74.3177 11.717 74.1043 11.1642 73.6776 10.7376C73.251 10.2915 72.5722 10.0685 71.6412 10.0685C70.7298 10.0685 70.0511 10.2818 69.605 10.7085C69.159 11.1157 68.8679 11.649 68.7322 12.3084L65.3577 11.1738C65.5904 10.4369 65.959 9.76791 66.4632 9.16673C66.9868 8.54614 67.6752 8.05154 68.5285 7.68306C69.4012 7.29518 70.4583 7.10121 71.6995 7.10121ZM70.6231 15.9448C69.9444 15.9448 69.411 16.0903 69.0232 16.3812C68.6353 16.6721 68.4413 17.0794 68.4413 17.603C68.4413 18.1266 68.645 18.5533 69.0523 18.883C69.4596 19.2127 70.0511 19.3775 70.8268 19.3775C71.8547 19.3775 72.6886 19.0963 73.3286 18.5339C73.9879 17.9521 74.3177 17.1861 74.3177 16.2358V15.9448H70.6231Z" fill="#011627" />
                  <path fillRule="evenodd" clipRule="evenodd" d="M99.8367 7.10121C101.252 7.10121 102.484 7.42126 103.531 8.06126C104.579 8.68185 105.393 9.55453 105.975 10.6793C106.557 11.7848 106.848 13.0745 106.848 14.5485V15.7994H96.3458C96.3846 16.7884 96.7531 17.5934 97.4513 18.214C98.1494 18.8346 99.0028 19.1449 100.011 19.1449C101.039 19.1449 101.796 18.9217 102.28 18.4757C102.765 18.0296 103.134 17.535 103.386 16.992L106.382 18.563C106.111 19.0673 105.713 19.62 105.19 20.2212C104.685 20.803 104.006 21.3072 103.153 21.7338C102.3 22.1411 101.214 22.3448 99.895 22.3448C98.4598 22.3448 97.1895 22.0442 96.0841 21.443C94.998 20.8224 94.1447 19.9593 93.5241 18.8539C92.9229 17.729 92.6222 16.4103 92.6222 14.8976V14.5485C92.6222 13.0358 92.9229 11.7267 93.5241 10.6213C94.1253 9.49643 94.9689 8.63335 96.055 8.03214C97.141 7.41154 98.4016 7.10121 99.8367 7.10121ZM99.8076 10.3011C98.8186 10.3011 98.0331 10.5533 97.4513 11.0575C96.8695 11.5618 96.5107 12.2309 96.3749 13.0648H103.124C103.046 12.2309 102.707 11.5618 102.106 11.0575C101.524 10.5533 100.758 10.3011 99.8076 10.3011Z" fill="#011627" />
                  <path d="M62.5541 21.9375H58.8886V1.57386H62.5541V21.9375Z" fill="#011627" />
                  <path d="M81.2602 7.50852H83.801V3.02841H87.4665V7.50852H91.4229V10.5339H87.4665V18.0394C87.4665 18.6212 87.7381 18.9121 88.2812 18.9121H91.0738V21.9375H87.0012C86.0509 21.9375 85.275 21.6466 84.6737 21.0648C84.0919 20.4636 83.801 19.6684 83.801 18.6793V10.5339H81.2101V7.57386H77.8181V3.02841H81.2602V7.50852Z" fill="#011627" />
                  <rect width="33.0909" height="24" fill="#05C770" />
                  <rect x="2.90906" y="2.90909" width="9.09091" height="9.09091" fill="#011627" />
                  <rect x="2.90918" y="12" width="9.09091" height="9.09091" fill="#013B52" />
                  <rect x="12" y="2.90907" width="9.09091" height="9.09091" fill="#013B52" />
                  <rect x="12" y="12" width="9.09091" height="9.09091" fill="#011627" />
                  <rect x="21.0909" y="2.90907" width="9.09091" height="9.09091" fill="#011627" />
                  <rect x="21.0909" y="12" width="9.09091" height="9.09091" fill="#013B52" />
                  <rect x="9.81812" y="9.81818" width="4.28452" height="4.28452" fill="white" />
                  <rect x="18.9091" y="9.81819" width="4.28452" height="4.28452" fill="white" />
                </svg>
              </div>
              <div className="content-stretch flex gap-[48px] items-center leading-[1.2] relative shrink-0 text-[16px] uppercase">
                <Link href="/" className="font-bold relative shrink-0 text-[#05c770]">
                  Home
                </Link>
                <Link href="/training" className="font-medium relative shrink-0 text-black">
                  Trainings
                </Link>
              </div>
              <div className="content-stretch flex gap-[24px] items-center justify-end relative shrink-0">
                <p
                  className="font-bold leading-[1.2] relative shrink-0 text-[16px] text-black"
                  dir="auto"
                >
                  EN
                </p>
                <Link
                  href="/profile-chat"
                  className="bg-[#05c770] content-stretch flex flex-col items-center justify-center px-[16px] py-[12px] relative shrink-0"
                  data-name="Button"
                >
                  <p className="font-bold leading-[1.2] relative shrink-0 text-[16px] text-white uppercase">
                    Profile
                  </p>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-[1280px] relative shrink-0 w-full">
        <div className="content-stretch flex items-start max-w-[inherit] px-[32px] relative w-full">
          <p className="font-bold leading-[1.2] relative shrink-0 text-[14px] text-black uppercase">
            Home
          </p>
        </div>
      </div>
      <div className="max-w-[1280px] relative shrink-0 w-full flex-1">
        <div className="content-stretch flex gap-[16px] items-start max-w-[inherit] px-[32px] relative w-full flex-wrap lg:flex-nowrap">
          <div className="content-stretch flex flex-[1_0_0] flex-col gap-[16px] items-start min-h-px min-w-px relative w-full lg:min-w-0">
            <div className="bg-[rgba(123,64,90,0.1)] relative shrink-0 w-full">
              <div className="flex flex-col justify-center overflow-clip rounded-[inherit] size-full">
                <div className="content-stretch flex flex-col gap-[8px] items-start justify-center leading-[1.2] p-[16px] relative w-full">
                  <p className="font-bold relative shrink-0 text-[#7b405a] text-[24px]">
                    Suggested Trainings
                  </p>
                </div>
              </div>
              <div
                aria-hidden
                className="absolute border border-[#daacc0] border-solid inset-[-0.5px] pointer-events-none"
              />
            </div>
            {loading ? (
              <div className="content-stretch flex flex-col gap-[8px] items-center justify-center py-8 relative shrink-0 w-full text-[rgba(0,0,0,0.7)]">
                <p className="text-[14px]">Loading your class scenarios…</p>
              </div>
            ) : error ? (
              <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full">
                <p className="text-[14px] text-[#f13704]">{error}</p>
                <p className="text-[12px] text-[rgba(0,0,0,0.7)]">Showing default classes.</p>
              </div>
            ) : null}
            {!loading &&
              classCards.map((card) => (
                <ClassCard key={card.classNumber ?? card.title} {...card} />
              ))}
          </div>
          <div className="content-stretch flex flex-[1_0_0] flex-col gap-[16px] items-start min-h-px min-w-px relative w-full lg:min-w-0">
            <div className="bg-[#04a2f1] relative shrink-0 w-full">
              <Wrapper1>
                <div className="absolute bottom-0 h-[240px] mix-blend-color-burn right-0 w-[600px]">
                  <Image
                    alt=""
                    className="absolute inset-0 max-w-none object-cover opacity-50 pointer-events-none size-full"
                    src="/assets/personal-card-bg.png"
                    width={600}
                    height={240}
                  />
                </div>
                <div className="content-stretch flex flex-col gap-[8px] items-start leading-[1.2] relative shrink-0 text-white w-full">
                  <p className="font-normal relative shrink-0 text-[12px] uppercase">
                    My personal card
                  </p>
                  <p className="font-bold relative shrink-0 text-[24px]">
                    {personalCard.cardName}
                  </p>
                  <p className="font-medium min-w-full relative shrink-0 text-[16px] w-[min-content] whitespace-pre-wrap">
                    {personalCard.description}
                  </p>
                </div>
                <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0">
                  <p className="font-bold leading-[1.2] relative shrink-0 text-[12px] text-white uppercase">
                    Dominant teaching styles
                  </p>
                  <div className="content-stretch flex gap-[4px] items-start relative shrink-0">
                    {personalCard.teachingStyles.map((style) => (
                      <Text2 key={style} text={style} />
                    ))}
                  </div>
                </div>
              </Wrapper1>
              <div
                aria-hidden
                className="absolute border border-[#0074ae] border-solid inset-[-0.5px] pointer-events-none"
              />
            </div>
            <Wrapper additionalClassNames="bg-white">
              <div className="content-stretch flex flex-col gap-[8px] items-start leading-[1.2] relative shrink-0 w-full">
                <p className="font-normal relative shrink-0 text-[12px] text-[rgba(0,0,0,0.7)] uppercase">
                  My stats
                </p>
                <p className="font-bold relative shrink-0 text-[24px] text-black">
                  You&apos;re getting closer to a balance
                </p>
              </div>
              <div className="content-stretch flex gap-[4px] items-start relative shrink-0 w-full flex-wrap">
                {skillMetrics.map((m) => (
                  <div
                    key={m.name}
                    className="flex-[1_0_0] h-[40px] min-w-px relative min-w-[74px]"
                    style={{ backgroundColor: m.color }}
                    title={m.name}
                  />
                ))}
              </div>
            </Wrapper>
            <SkillMetricCards metrics={skillMetrics} />
          </div>
        </div>
      </div>
    </div>
  );
}
