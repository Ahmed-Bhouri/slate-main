"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useClassStore } from "@/stores/classStore";
import { useProfileStore } from "@/stores/profileStore";
import { Loader2, ArrowRight, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ReportPage() {
  const router = useRouter();
  const { classState, getKPIs, reset: resetClass } = useClassStore();
  const { teacherProfile, setTeacherProfile } = useProfileStore();
  
  const [report, setReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    async function fetchReport() {
      if (!classState || !teacherProfile) {
        // If we have sessions but no active classState, maybe we just finished one?
        // But for now, let's just error out if explicitly missing.
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
            teacherProfile
          }),
        });

        if (!res.ok) throw new Error("Failed to generate report");

        const data = await res.json();
        setReport(data.report);
        setTeacherProfile(data.updatedProfile); // Auto-update profile
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    }

    fetchReport();
  }, [classState, teacherProfile, getKPIs, setTeacherProfile]);

  if (isLoading || !isHydrated) {
    return (
      <div className="flex h-screen items-center justify-center flex-col gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-gray-500">Analyzing session and updating profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-8 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error Generating Report</h1>
        <p className="mb-4">{error}</p>
        <Button onClick={() => router.push("/test-room")}>Back to Room</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl py-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Session Report</h1>
        <Button onClick={() => {
            resetClass();
            router.push("/test-room");
        }}>
          Start New Session <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Session Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg leading-relaxed text-gray-700">{report.summary}</p>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Strengths */}
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-800">Strengths</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2">
              {report.strengths.map((s: string | { point: string; example: string }, i: number) => (
                <li key={i} className="text-green-900">
                  {typeof s === 'string' ? s : `${s.point} (e.g. ${s.example})`}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Areas for Improvement */}
        <Card className="bg-orange-50 border-orange-200">
          <CardHeader>
            <CardTitle className="text-orange-800">Areas for Improvement</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2">
              {report.areas_for_improvement.map((s: string | { point: string; example: string }, i: number) => (
                <li key={i} className="text-orange-900">
                  {typeof s === 'string' ? s : `${s.point} (e.g. ${s.example})`}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Profile Updates */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Impact</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(report.score_adjustment || {}).map(([metric, change]: [string, any]) => {
              const val = Number(change);
              if (val === 0) return null;
              
              return (
                <div key={metric} className="p-4 border rounded-lg flex flex-col items-center text-center bg-slate-50">
                  <div className="text-sm font-medium text-gray-500 capitalize mb-2">
                    {metric.replace('_', ' ')}
                  </div>
                  <div className={`text-xl font-bold flex items-center gap-1 ${
                    val > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {val > 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                    {val > 0 ? '+' : ''}{val.toFixed(2)}
                  </div>
                </div>
              );
            })}
            
            {Object.keys(report.score_adjustment || {}).length === 0 && (
                <div className="col-span-4 text-center text-gray-500 py-4 italic">
                    No significant profile changes this session.
                </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
