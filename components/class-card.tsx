"use client";

import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";
import type { ClassCardData } from "@/lib/class-cards";
import svgPaths from "@/lib/home-svg-paths";

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
}: ClassCardData) {
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
          <p className="font-extrabold leading-[1.2] not-italic relative shrink-0 text-[16px] text-white uppercase">
            {buttonText}
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
      <Link
        href={href ?? "/course-in-progress"}
        className={clsx("relative shrink-0 w-full z-10", buttonClass)}
      >
        {buttonContent}
      </Link>
    </Wrapper>
  );
}
