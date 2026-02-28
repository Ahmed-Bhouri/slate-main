"use client";

import NextImage from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import clsx from "clsx";
import { useProfileStore } from "@/stores/profileStore";

import svgPaths from "@/lib/course-in-progress-svg-paths";

const ASSETS = "/assets/course-in-progress";

/** One possible emotion state for a persona, with the avatar image to show for that state. */
export type EmotionOption = {
  emotion: string;
  image: string;
};

type Persona = {
  name: string;
  emotion: string;
  action: string;
  /** Available emotion states and the avatar image to render for each (e.g. neutral, happy). Use first entry as current; later you can add currentEmotionIndex or currentEmotion key to pick one. */
  possibleEmotions: Record<string, string>;
  /** "positive" = green frame; otherwise use sidebarFrameBg + this as border color (e.g. #f16e04). */
  sidebarFrameVariant: "positive" | string;
  /** rgba() for non-positive sidebar frame background, e.g. "rgba(241,110,4,0.2)". */
  sidebarFrameBg?: string;
  /** Tailwind/bracket color for emotion tag, e.g. "bg-[#f16e04]" */
  emotionTagClass: string;
  /** Tailwind/bracket color for action tag */
  actionTagClass: string;
  /** Show the "flag for attention" arrow in the sidebar list (e.g. needs intervention) */
  showAttentionArrow?: boolean;
  /** Optional classroom layout; when set, this persona is rendered on the classroom grid */
  classroom?: {
    containerLeft: string;
    containerTop: string;
    avatarLeft: string;
    avatarTop: string;
    avatarSize: string;
    labelLeft: string;
    labelTop: string;
    deskType: "school" | "student";
    deskLeft: string;
    deskTop: string;
    showFatigueBadge?: boolean;
  };
};

const PERSONAS: Persona[] = [
  {
    name: "Steven",
    emotion: "neutral",
    action: "Confusion",
    possibleEmotions: { neutral: "avatar1.png" },
    sidebarFrameVariant: "#f16e04",
    sidebarFrameBg: "rgba(241,110,4,0.2)",
    emotionTagClass: "bg-[#f16e04]",
    actionTagClass: "bg-[#f1b903]",
    classroom: {
      containerLeft: "624px",
      containerTop: "104.5px",
      avatarLeft: "649px",
      avatarTop: "153px",
      avatarSize: "size-[99px]",
      labelLeft: "672px",
      labelTop: "104.5px",
      deskType: "student",
      deskLeft: "624px",
      deskTop: "216px",
      showFatigueBadge: true,
    },
    showAttentionArrow: true,
  },
  {
    name: "Emma",
    emotion: "neutral",
    action: "Short attention span",
    possibleEmotions: { neutral: "avatar2.png" },
    sidebarFrameVariant: "#04a2f1",
    sidebarFrameBg: "rgba(4,162,241,0.2)",
    emotionTagClass: "bg-[#04a2f1]",
    actionTagClass: "bg-[#f1b903]",
    classroom: {
      containerLeft: "70px",
      containerTop: "211.5px",
      avatarLeft: "105px",
      avatarTop: "237px",
      avatarSize: "size-[99px]",
      labelLeft: "155px",
      labelTop: "211.5px",
      deskType: "school",
      deskLeft: "70px",
      deskTop: "287px",
    },
  },
  {
    name: "Bence",
    emotion: "neutral",
    action: "Proactive",
    possibleEmotions: { neutral: "avatar3.png" },
    sidebarFrameVariant: "positive",
    emotionTagClass: "bg-[#05c770]",
    actionTagClass: "bg-[#05c770]",
    classroom: {
      containerLeft: "438px",
      containerTop: "197px",
      avatarLeft: "473px",
      avatarTop: "217.5px",
      avatarSize: "size-[99px]",
      labelLeft: "523.5px",
      labelTop: "197px",
      deskType: "school",
      deskLeft: "438px",
      deskTop: "263.5px",
    },
  },
  {
    name: "Anna",
    emotion: "neutral",
    action: "Proactive",
    possibleEmotions: { neutral:  "avatar4.png" } ,
    sidebarFrameVariant: "positive",
    emotionTagClass: "bg-[#05c770]",
    actionTagClass: "bg-[#05c770]",
    classroom: {
      containerLeft: "254px",
      containerTop: "133px",
      avatarLeft: "279px",
      avatarTop: "155.5px",
      avatarSize: "size-[99px]",
      labelLeft: "329px",
      labelTop: "133px",
      deskType: "student",
      deskLeft: "254px",
      deskTop: "209.5px",
    },
  },
];

