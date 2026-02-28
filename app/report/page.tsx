"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useClassStore } from "@/stores/classStore";
import { useProfileStore } from "@/stores/profileStore";

type ReportData = {
  summary?: string;
  strengths?: (string | { point: string; example: string })[];
  areas_for_improvement?: (string | { point: string; example: string })[];
  score_adjustment?: Record<string, number>;
};

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
  );
}

function formatStrengthOrImprovement(s: string | { point: string; example: string }): string {
  return typeof s === "string" ? s : `${s.point} (e.g. ${s.example})`;
}

function Section({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`border border-[#d6d6d6] border-solid flex flex-col gap-[8px] p-[16px] w-full ${className}`}
    >
      <p className="font-bold text-[12px] text-[rgba(0,0,0,0.7)] uppercase">{title}</p>
      {children}
    </div>
  );
}

export default function ReportPage() {
  const router = useRouter();
  const { classState, getKPIs, reset: resetClass } = useClassStore();
  const { teacherProfile, setTeacherProfile, hasHydrated } = useProfileStore();
  
  const [report, setReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasHydrated) return;

    async function fetchReport() {
      if (!classState || !teacherProfile) {
        setError("Missing session data. Cannot generate report.");
        setIsLoading(false);
        return;
      }

      const kpis = getKPIs();
      if (!kpis) {
        setError("Could not calculate session KPIs.");
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            classState,
            kpis,
            teacherProfile,
          }),
        });

        if (!res.ok) throw new Error("Failed to generate report");

        const data = await res.json();
        setReport(data.report);
        setTeacherProfile(data.updatedProfile);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    }

    fetchReport();
  }, [hasHydrated, classState, teacherProfile, getKPIs, setTeacherProfile]);

  const handleStartNewSession = () => {
    resetClass();
    router.push("/test-room");
  };

  const navBar = (
    <div className="content-stretch flex items-center justify-center overflow-clip px-[48px] py-[24px] relative shrink-0 w-full max-w-[1512px]">
      <div className="flex-1 max-w-[1280px] min-w-0 relative w-full">
        <div className="flex flex-row items-center max-w-[inherit] size-full">
          <div className="content-stretch flex items-center justify-between max-w-[inherit] px-[32px] relative w-full flex-wrap gap-4">
            <Link href="/" className="content-stretch flex items-center relative shrink-0 min-w-0">
              <NavLogo />
            </Link>
            <nav className="content-stretch flex gap-[48px] items-center leading-[1.2] relative shrink-0 text-[16px] uppercase">
              <Link href="/" className="font-medium relative shrink-0 text-black">
                Home
              </Link>
              <Link href="/training" className="font-medium relative shrink-0 text-black">
                Trainings
              </Link>
              <Link href="/report" className="font-bold relative shrink-0 text-[#05c770]">
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
  );

  if (isLoading || !hasHydrated) {
    return (
      <div className="bg-white flex flex-col gap-[12px] items-center min-h-screen w-full pb-[80px]">
        {navBar}
        <div className="max-w-[1280px] w-full shrink-0">
          <div className="flex items-center justify-center px-[32px] relative w-full">
            <p className="font-normal text-[12px] text-[rgba(0,0,0,0.7)] uppercase">Report</p>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center px-[32px]">
          <div className="flex flex-col gap-[16px] items-center text-center">
            <div className="h-8 w-8 border-2 border-[#05c770] border-t-transparent rounded-full animate-spin" />
            <p className="font-normal text-[14px] text-[rgba(0,0,0,0.7)]">
              Analyzing session and updating profile…
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white flex flex-col gap-[12px] items-center min-h-screen w-full pb-[80px]">
        {navBar}
        <div className="max-w-[1280px] w-full shrink-0">
          <div className="flex items-center justify-center px-[32px] relative w-full">
            <p className="font-normal text-[12px] text-[rgba(0,0,0,0.7)] uppercase">Report</p>
          </div>
        </div>
        <div className="max-w-[720px] w-full flex-1 flex flex-col items-center justify-center px-[32px] text-center">
          <h2 className="font-bold text-[24px] text-[#011627] mb-2">Error generating report</h2>
          <p className="font-normal text-[14px] text-[#f13704] mb-6">{error}</p>
          <button
            type="button"
            onClick={() => router.push("/test-room")}
            className="bg-[#05c770] text-white font-bold text-[14px] uppercase px-[16px] py-[12px] hover:opacity-90 transition-opacity"
          >
            Back to room
          </button>
        </div>
      </div>
    );
  }

  const adjustments = report?.score_adjustment || {};
  const hasAdjustments = Object.keys(adjustments).length > 0;

  return (
    <div className="bg-white flex flex-col gap-[12px] items-center min-h-screen w-full pb-[80px]">
      {navBar}
      <div className="max-w-[1280px] w-full shrink-0">
        <div className="flex items-center justify-center px-[32px] relative w-full">
          <p className="font-normal text-[12px] text-[rgba(0,0,0,0.7)] uppercase">Report</p>
        </div>
      </div>
      <div className="max-w-[1280px] w-full flex-1 flex flex-col items-center min-h-0 px-[32px]">
        <div className="flex flex-col gap-[16px] w-full max-w-[720px]">
          <div className="flex flex-wrap items-center justify-between gap-4 w-full">
            <h2 className="font-bold text-[24px] text-[#011627]">Session report</h2>
            <button
              type="button"
              onClick={handleStartNewSession}
              className="bg-[#05c770] text-white font-bold text-[14px] uppercase px-[16px] py-[12px] hover:opacity-90 transition-opacity"
            >
              Start new session
            </button>
          </div>

          <Section title="Summary">
            <p className="font-normal text-[14px] text-black leading-[1.5]">
              {report?.summary ?? "No summary available."}
            </p>
          </Section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-[16px] w-full">
            <Section title="Strengths" className="bg-[rgba(5,199,112,0.06)] border-[#05c770]">
              <ul className="list-disc pl-5 space-y-2">
                {(report?.strengths ?? []).map((s, i) => (
                  <li key={i} className="font-normal text-[14px] text-[#011627]">
                    {formatStrengthOrImprovement(s)}
                  </li>
                ))}
                {(report?.strengths ?? []).length === 0 && (
                  <li className="font-normal text-[14px] text-[rgba(0,0,0,0.6)]">None listed.</li>
                )}
              </ul>
            </Section>
            <Section title="Areas for improvement" className="bg-[rgba(241,184,3,0.08)] border-[#f1b903]">
              <ul className="list-disc pl-5 space-y-2">
                {(report?.areas_for_improvement ?? []).map((s, i) => (
                  <li key={i} className="font-normal text-[14px] text-[#011627]">
                    {formatStrengthOrImprovement(s)}
                  </li>
                ))}
                {(report?.areas_for_improvement ?? []).length === 0 && (
                  <li className="font-normal text-[14px] text-[rgba(0,0,0,0.6)]">None listed.</li>
                )}
              </ul>
            </Section>
          </div>

          <Section title="Profile impact">
            {hasAdjustments ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-[16px]">
                {Object.entries(adjustments).map(([metric, change]) => {
                  const val = Number(change);
                  if (val === 0) return null;
                  const isPositive = val > 0;
                  return (
                    <div
                      key={metric}
                      className="border border-[#d6d6d6] border-solid p-[12px] flex flex-col items-center text-center"
                    >
                      <p className="font-bold text-[12px] text-[rgba(0,0,0,0.7)] uppercase mb-1">
                        {metric.replace(/_/g, " ")}
                      </p>
                      <p
                        className={`font-bold text-[18px] ${isPositive ? "text-[#05c770]" : "text-[#f13704]"}`}
                      >
                        {isPositive ? "+" : ""}
                        {val.toFixed(2)}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="font-normal text-[14px] text-[rgba(0,0,0,0.6)] italic">
                No significant profile changes this session.
              </p>
            )}
          </Section>

          <Link
            href="/"
            className="bg-[#05c770] text-white font-bold text-[14px] uppercase px-[16px] py-[12px] w-fit hover:opacity-90 transition-opacity"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
