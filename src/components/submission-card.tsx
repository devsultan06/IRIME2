"use client";

import { useState } from "react";
import { StatusBadge } from "@/components/status-badge";
import { compositeScore, scoreColorClass, formatDateShort, cn } from "@/lib/utils";
import type { SubmissionWithEvaluation } from "@/lib/types";
import { ChevronDown, Flag, MessageSquare } from "lucide-react";

interface SubmissionCardProps {
  submission: SubmissionWithEvaluation;
  showClass?: boolean;
}

export function SubmissionCard({
  submission: sub,
  showClass = true,
}: SubmissionCardProps) {
  const [open, setOpen] = useState(false);

  const hasEvaluation =
    sub.status !== "Pending" && sub.content_score !== null;
  const comp = hasEvaluation
    ? compositeScore(sub.content_score!, sub.organization_score!)
    : null;

  return (
    <div className="glass-card glass-card-hover overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 sm:p-5 text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-sm font-semibold text-white truncate">
              {sub.topic}
            </h3>
            <StatusBadge status={sub.status} />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {sub.subject_area || "No subject"}
            {showClass && sub.class_arm && ` · Class ${sub.class_arm}`}
            {" · "}
            {formatDateShort(sub.created_at)}
          </p>
        </div>

        <div className="flex items-center gap-3 ml-3">
          {comp !== null && (
            <span
              className={cn(
                "text-xl font-bold font-mono",
                scoreColorClass(comp)
              )}
            >
              {comp}
              <span className="text-xs text-slate-500 font-normal ml-0.5">
                /100
              </span>
            </span>
          )}
          <ChevronDown
            className={cn(
              "w-4 h-4 text-slate-500 transition-transform",
              open && "rotate-180"
            )}
          />
        </div>
      </button>

      {/* Expanded content */}
      {open && (
        <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-3 border-t border-slate-800/50 pt-3 animate-fade-in">
          {/* Flag reason */}
          {sub.status === "Flagged" && sub.flag_reason && (
            <div className="flex items-start gap-2 bg-rose-500/8 border border-rose-500/15 rounded-xl px-4 py-3">
              <Flag className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-rose-300">
                  Action Required
                </p>
                <p className="text-xs text-rose-300/80 mt-0.5">
                  {sub.flag_reason}
                </p>
              </div>
            </div>
          )}

          {/* Feedback */}
          {hasEvaluation && sub.feedback && (
            <div className="bg-slate-900/40 border border-slate-700/20 rounded-xl px-4 py-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
                <p className="text-xs font-semibold text-slate-400">
                  Supervisor Feedback
                </p>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                {sub.feedback}
              </p>
            </div>
          )}

          {/* Scores breakdown */}
          {hasEvaluation && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-900/30 rounded-lg px-3 py-2 text-center">
                <p className="text-xs text-slate-500 mb-0.5">Content</p>
                <p className={cn("text-lg font-bold font-mono", scoreColorClass(sub.content_score!))}>
                  {sub.content_score}
                </p>
              </div>
              <div className="bg-slate-900/30 rounded-lg px-3 py-2 text-center">
                <p className="text-xs text-slate-500 mb-0.5">Organization</p>
                <p className={cn("text-lg font-bold font-mono", scoreColorClass(sub.organization_score!))}>
                  {sub.organization_score}
                </p>
              </div>
            </div>
          )}

          {/* Pending message */}
          {sub.status === "Pending" && (
            <p className="text-xs text-slate-500 italic">
              Awaiting supervisor review.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