function AttendeeAvatarFrame({ children }: React.PropsWithChildren) {
  return (
    <div className="bg-[rgba(5,199,112,0.2)] relative shrink-0 size-[48px]">
      <div className="overflow-clip relative rounded-[inherit] size-full">
        {children}
      </div>
      <div
        aria-hidden
        className="absolute border-[#05c770] border-[0.75px] border-solid inset-0 pointer-events-none"
      />
    </div>
  );
}

function CourseInfoCard({ children }: React.PropsWithChildren) {
  return (
    <div className="bg-white relative shrink-0 w-full">
      <div className="overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex flex-col gap-[16px] items-start p-[16px] relative w-full">
          {children}
        </div>
      </div>
      <div
        aria-hidden
        className="absolute border border-[#d6d6d6] border-solid inset-[-0.5px] pointer-events-none"
      />
    </div>
  );
}

type StudentDeskImageProps = { additionalClassNames?: string; style?: React.CSSProperties };

function StudentDeskImage({
  additionalClassNames = "",
  style,
}: StudentDeskImageProps) {
  return (
    <div className={clsx("absolute size-[152px]", additionalClassNames)} style={style}>
      <NextImage
        alt=""
        className="absolute inset-0 max-w-none object-cover pointer-events-none size-full"
        src={`${ASSETS}/student-desk.png`}
        width={152}
        height={152}
      />
    </div>
  );
}

type SchoolDeskImageProps = { additionalClassNames?: string; style?: React.CSSProperties };

function SchoolDeskImage({
  additionalClassNames = "",
  style,
}: SchoolDeskImageProps) {
  return (
    <div className={clsx("absolute size-[169px]", additionalClassNames)} style={style}>
      <NextImage
        alt=""
        className="absolute inset-0 max-w-none object-cover pointer-events-none size-full"
        src={`${ASSETS}/school-desk.png`}
        width={169}
        height={169}
      />
    </div>
  );
}

function ClassroomGridRowOffset() {
  return (
    <div className="content-stretch flex h-[60px] items-center relative shrink-0 w-full">
      <ClassroomGridTileSecondary />
      <ClassroomGridTilePrimary />
      <ClassroomGridTileSecondary />
      <ClassroomGridTilePrimary />
      <ClassroomGridTileSecondary />
      <ClassroomGridTilePrimary />
      <ClassroomGridTileSecondary />
      <ClassroomGridTilePrimary />
      <ClassroomGridTileSecondary />
      <ClassroomGridTilePrimary />
      <ClassroomGridTileSecondary />
      <ClassroomGridTilePrimary />
      <ClassroomGridTileSecondary />
      <ClassroomGridTilePrimary />
    </div>
  );
}

function ClassroomGridTileSecondary() {
  return (
    <div className="relative shrink-0 size-[60px]">
      <NextImage
        alt=""
        className="absolute inset-0 max-w-none object-cover pointer-events-none size-full"
        src={`${ASSETS}/rectangle2.png`}
        width={60}
        height={60}
      />
    </div>
  );
}

function ClassroomGridTilePrimary() {
  return (
    <div className="relative shrink-0 size-[60px]">
      <NextImage
        alt=""
        className="absolute inset-0 max-w-none object-cover pointer-events-none size-full"
        src={`${ASSETS}/rectangle1.png`}
        width={60}
        height={60}
      />
    </div>
  );
}

type ClassroomGridRowProps = { additionalClassNames?: string };

