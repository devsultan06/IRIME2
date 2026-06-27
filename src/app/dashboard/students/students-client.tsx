"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SubmissionCard } from "@/components/submission-card";
import { cn } from "@/lib/utils";
import {
  Users,
  Search,
  User,
  GraduationCap,
  AlertTriangle,
  FolderOpen,
  Clock,
  CheckCircle2,
  Flag,
} from "lucide-react";

interface StudentsClientProps {
  roster: any[];
  submissionsMap: Record<string, any[]>;
}

export function StudentsClient({ roster, submissionsMap }: StudentsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeStudentId = searchParams.get("student");

  const [search, setSearch] = useState("");

  // Filter roster
  const filteredRoster = roster.filter((student) => {
    const term = search.toLowerCase();
    const name = student.full_name?.toLowerCase() || "";
    const inst = student.institution?.toLowerCase() || "";
    return name.includes(term) || inst.includes(term);
  });

  const activeStudent = roster.find((s) => s.id === activeStudentId);
  const activeSubmissions = activeStudentId ? submissionsMap[activeStudentId] || [] : [];

  // Flatten evaluations for SubmissionCard, supporting both array and object formats from PostgREST
  const flatActiveSubmissions = activeSubmissions.map((s) => {
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

  function handleSelect(id: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("student", id);
    router.push(`?${params.toString()}`);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Supervisee Records
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Monitor and track your assigned student teachers, checking their submission progress.
          </p>
        </div>

        {/* Filter input */}
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search students..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900/60 border border-slate-700/50 text-white placeholder-slate-500 text-sm transition-all"
          />
        </div>
      </div>

      {/* Main split display */}
      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Roster Column */}
        <div className={cn("space-y-3", activeStudentId ? "lg:col-span-4" : "lg:col-span-12")}>
          {filteredRoster.length === 0 ? (
            <div className="glass-card p-12 text-center text-slate-500">
              No students found in cohort roster.
            </div>
          ) : (
            filteredRoster.map((student) => {
              const active = student.id === activeStudentId;
              const hasFlagged = student.flagged > 0;

              return (
                <button
                  key={student.id}
                  onClick={() => handleSelect(student.id)}
                  className={cn(
                    "w-full text-left glass-card p-4 transition-all border block",
                    active
                      ? "border-blue-500/40 bg-blue-500/5 shadow-md shadow-blue-500/5"
                      : "hover:border-slate-600/50"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-semibold text-white truncate">
                        {student.full_name}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        {student.institution}
                      </p>
                    </div>
                    {hasFlagged && (
                      <span className="p-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
                        <AlertTriangle className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>

                  {/* Indicator count pills */}
                  <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-800/40">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 text-[10px] font-semibold text-slate-400">
                      <Clock className="w-3 h-3 text-amber-500" />
                      {student.pending}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 text-[10px] font-semibold text-slate-400">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      {student.reviewed}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 text-[10px] font-semibold text-slate-400">
                      <Flag className="w-3 h-3 text-rose-500" />
                      {student.flagged}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* History Column */}
        {activeStudentId && (
          <div className="lg:col-span-8 space-y-4 animate-fade-in">
            {activeStudent && (
              <div className="glass-card p-5 border border-slate-800 bg-slate-950/20">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/15 flex items-center justify-center">
                      <User className="w-5 h-5 text-violet-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">
                        {activeStudent.full_name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {activeStudent.institution}
                      </p>
                    </div>
                  </div>
                  {activeStudent.matric_number && (
                    <span className="text-[10px] font-mono bg-slate-900 border border-slate-800 text-slate-400 px-2 py-1 rounded">
                      MATRIC: {activeStudent.matric_number}
                    </span>
                  )}
                </div>
              </div>
            )}

            {flatActiveSubmissions.length === 0 ? (
              <div className="glass-card p-12 text-center text-slate-500 flex flex-col items-center gap-2">
                <FolderOpen className="w-8 h-8 text-slate-600" />
                <span className="text-sm">No submissions from this supervisee yet.</span>
              </div>
            ) : (
              <div className="space-y-3">
                {flatActiveSubmissions.map((sub) => (
                  <SubmissionCard key={sub.id} submission={sub} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
