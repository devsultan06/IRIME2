"use client";

import type { Profile, SupervisorStats } from "@/lib/types";
import { MetricCard } from "@/components/metric-card";
import Link from "next/link";
import { ClipboardList, Users, TrendingUp, ArrowRight } from "lucide-react";

interface SupervisorDashboardProps {
  profile: Profile;
  stats: SupervisorStats;
}

export function SupervisorDashboard({
  profile,
  stats,
}: SupervisorDashboardProps) {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"},{" "}
          {profile.full_name.split(" ")[0]}
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          {profile.institution || "Institution not set"} · Academic Supervisor
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 stagger-children">
        <MetricCard value={stats.total_students} label="Students" />
        <MetricCard value={stats.total_submissions} label="Submissions" />
        <MetricCard value={stats.pending} label="Pending" />
        <MetricCard value={stats.reviewed} label="Reviewed" />
        <MetricCard
          value={stats.flagged}
          label="Flagged"
          variant={stats.flagged > 0 ? "flag" : "default"}
        />
      </div>

      {/* Average score highlight */}
      {stats.avg_score !== null && (
        <div className="glass-card p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Cohort Average Score</p>
              <p className="text-3xl font-bold font-mono text-white">
                {stats.avg_score}
                <span className="text-sm text-slate-500 font-normal ml-1">/100</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick action cards */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Link
          href="/dashboard/review"
          className="group glass-card glass-card-hover p-6 flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/15 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ClipboardList className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Review Queue</p>
              <p className="text-xs text-slate-500">
                {stats.pending} submission{stats.pending !== 1 ? "s" : ""} awaiting review
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
        </Link>

        <Link
          href="/dashboard/students"
          className="group glass-card glass-card-hover p-6 flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-violet-500/10 border border-violet-500/15 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                Supervisee Records
              </p>
              <p className="text-xs text-slate-500">
                {stats.total_students} student{stats.total_students !== 1 ? "s" : ""} assigned
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-violet-400 group-hover:translate-x-1 transition-all" />
        </Link>
      </div>
    </div>
  );
}
