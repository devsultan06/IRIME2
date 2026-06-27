"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { StatusBadge } from "@/components/status-badge";
import {
  compositeScore,
  scoreColorClass,
  formatDateShort,
  rubricLabel,
  cn,
} from "@/lib/utils";
import {
  Search,
  Download,
  AlertTriangle,
  Send,
  X,
  FileText,
  Sliders,
  Sparkles,
  User,
  Loader2,
} from "lucide-react";

interface ReviewClientProps {
  initialPending: any[];
}

export function ReviewClient({ initialPending }: ReviewClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeId = searchParams.get("id");

  const [search, setSearch] = useState("");
  const [contentScore, setContentScore] = useState(70);
  const [organizationScore, setOrganizationScore] = useState(70);
  const [feedback, setFeedback] = useState("");
  const [isFlagged, setIsFlagged] = useState(false);
  const [flagReason, setFlagReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const supabase = createClient();

  // Filter queue
  const filtered = initialPending.filter((item) => {
    const term = search.toLowerCase();
    const studentName = item.profiles?.full_name?.toLowerCase() || "";
    const topic = item.topic?.toLowerCase() || "";
    const subject = item.subject_area?.toLowerCase() || "";
    return studentName.includes(term) || topic.includes(term) || subject.includes(term);
  });

  const activeSubmission = initialPending.find((s) => s.id === activeId);

  function handleSelect(id: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("id", id);
    router.push(`?${params.toString()}`);

    // Pre-populate evaluation if exists
    const evalData = initialPending.find((s) => s.id === id)?.evaluations?.[0];
    if (evalData) {
      setContentScore(evalData.content_score);
      setOrganizationScore(evalData.organization_score);
      setFeedback(evalData.feedback);
      setIsFlagged(evalData.is_flagged);
      setFlagReason(evalData.flag_reason || "");
    } else {
      setContentScore(70);
      setOrganizationScore(70);
      setFeedback("");
      setIsFlagged(false);
      setFlagReason("");
    }
    setError("");
  }

  function handleClose() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("id");
    router.push(`?${params.toString()}`);
    setError("");
  }

  async function handleCommit(e: React.FormEvent) {
    e.preventDefault();
    if (!activeSubmission) return;

    if (!feedback.trim()) {
      setError("Remediation feedback comments are required.");
      return;
    }
    if (isFlagged && !flagReason.trim()) {
      setError("Please provide a reason code or detail when flagging a submission.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Unauthenticated.");

      // Upsert evaluation
      const { error: evalError } = await supabase.from("evaluations").upsert({
        submission_id: activeSubmission.id,
        supervisor_id: user.id,
        content_score: contentScore,
        organization_score: organizationScore,
        feedback: feedback.trim(),
        is_flagged: isFlagged,
        flag_reason: isFlagged ? flagReason.trim() : null,
      });

      if (evalError) throw evalError;

      // Update submission status
      const { error: subError } = await supabase
        .from("submissions")
        .update({ status: isFlagged ? "Flagged" : "Reviewed" })
        .eq("id", activeSubmission.id);

      if (subError) throw subError;

      // Success
      handleClose();
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to commit evaluation.");
    } finally {
      setSubmitting(false);
    }
  }

  const compScore = compositeScore(contentScore, organizationScore);

  return (
    <div className="space-y-6">
      {/* Overview stats header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Review Queue
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Audit unreviewed classroom whiteboard visual layouts and commit scores.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by student or topic..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900/60 border border-slate-700/50 text-white placeholder-slate-500 text-sm transition-all"
          />
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Queue Column */}
        <div className={cn("space-y-3", activeSubmission ? "lg:col-span-4" : "lg:col-span-12")}>
          {filtered.length === 0 ? (
            <div className="glass-card p-12 text-center text-slate-500">
              No pending reviews matching filter rules.
            </div>
          ) : (
            filtered.map((item) => {
              const active = item.id === activeId;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className={cn(
                    "w-full text-left glass-card p-4 transition-all flex flex-col justify-between gap-3 border",
                    active
                      ? "border-blue-500/40 bg-blue-500/5 shadow-md shadow-blue-500/5"
                      : "hover:border-slate-600/50"
                  )}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-semibold text-white truncate">
                        {item.topic}
                      </h4>
                      <StatusBadge status={item.status} />
                    </div>
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-500" />
                      {item.profiles?.full_name}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800/40">
                    <span>
                      {item.subject_area} {item.class_arm ? `· ${item.class_arm}` : ""}
                    </span>
                    <span>{formatDateShort(item.created_at)}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Side-by-Side Review Workspace Column */}
        {activeSubmission && (
          <div className="lg:col-span-8 space-y-6 animate-fade-in">
            <div className="glass-card overflow-hidden">
              {/* Header bar */}
              <div className="flex items-center justify-between px-6 py-4 bg-slate-950/40 border-b border-slate-800/40">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {activeSubmission.topic}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Submitted by {activeSubmission.profiles?.full_name} ·{" "}
                    {activeSubmission.subject_area}{" "}
                    {activeSubmission.class_arm ? `· Class ${activeSubmission.class_arm}` : ""}
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className="p-1.5 rounded-lg hover:bg-slate-800/80 text-slate-400 hover:text-white transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Visual Workspace: side-by-side */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Photo Column */}
                  <div className="space-y-2">
                    <h5 className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                      Board Photograph
                    </h5>
                    <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={activeSubmission.image_url}
                        alt="Whiteboard crop capture"
                        className="max-h-[300px] w-full object-contain"
                      />
                    </div>
                    <a
                      href={activeSubmission.image_url}
                      download={activeSubmission.image_filename || "board.jpg"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-700/40 text-slate-300 hover:text-white font-medium text-xs transition-all flex items-center justify-center gap-2"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download Original Image
                    </a>
                  </div>

                  {/* Transcript Column */}
                  <div className="space-y-2">
                    <h5 className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                      VLM Text Transcript
                    </h5>
                    <div className="transcript-box max-h-[300px] h-[300px] overflow-y-auto">
                      {activeSubmission.extracted_text || "_No transcript available._"}
                    </div>
                    {activeSubmission.extracted_text && (
                      <button
                        onClick={() => {
                          const element = document.createElement("a");
                          const file = new Blob([activeSubmission.extracted_text || ""], {
                            type: "text/plain",
                          });
                          element.href = URL.createObjectURL(file);
                          element.download = `transcript_${activeSubmission.id}.txt`;
                          document.body.appendChild(element);
                          element.click();
                          document.body.removeChild(element);
                        }}
                        className="w-full py-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-700/40 text-slate-300 hover:text-white font-medium text-xs transition-all flex items-center justify-center gap-2"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download Transcript (.txt)
                      </button>
                    )}
                  </div>
                </div>

                <hr className="border-slate-800/40" />

                {/* Form Evaluation Section */}
                <form onSubmit={handleCommit} className="space-y-5">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-blue-400" />
                    <h4 className="text-sm font-semibold text-white">
                      Evaluation Sheet
                    </h4>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Content Score */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-baseline">
                        <label className="text-xs font-medium text-slate-300">
                          Content Accuracy (0–100)
                        </label>
                        <span
                          className={cn(
                            "text-sm font-bold font-mono",
                            scoreColorClass(contentScore)
                          )}
                        >
                          {contentScore}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={contentScore}
                        onChange={(e) => setContentScore(Number(e.target.value))}
                      />
                      <p className="text-[11px] text-slate-500 font-medium italic">
                        {rubricLabel("content", contentScore)}
                      </p>
                    </div>

                    {/* Organization Score */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-baseline">
                        <label className="text-xs font-medium text-slate-300">
                          Board Organization (0–100)
                        </label>
                        <span
                          className={cn(
                            "text-sm font-bold font-mono",
                            scoreColorClass(organizationScore)
                          )}
                        >
                          {organizationScore}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={organizationScore}
                        onChange={(e) => setOrganizationScore(Number(e.target.value))}
                      />
                      <p className="text-[11px] text-slate-500 font-medium italic">
                        {rubricLabel("organization", organizationScore)}
                      </p>
                    </div>
                  </div>

                  {/* Composite preview */}
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900/40 border border-slate-800">
                    <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                    <p className="text-xs text-slate-400">
                      Composite Score (60% Content + 40% Org):{" "}
                      <span
                        className={cn(
                          "text-sm font-bold font-mono ml-1",
                          scoreColorClass(compScore)
                        )}
                      >
                        {compScore}/100
                      </span>
                    </p>
                  </div>

                  {/* Feedback text area */}
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-slate-300">
                      Pedagogical Feedback Comments <span className="text-rose-400">*</span>
                    </label>
                    <textarea
                      rows={4}
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Provide structured notes on syllabus accuracy, visual board layouts, formatting corrections..."
                      className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-slate-700/35 text-slate-200 text-sm leading-relaxed"
                    />
                  </div>

                  {/* Flag logic */}
                  <div className="space-y-3 p-4 rounded-xl bg-rose-500/5 border border-rose-500/10">
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isFlagged}
                        onChange={(e) => setIsFlagged(e.target.checked)}
                        className="rounded border-slate-700 bg-slate-950 text-rose-500 focus:ring-rose-500 focus:ring-offset-slate-900"
                      />
                      <span className="text-xs font-medium text-rose-300">
                        Flag this teaching submission for follow-up intervention
                      </span>
                    </label>

                    {isFlagged && (
                      <div className="space-y-1.5 animate-fade-in">
                        <label className="block text-[11px] font-semibold text-rose-400">
                          Provide Flag Reason Code
                        </label>
                        <input
                          type="text"
                          value={flagReason}
                          onChange={(e) => setFlagReason(e.target.value)}
                          placeholder="e.g. Inaccurate formula setup in Section 1, requires revision"
                          className="w-full px-3 py-2 rounded-lg bg-slate-950/60 border border-rose-500/25 text-rose-200 placeholder-rose-900/60 text-xs"
                        />
                      </div>
                    )}
                  </div>

                  {error && (
                    <div className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-lg px-3 py-2">
                      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Forms Buttons */}
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-semibold text-sm transition-all shadow-md shadow-blue-500/10 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Commiting Evaluation...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Commit Evaluation Record
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleClose}
                      className="px-5 py-3 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/40 text-slate-300 hover:text-white text-sm font-medium transition-all"
                    >
                      Close without saving
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