function ClassroomGridRow({ additionalClassNames = "" }: ClassroomGridRowProps) {
  return (
    <div
      className={clsx(
        "content-stretch flex items-center relative shrink-0 w-full",
        additionalClassNames
      )}
    >
      <ClassroomGridTilePrimary />
      <ClassroomGridTileSecondary />
      <ClassroomGridTilePrimary />
      <ClassroomGridTileSecondary />
      <ClassroomGridTilePrimary />
      <ClassroomGridTileSecondary />
      <ClassroomGridTilePrimary />
      <ClassroomGridTileSecondary />
      <ClassroomGridTilePrimary />
      <ClassroomGridTileSecondary />
      <ClassroomGridTilePrimary />
      <ClassroomGridTileSecondary />
      <ClassroomGridTilePrimary />
      <ClassroomGridTileSecondary />
    </div>
  );
}

type StudentAvatarProps = {
  /** Avatar image filename (e.g. from persona.possibleEmotions[current].image). */
  image: string;
  /** Accessible label, e.g. persona name. */
  alt?: string;
  additionalClassNames?: string;
  style?: React.CSSProperties;
};

function StudentAvatar({ image, alt = "", additionalClassNames = "", style }: StudentAvatarProps) {
  return (
    <div className={clsx("absolute", additionalClassNames)} style={style}>
      <NextImage
        alt={alt}
        className="absolute inset-0 max-w-none object-cover pointer-events-none size-full"
        src={`${ASSETS}/${image}`}
        width={99}
        height={99}
      />
    </div>
  );
}

type GoalProgressSegmentProps = { additionalClassNames?: string };

function GoalProgressSegment({ additionalClassNames = "" }: GoalProgressSegmentProps) {
  return (
    <div
      className={clsx(
        "flex-[1_0_0] h-[10px] min-h-px min-w-px relative",
        additionalClassNames
      )}
    >
      <div className="flex flex-row items-center justify-center size-full">
        <div className="size-full" />
      </div>
    </div>
  );
}

type StatusTagProps = { text: string; additionalClassNames?: string };

