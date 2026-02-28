"use client";

import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";
import type { ClassCardData } from "@/lib/class-cards";
import svgPaths from "@/lib/home-svg-paths";
import { useRouter } from "next/navigation";
import { useClassStore } from "@/stores/classStore";
import { useProfileStore } from "@/stores/profileStore";
import { useState } from "react";

function Wrapper1({ children }: React.PropsWithChildren) {
  return (
    <div className="overflow-clip rounded-[inherit] size-full">
      <div className="content-stretch flex flex-col gap-[16px] items-start p-[16px] relative w-full">
        {children}
      </div>
    </div>
  );
}

function Wrapper({
  children,
  additionalClassNames = "",
}: React.PropsWithChildren<{ additionalClassNames?: string }>) {
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

function Text({
  text,
  additionalClassNames = "",
}: {
  text: string;
  additionalClassNames?: string;
}) {
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

export function ClassCard({
  variant,
  classNumber,
  badgeLabel,
  title,
  titleColor,
  subtitle,
  difficultyTags,
  skillsTags,
  durationTag,
  buttonText,
  buttonClass,
  showDecorativeStar,
  href,
  challenge,
}: ClassCardData) {
  const router = useRouter();
  const { initializeClass, sessions } = useClassStore();
  const { teacherProfile } = useProfileStore();
  const [isLoading, setIsLoading] = useState(false);

  // Check if session exists
  const existingSessionId = challenge?.id;
  const isResumable = existingSessionId && sessions[existingSessionId];

  const handleStartClass = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (!challenge) {
      if (href) router.push(href);
      return;
    }

    if (isResumable) {
        router.push(`/course-in-progress/${existingSessionId}`);
        return;
    }

    // 1. Generate Personas if needed (simplified inline logic)
    setIsLoading(true);
    try {
      // Reuse the logic from test-room/page.tsx or call an API
      // For now, we'll assume we need to fetch them
      const identity = teacherProfile?.teacher_profile?.identity;
      const teacherIdentity = identity
        ? { subjects_taught: identity.subjects_taught ?? [], grade_levels: identity.grade_levels ?? [] }
        : { subjects_taught: [], grade_levels: [] };

      const lessonTopicObj = challenge.lesson_topic;
      const lessonTopic = lessonTopicObj
        ? { subject: lessonTopicObj.subject ?? "math", grade_level: lessonTopicObj.grade_level ?? "9th" }
        : { subject: "math", grade_level: "9th" };

      const rawConstraints = lessonTopicObj?.persona_generation_constraints
        ?? { num_students_needed: 5, student_archetypes_needed: [{ type: "mixed", count: 5 }] };
      
      const personaGenerationConstraints = {
        ...rawConstraints,
        num_students_needed: Math.min(rawConstraints.num_students_needed, 8),
      };

      const res = await fetch("/api/personas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacher_identity: teacherIdentity,
          persona_generation_constraints: personaGenerationConstraints,
          lesson_topic: lessonTopic,
        }),
      });

      if (!res.ok) throw new Error("Failed to generate personas");
      const { personas } = await res.json();

      // 2. Build Class State
      const students: Record<string, any> = {};
      const allAvatars = ['amara', 'bence', 'mate', 'sofia'];
      let availableAvatars = [...allAvatars];

      personas.forEach((persona: any, index: number) => {
          const safeName = persona.identity.name.toLowerCase().replace(/\s+/g, '_');
          const id = `${safeName}_${index}`;
          
          if (availableAvatars.length === 0) availableAvatars = [...allAvatars];
          const randomIndex = Math.floor(Math.random() * availableAvatars.length);
          const avatarId = availableAvatars.splice(randomIndex, 1)[0];
          
          students[id] = {
              persona,
              avatarId,
              state: {
                  attention: 75,
                  understanding: 50,
                  status: 'listening',
                  memory: [],
                  pending_question: null,
                  last_interacted_round: 0,
                  mood: persona.initial_state.mood_label,
                  energy: persona.initial_state.energy
              }
          };
      });

      const topic = lessonTopicObj?.topic 
        ? `${lessonTopicObj.subject}: ${lessonTopicObj.topic}`
        : "General Lesson";

      const classState = {
          session_id: challenge.id || `session_${Date.now()}`,
          round_num: 0,
          topic,
          class_log: [],
          hand_queue: [],
          time_since_question: 0,
          students
      };

      // 3. Initialize Store & Redirect
      initializeClass(classState as any);
      router.push(`/course-in-progress/${classState.session_id}`);

    } catch (err) {
      console.error("Failed to start class:", err);
      // Fallback
      if (href) router.push(href);
    } finally {
        setIsLoading(false);
    }
  };

  const wrapperClass =
    variant === "featured" ? "bg-[#011627]" : "bg-white";
  const labelColorClass =
    variant === "featured"
      ? "text-[rgba(255,255,255,0.7)]"
      : "text-[rgba(0,0,0,0.7)]";
  const titleColorClass =
    variant === "featured" ? "text-white" : undefined;
  const titleStyle = titleColor ? { color: titleColor } : undefined;

  const buttonContent = (
    <div className="relative shrink-0 w-full">
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex gap-[10px] items-center justify-center px-[16px] py-[12px] relative w-full">
          {isLoading ? (
             <div className="size-[20px] border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <div
                className="overflow-clip relative shrink-0 size-[20px]"
                data-name="player-play-filled"
            >
                <div
                className="absolute bottom-[12.5%] left-1/4 right-[12.5%] top-[12.5%]"
                data-name="Vector"
                >
                <svg
                    className="absolute block size-full"
                    fill="none"
                    preserveAspectRatio="none"
                    viewBox="0 0 12.5004 15.0005"
                >
                    <path
                    d={svgPaths.p3fcfd780}
                    fill="var(--fill-0, white)"
                    id="Vector"
                    />
                </svg>
                </div>
            </div>
          )}
          <p className="font-extrabold leading-[1.2] not-italic relative shrink-0 text-[16px] text-white uppercase">
            {isLoading ? "Generating..." : (isResumable ? "Resume Class" : buttonText)}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <Wrapper additionalClassNames={wrapperClass}>
      {variant === "featured" && badgeLabel && (
        <div className="content-stretch flex h-[24px] items-center justify-center relative shrink-0 z-10">
          <svg
            width="60"
            height="24"
            viewBox="0 0 60 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="block shrink-0"
            aria-hidden
          >
            <rect width="33.0909" height="24" fill="#F1B903" />
            <rect x="2.90894" y="2.9091" width="9.09091" height="9.09091" fill="#011627" />
            <rect x="2.90918" y="12" width="9.09091" height="9.09091" fill="#013B52" />
            <rect x="12" y="2.909" width="9.09091" height="9.09091" fill="#013B52" />
            <rect x="12" y="12" width="9.09091" height="9.09091" fill="#011627" />
            <rect x="21.0909" y="2.909" width="9.09091" height="9.09091" fill="#011627" />
            <rect x="21.0909" y="12" width="9.09091" height="9.09091" fill="#013B52" />
            <rect x="9.81812" y="9.81821" width="4.28452" height="4.28452" fill="white" />
            <rect x="18.9089" y="9.81824" width="4.28452" height="4.28452" fill="white" />
            <path d="M37.5949 20.5L42.3949 3.7H46.9549L51.7309 20.5H49.0669L47.9629 16.54H41.3869L40.2829 20.5H37.5949ZM42.0349 14.14H47.3149L44.8669 5.308H44.4829L42.0349 14.14ZM54.007 20.5V3.7H56.599V20.5H54.007Z" fill="white" />
          </svg>
        </div>
      )}
      <div className="content-stretch flex flex-col gap-[8px] items-start leading-[1.2] relative shrink-0 w-full z-10">
        <p className={clsx("font-normal relative shrink-0 text-[12px] uppercase", labelColorClass)}>
          {variant === "featured"
            ? badgeLabel
            : `Class no ${classNumber}: `}
        </p>
        <p
          className={clsx(
            "font-bold relative shrink-0 text-[24px]",
            titleColorClass
          )}
          style={titleStyle}
        >
          {title}
        </p>
        <p
          className={clsx(
            "font-medium min-w-full relative shrink-0 text-[14px] w-[min-content] whitespace-pre-wrap",
            variant === "featured" ? "text-white" : "text-black"
          )}
        >
          {subtitle}
        </p>
      </div>
      <div className="content-stretch flex gap-[16px] items-start relative shrink-0 flex-wrap z-10">
        <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0">
          <p className={clsx("font-normal leading-[1.2] relative shrink-0 text-[12px] uppercase", labelColorClass)}>
            Difficulty
          </p>
          <div className="content-stretch flex gap-[4px] items-start relative shrink-0">
            {difficultyTags.map((tag) => (
              <Text key={tag.text} text={tag.text} additionalClassNames={tag.tagClass} />
            ))}
          </div>
        </div>
        <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0">
          <p className={clsx("font-normal leading-[1.2] relative shrink-0 text-[12px] uppercase", labelColorClass)}>
            Skills
          </p>
          <div className="content-stretch flex gap-[4px] items-start relative shrink-0">
            {skillsTags.map((tag) => (
              <Text key={tag.text} text={tag.text} additionalClassNames={tag.tagClass} />
            ))}
          </div>
        </div>
        <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0">
          <p className={clsx("font-normal leading-[1.2] relative shrink-0 text-[12px] uppercase", labelColorClass)}>
            Duration
          </p>
          <div className="content-stretch flex items-start relative shrink-0">
            <Text text={durationTag.text} additionalClassNames={durationTag.tagClass} />
          </div>
        </div>
      </div>
      {showDecorativeStar && (
        <div className="absolute right-0 top-0 size-[100px] z-0">
          <Image
            alt=""
            className="object-cover pointer-events-none size-full"
            src="/assets/adaptive-class-star.png"
            width={100}
            height={100}
          />
        </div>
      )}
      <button
        type="button"
        className={clsx("relative shrink-0 w-full z-10 block", buttonClass)}
        onClick={handleStartClass}
      >
        {buttonContent}
      </button>
    </Wrapper>
  );
}
