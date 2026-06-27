"use client";

import type { Profile } from "@/lib/types";
import { MetricCard } from "@/components/metric-card";
import { SubmissionCard } from "@/components/submission-card";
import { MapPin, BookOpen } from "lucide-react";
import Link from "next/link";

interface StudentDashboardProps {
  profile: Profile;
  studentMeta: {
    school_name: string | null;
    matric_number: string | null;
    supervisor: { full_name: string; institution: string | null } | null;
  } | null;
  submissions: Array<{
    id: string;
    topic: string;
    subject_area: string | null;
    class_arm: string | null;
    status: "Pending" | "Reviewed" | "Flagged";
    created_at: string;
    image_url: string;
    image_filename: string | null;
    extracted_text: string | null;
    student_id: string;
    evaluations: Array<{
      content_score: number;
      organization_score: number;
      feedback: string;
      is_flagged: boolean;
      flag_reason: string | null;
    }>;
  }>;
}

export function StudentDashboard({
  profile,
  studentMeta,
  submissions,
}: StudentDashboardProps) {
  const pendingCount = submissions.filter(
    (s) => s.status === "Pending"
  ).length;
  const flaggedCount = submissions.filter(
    (s) => s.status === "Flagged"
  ).length;

  // Helper to extract evaluation details safely supporting both array and object formats from PostgREST
  const flatSubmissions = submissions.map((s) => {
    const ev = s.evaluations;
    const evalData = Array.isArray(ev) ? ev[0] : ev;
    return {
      ...s,
      content_score: evalData?.content_score ?? null,
      organization_score: evalData?.organization_score ?? null,
      feedback: evalData?.feedback ?? null,
      is_flagged: evalData?.is_flagged ?? null,
      flag_reason: evalData?.flag_reason ?? null,
    };
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Welcome back, {profile.full_name.split(" ")[0]}
          </h1>
          {studentMeta && (
            <div className="flex items-center gap-3 mt-1 text-sm text-slate-400">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {studentMeta.school_name || "School not set"}
              </span>
              <span>·</span>
              <span>
                Matric: {studentMeta.matric_number || "N/A"}
              </span>
            </div>
          )}
        </div>
        {studentMeta?.supervisor && (
          <div className="text-right">
            <p className="text-[0.65rem] uppercase tracking-widest text-slate-600 font-semibold">
              Supervisor
            </p>
            <p className="text-sm font-medium text-white">
              {studentMeta.supervisor.full_name}
            </p>
            {studentMeta.supervisor.institution && (
              <p className="text-xs text-slate-500">
                {studentMeta.supervisor.institution}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-3 gap-3 stagger-children">
        <MetricCard
          value={submissions.length}
          label="Total Submissions"
        />
        <MetricCard value={pendingCount} label="Awaiting Review" />
        <MetricCard
          value={flaggedCount}
          label="Flagged"
          variant={flaggedCount > 0 ? "flag" : "default"}
        />
      </div>

      {/* Quick action */}
      <Link
        href="/dashboard/submit"
        className="block w-full py-3.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-center text-sm transition-all shadow-sm border border-blue-600 cursor-pointer"
      >
        <span className="flex items-center justify-center gap-2">
          <BookOpen className="w-4 h-4" />
          Submit New Lesson Board
        </span>
      </Link>

      {/* Recent submissions */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-3">
          Recent Submissions
        </h2>
        {flatSubmissions.length === 0 ? (
          <div className="glass-card p-6 text-center">
            <p className="text-sm text-slate-400">
              No submissions yet. Submit your first lesson board to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {flatSubmissions.slice(0, 5).map((sub) => (
              <SubmissionCard key={sub.id} submission={sub} />
            ))}
            {flatSubmissions.length > 5 && (
              <Link
                href="/dashboard/submissions"
                className="block text-center text-sm text-blue-400 hover:text-blue-300 font-medium py-2"
              >
                View all {flatSubmissions.length} submissions →
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