function StatusTag({ text, additionalClassNames = "" }: StatusTagProps) {
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

function NavLogo() {
  return (
    <svg
      width="107"
      height="24"
      viewBox="0 0 107 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="block shrink-0"
      aria-hidden
    >
      <path
        d="M48.7593 1.16655C50.2138 1.16656 51.5035 1.41873 52.6283 1.92294C53.7725 2.40779 54.6648 3.14479 55.3048 4.13388C55.9642 5.10357 56.2938 6.32543 56.2938 7.79936V8.67205H52.512V7.79936C52.512 7.02361 52.3569 6.40295 52.0466 5.9375C51.7557 5.45267 51.329 5.10361 50.7666 4.89027C50.2042 4.65755 49.5351 4.5412 48.7593 4.54119C47.5957 4.54119 46.7326 4.76418 46.1702 5.21023C45.6272 5.6369 45.3556 6.22854 45.3556 6.98491C45.3556 7.48907 45.4817 7.91568 45.7338 8.26474C46.0053 8.61383 46.4029 8.90488 46.9266 9.13761C47.4502 9.37032 48.1193 9.57386 48.9339 9.7484L49.6029 9.894C51.0574 10.2043 52.318 10.6018 53.3847 11.0866C54.4707 11.5715 55.3144 12.2115 55.9156 13.0066C56.5168 13.8017 56.909 14.8929 56.909 16.1341C56.909 17.3753 56.4975 18.3983 55.8575 19.3485C55.2369 20.2794 54.3446 21.0163 53.181 21.5593C52.0368 22.0829 50.6793 22.3448 49.1084 22.3448C47.5375 22.3448 46.1508 22.0636 44.9484 21.5012C43.746 20.9388 42.8053 20.1339 42.1265 19.0866C41.4477 18.0394 41.1084 16.7788 41.1084 15.3049V14.4902H44.8902V15.3049C44.8902 16.5267 45.2684 17.4479 46.0248 18.0685C46.7811 18.6697 47.809 18.9703 49.1084 18.9703C50.4272 18.9703 51.4066 18.7085 52.0466 18.1848C52.706 17.6612 53.0356 16.9921 53.0356 16.1776C53.0356 15.6151 52.8708 15.1593 52.5411 14.8102C52.2308 14.4611 51.7654 14.1799 51.1448 13.9666C50.5436 13.7339 49.8066 13.5206 48.9339 13.3267L48.2646 13.1811C46.8683 12.8708 45.6659 12.483 44.6574 12.0176C43.6683 11.5327 42.9023 10.9024 42.3593 10.1266C41.8357 9.35085 41.5738 8.3424 41.5738 7.10121C41.5738 5.86 41.8646 4.80295 42.4465 3.93022C43.0477 3.0381 43.8818 2.35945 44.9484 1.894C46.0345 1.40916 47.3048 1.16655 48.7593 1.16655Z"
        fill="#011627"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M71.6995 7.10121C73.6001 7.10121 75.1031 7.57635 76.2085 8.52663C77.314 9.47693 77.8667 10.8539 77.8667 12.6575V18.0394C77.8668 18.6212 78.1384 18.9121 78.6814 18.9121H79.8449V21.9375H77.4014C76.6838 21.9375 76.0921 21.763 75.6267 21.4139C75.1613 21.0648 74.9285 20.5994 74.9285 20.0176V19.9885H74.3758C74.2982 20.2212 74.1237 20.5315 73.8522 20.9194C73.5807 21.2879 73.154 21.6175 72.5722 21.9084C71.9904 22.1993 71.1952 22.3448 70.1867 22.3448C69.1589 22.3448 68.2377 22.1703 67.4232 21.8212C66.6087 21.4527 65.9588 20.9291 65.474 20.2504C65.0085 19.5522 64.7758 18.7084 64.7758 17.7193C64.7758 16.7302 65.0086 15.906 65.474 15.2466C65.9588 14.5678 66.6182 14.0635 67.4521 13.7338C68.3055 13.3848 69.2752 13.2102 70.3612 13.2102H74.3177V12.3958C74.3177 11.717 74.1043 11.1642 73.6776 10.7376C73.251 10.2915 72.5722 10.0685 71.6412 10.0685C70.7298 10.0685 70.0511 10.2818 69.605 10.7085C69.159 11.1157 68.8679 11.649 68.7322 12.3084L65.3577 11.1738C65.5904 10.4369 65.959 9.76791 66.4632 9.16673C66.9868 8.54614 67.6752 8.05154 68.5285 7.68306C69.4012 7.29518 70.4583 7.10121 71.6995 7.10121ZM70.6231 15.9448C69.9444 15.9448 69.411 16.0903 69.0232 16.3812C68.6353 16.6721 68.4413 17.0794 68.4413 17.603C68.4413 18.1266 68.645 18.5533 69.0523 18.883C69.4596 19.2127 70.0511 19.3775 70.8268 19.3775C71.8547 19.3775 72.6886 19.0963 73.3286 18.5339C73.9879 17.9521 74.3177 17.1861 74.3177 16.2358V15.9448H70.6231Z"
        fill="#011627"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M99.8367 7.10121C101.252 7.10121 102.484 7.42126 103.531 8.06126C104.579 8.68185 105.393 9.55453 105.975 10.6793C106.557 11.7848 106.848 13.0745 106.848 14.5485V15.7994H96.3458C96.3846 16.7884 96.7531 17.5934 97.4513 18.214C98.1494 18.8346 99.0028 19.1449 100.011 19.1449C101.039 19.1449 101.796 18.9217 102.28 18.4757C102.765 18.0296 103.134 17.535 103.386 16.992L106.382 18.563C106.111 19.0673 105.713 19.62 105.19 20.2212C104.685 20.803 104.006 21.3072 103.153 21.7338C102.3 22.1411 101.214 22.3448 99.895 22.3448C98.4598 22.3448 97.1895 22.0442 96.0841 21.443C94.998 20.8224 94.1447 19.9593 93.5241 18.8539C92.9229 17.729 92.6222 16.4103 92.6222 14.8976V14.5485C92.6222 13.0358 92.9229 11.7267 93.5241 10.6213C94.1253 9.49643 94.9689 8.63335 96.055 8.03214C97.141 7.41154 98.4016 7.10121 99.8367 7.10121ZM99.8076 10.3011C98.8186 10.3011 98.0331 10.5533 97.4513 11.0575C96.8695 11.5618 96.5107 12.2309 96.3749 13.0648H103.124C103.046 12.2309 102.707 11.5618 102.106 11.0575C101.524 10.5533 100.758 10.3011 99.8076 10.3011Z"
        fill="#011627"
      />
      <path
        d="M62.5541 21.9375H58.8886V1.57386H62.5541V21.9375Z"
        fill="#011627"
      />
      <path
        d="M81.2602 7.50852H83.801V3.02841H87.4665V7.50852H91.4229V10.5339H87.4665V18.0394C87.4665 18.6212 87.7381 18.9121 88.2812 18.9121H91.0738V21.9375H87.0012C86.0509 21.9375 85.275 21.6466 84.6737 21.0648C84.0919 20.4636 83.801 19.6684 83.801 18.6793V10.5339H81.2101V7.57386H77.8181V3.02841H81.2602V7.50852Z"
        fill="#011627"
      />
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
  );
}

export default function CourseInProgressPage() {
  const router = useRouter();
  const { teacherProfile, hasHydrated } = useProfileStore();

  useEffect(() => {
    if (!hasHydrated) return;
    if (!teacherProfile) {
      router.replace("/profile-chat");
    }
  }, [hasHydrated, teacherProfile, router]);

  return (
    <div
      className="bg-white content-stretch flex flex-col gap-[12px] items-center pb-[80px] relative size-full min-h-screen"
      data-name="Course in progress"
    >
      <div
        className="content-stretch flex items-center justify-center overflow-clip px-[48px] py-[24px] relative shrink-0 w-full max-w-[1512px]"
        data-name="navbar"
      >
        <div className="flex-[1_0_0] max-w-[1280px] min-h-px min-w-px relative w-full">
          <div className="flex flex-row items-center max-w-[inherit] size-full">
            <div className="content-stretch flex items-center justify-between max-w-[inherit] px-[32px] relative w-full flex-wrap gap-4">
              <Link href="/" className="content-stretch flex items-center relative shrink-0 min-w-0">
                <NavLogo />
              </Link>
              <nav className="content-stretch flex font-medium gap-[48px] items-center leading-[1.2] relative shrink-0 text-[16px] text-black uppercase">
                <Link href="/" className="relative shrink-0">
                  Home
                </Link>
                <Link href="/training" className="relative shrink-0">
                  Trainings
                </Link>
                <Link href="/report" className="relative shrink-0">
                  Report
                </Link>
              </nav>
              <div className="content-stretch flex gap-[24px] items-center justify-end relative shrink-0">
                <p className="font-bold leading-[1.2] relative shrink-0 text-[16px] text-black" dir="auto">
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
          <p className="font-normal leading-[0] relative shrink-0 text-[0px] text-[14px] text-black uppercase">
            <span className="leading-[1.2]">{`MY LEARNING > TRAININGS > SKILL GAPS > `}</span>
            <span className="font-bold leading-[1.2]">CLASS NO 3</span>
          </p>
        </div>
      </div>
      <div className="flex-[1_0_0] max-w-[1280px] min-h-px min-w-px relative w-full">
        <div className="flex flex-row justify-center max-w-[inherit] size-full">
          <div className="content-stretch flex gap-[21px] items-start justify-center max-w-[inherit] px-[32px] relative size-full flex-wrap lg:flex-nowrap">
            <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] h-full items-start min-h-px min-w-px relative w-full lg:min-w-0">
              <CourseInfoCard>
                <div className="content-stretch flex flex-col gap-[8px] items-start leading-[1.2] relative shrink-0">
                  <p className="font-normal relative shrink-0 text-[12px] text-[rgba(0,0,0,0.7)] uppercase">
                    Class no 3:{" "}
                  </p>
                  <p className="font-bold relative shrink-0 text-[#01a65c] text-[24px]">
                    Calculus - Intermediate
                  </p>
                  <p className="font-medium min-w-full relative shrink-0 text-[14px] text-black w-[min-content] whitespace-pre-wrap">
                    Calculate the slope of a linear function
                  </p>
                </div>
                <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0">
                  <p className="font-normal leading-[1.2] relative shrink-0 text-[12px] text-[rgba(0,0,0,0.7)] uppercase">
                    Difficulty
                  </p>
                  <div className="content-stretch flex gap-[4px] items-start relative shrink-0">
                    <StatusTag text="Huge skill gaps" additionalClassNames="bg-[#f13704]" />
                    <StatusTag text="Medium topic" additionalClassNames="bg-[#f1b903]" />
                  </div>
                </div>
                <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0">
                  <p className="font-normal leading-[1.2] relative shrink-0 text-[12px] text-[rgba(0,0,0,0.7)] uppercase">
                    Skills
                  </p>
                  <div className="content-stretch flex gap-[4px] items-start relative shrink-0">
                    <StatusTag text="Adaptability" additionalClassNames="bg-[#031bf1]" />
                    <StatusTag text="Clarity" additionalClassNames="bg-[#f1044f]" />
                  </div>
                </div>
                <div className="relative shrink-0 w-full" data-name="Button">
                  <div
                    aria-hidden
                    className="absolute border border-[#f13704] border-solid inset-0 pointer-events-none"
                  />
                  <div className="flex flex-row items-center justify-center size-full">
                    <div className="content-stretch flex gap-[10px] items-center justify-center px-[16px] py-[12px] relative w-full">
                      <div
                        className="overflow-clip relative shrink-0 size-[20px]"
                        data-name="player-stop-filled"
                      >
                        <div className="absolute inset-[16.67%]" data-name="Vector">
                          <svg
                            className="absolute block size-full"
                            fill="none"
                            preserveAspectRatio="none"
                            viewBox="0 0 13.3333 13.3333"
                          >
                            <path
                              d={svgPaths.p3968aa00}
                              fill="var(--fill-0, #F13704)"
                              id="Vector"
                            />
                          </svg>
                        </div>
                      </div>
                      <p className="font-extrabold leading-[1.2] not-italic relative shrink-0 text-[#f13704] text-[16px] uppercase">
                        Stop class
                      </p>
                    </div>
                  </div>
                </div>
              </CourseInfoCard>
              <CourseInfoCard>
                <div className="content-stretch flex flex-col gap-[8px] items-start leading-[1.2] relative shrink-0 w-full">
                  <p className="font-normal relative shrink-0 text-[12px] text-[rgba(0,0,0,0.7)] uppercase">
                    Goal
                  </p>
                  <p className="font-bold min-w-full relative shrink-0 text-[16px] text-black w-[min-content] whitespace-pre-wrap">
                    Every student should be flagged with a green color by the end
                    of the class (2/4)
                  </p>
                </div>
                <div className="content-stretch flex gap-[4px] items-start relative shrink-0 w-full">
                  <GoalProgressSegment additionalClassNames="bg-[#f16e04]" />
                  <GoalProgressSegment additionalClassNames="bg-[#04a2f1]" />
                  <GoalProgressSegment additionalClassNames="bg-[#05c770]" />
                  <GoalProgressSegment additionalClassNames="bg-[#05c770]" />
                </div>
              </CourseInfoCard>
              <CourseInfoCard>
                <div className="content-stretch flex flex-col gap-[4px] items-start leading-[1.2] relative shrink-0 text-right">
                  <p className="font-medium relative shrink-0 text-[16px] text-black uppercase">
                    Attendees
                  </p>
                  <p className="font-normal relative shrink-0 text-[12px] text-[rgba(0,0,0,0.7)]">
                    View and monitor current attendees
                  </p>
                </div>
                {PERSONAS.map((persona) => (
                  <div
                    key={persona.name}
                    className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full"
                  >
                    {persona.sidebarFrameVariant === "positive" ? (
                      <AttendeeAvatarFrame>
                        <StudentAvatar
                          image={persona.possibleEmotions[`${persona.emotion.toLowerCase()}`]}
                          alt={persona.name}
                          additionalClassNames="left-0 size-[47.52px] top-[0.24px]"
                        />
                      </AttendeeAvatarFrame>
                    ) : (
                      <div
                        className="relative shrink-0 size-[48px]"
                        style={{
                          backgroundColor: persona.sidebarFrameBg,
                        }}
                      >
                        <div className="overflow-clip relative rounded-[inherit] size-full">
                          <StudentAvatar
                            image={persona.possibleEmotions[`${persona.emotion.toLowerCase()}`]}
                            alt={persona.name}
                            additionalClassNames="left-0 size-[47.52px] top-[0.24px]"
                          />
                        </div>
                        <div
                          aria-hidden
                          className="absolute border-[0.75px] border-solid inset-0 pointer-events-none"
                          style={{
                            borderColor: persona.sidebarFrameVariant,
                          }}
                        />
                      </div>
                    )}
                    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-start justify-center min-h-px min-w-px relative">
                      <p className="font-medium leading-[1.2] relative shrink-0 text-[16px] text-black">
                        {persona.name}
                      </p>
                      <div className="content-stretch flex gap-[4px] items-start relative shrink-0">
                        <StatusTag
                          text={persona.emotion}
                          additionalClassNames={persona.emotionTagClass}
                        />
                        <StatusTag
                          text={persona.action}
                          additionalClassNames={persona.actionTagClass}
                        />
                      </div>
                    </div>
                    {persona.showAttentionArrow && (
                      <div
                        className="overflow-clip relative shrink-0 size-[24px]"
                        data-name="arrow-big-up-lines-filled"
                      >
                        <div
                          className="absolute inset-[10.06%_14.23%_8.33%_14.22%]"
                          data-name="Vector"
                        >
                          <svg
                            className="absolute block size-full"
                            fill="none"
                            preserveAspectRatio="none"
                            viewBox="0 0 17.1718 19.5856"
                          >
                            <g id="Vector">
                              <path
                                d={svgPaths.p2e096400}
                                fill="var(--fill-0, #F13704)"
                              />
                              <path
                                d={svgPaths.p289ac6f0}
                                fill="var(--fill-0, #F13704)"
                              />
                              <path
                                d={svgPaths.p35ca1480}
                                fill="var(--fill-0, #F13704)"
                              />
                              <path
                                d={svgPaths.p2e096400}
                                stroke="var(--stroke-0, #F13704)"
                              />
                              <path
                                d={svgPaths.p289ac6f0}
                                stroke="var(--stroke-0, #F13704)"
                              />
                              <path
                                d={svgPaths.p35ca1480}
                                stroke="var(--stroke-0, #F13704)"
                              />
                            </g>
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </CourseInfoCard>
            </div>
            <div className="h-[720px] relative shrink-0 w-full min-w-0 lg:w-[840px] lg:min-h-[720px]">
              <div className="overflow-clip relative rounded-[inherit] size-full min-h-[500px] lg:min-h-[720px]">
                <div
                  className="-translate-x-1/2 -translate-y-1/2 absolute content-stretch flex flex-col items-start left-1/2 overflow-clip top-1/2 w-full max-w-[840px]"
                  data-name="gird"
                >
                  <ClassroomGridRow additionalClassNames="h-[60px]" />
                  <ClassroomGridRowOffset />
                  <ClassroomGridRow additionalClassNames="h-[60px]" />
                  <ClassroomGridRowOffset />
                  <ClassroomGridRow additionalClassNames="h-[60px]" />
                  <ClassroomGridRowOffset />
                  <ClassroomGridRow additionalClassNames="h-[60px]" />
                  <ClassroomGridRowOffset />
                  <ClassroomGridRow additionalClassNames="h-[60px]" />
                  <ClassroomGridRowOffset />
                  <ClassroomGridRow additionalClassNames="h-[61px]" />
                  <ClassroomGridRowOffset />
                </div>
                {PERSONAS.filter((p) => p.classroom).map((persona) => {
                const c = persona.classroom!;
                const isCenterLabel = persona.name === "Emma" || persona.name === "Bence";
                const DeskComponent = c.deskType === "school" ? SchoolDeskImage : StudentDeskImage;
                return (
                  <div
                    key={persona.name}
                    className="absolute contents"
                    style={{ left: c.containerLeft, top: c.containerTop }}
                  >
                    <StudentAvatar
                      image={persona.possibleEmotions[`${persona.emotion.toLowerCase()}`]}
                      alt={persona.name}
                      additionalClassNames={c.avatarSize}
                      style={{ left: c.avatarLeft, top: c.avatarTop }}
                    />
                    {c.showFatigueBadge && (
                      <div className="absolute bg-[#f13704] content-stretch flex gap-[4px] items-center justify-center left-[662px] px-[6px] py-[4px] top-[127px]">
                        <div className="bg-white shrink-0 size-[10px]" />
                        <p className="font-medium leading-[1.2] relative shrink-0 text-[12px] text-center text-white uppercase">
                          Fatigue
                        </p>
                      </div>
                    )}
                    <DeskComponent
                      additionalClassNames=""
                      style={{ left: c.deskLeft, top: c.deskTop }}
                    />
                    <p
                      className={clsx(
                        "absolute font-medium leading-[1.2] text-[16px] text-black",
                        isCenterLabel && "-translate-x-1/2 text-center"
                      )}
                      style={{ left: c.labelLeft, top: c.labelTop }}
                    >
                      {persona.name}
                    </p>
                  </div>
                );
              })}
                <div className="absolute h-[317px] left-[103px] top-[410px] w-[634px] max-w-[calc(100%-206px)]">
                  <div
                    className="-translate-x-1/2 absolute h-[317px] left-1/2 top-0 w-[634px] max-w-full"
                    data-name="Pixel Art School Whiteboard 1"
                  >
                    <NextImage
                      alt=""
                      className="absolute inset-0 max-w-none object-cover pointer-events-none size-full"
                      src={`${ASSETS}/whiteboard.png`}
                      width={634}
                      height={317}
                    />
                  </div>
                  <div className="absolute font-normal leading-[1.6] left-[153.24px] text-[18.716px] text-black top-[102.94px] whitespace-nowrap">
                    <p className="mb-0">{`While this topic hasn't been `}</p>
                    <p className="mb-0">brought to the table so far.</p>
                    <p className="mb-0">We should Aim at executing</p>
                    <p className="mb-0">....</p>
                  </div>
                  <div className="absolute bg-[#f13704] content-stretch flex gap-[4.679px] items-center justify-center left-[153.24px] px-[7.018px] py-[4.679px] top-[56.15px]">
                    <div className="bg-white shrink-0 size-[11.697px]" />
                    <p className="font-medium leading-[1.2] relative shrink-0 text-[14.037px] text-center text-white uppercase">
                      Live session
                    </p>
                  </div>
                </div>
                <div className="absolute bg-white left-[16px] top-[16px] w-[400px] max-w-[calc(100%-32px)]">
                  <div className="content-stretch flex flex-col gap-[8px] items-start overflow-clip p-[8px] relative rounded-[inherit] w-full">
                    <div className="content-stretch flex h-[18px] items-center justify-center relative shrink-0">
                      <svg width="45" height="18" viewBox="0 0 60 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="block shrink-0" aria-hidden preserveAspectRatio="xMidYMid meet">
                        <rect width="33.0909" height="24" fill="#F1B903" />
                        <rect x="2.90894" y="2.9091" width="9.09091" height="9.09091" fill="#011627" />
                        <rect x="2.90918" y="12" width="9.09091" height="9.09091" fill="#013B52" />
                        <rect x="12" y="2.909" width="9.09091" height="9.09091" fill="#013B52" />
                        <rect x="12" y="12" width="9.09091" height="9.09091" fill="#011627" />
                        <rect x="21.0909" y="2.909" width="9.09091" height="9.09091" fill="#011627" />
                        <rect x="21.0909" y="12" width="9.09091" height="9.09091" fill="#013B52" />
                        <rect x="9.81812" y="9.81821" width="4.28452" height="4.28452" fill="white" />
                        <rect x="18.9089" y="9.81824" width="4.28452" height="4.28452" fill="white" />
                        <path d="M37.5949 20.5L42.3949 3.7H46.9549L51.7309 20.5H49.0669L47.9629 16.54H41.3869L40.2829 20.5H37.5949ZM42.0349 14.14H47.3149L44.8669 5.308H44.4829L42.0349 14.14ZM54.007 20.5V3.7H56.599V20.5H54.007Z" fill="black" />
                      </svg>
                    </div>
                    <div className="content-stretch flex flex-col items-start relative shrink-0">
                      <p className="font-bold leading-[1.2] relative shrink-0 text-[16px] text-black">
                        The slope calculation part was a bit too fast
                      </p>
                    </div>
                    <StatusTag text="Clarity" additionalClassNames="bg-[#f1044f]" />
                  </div>
                  <div
                    aria-hidden
                    className="absolute border border-[#f1b903] border-solid inset-0 pointer-events-none"
                  />
                </div>
              </div>
              <div
                aria-hidden
                className="absolute border border-[#d6d6d6] border-solid inset-[-0.5px] pointer-events-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
