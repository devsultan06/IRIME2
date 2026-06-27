"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { StatusBadge } from "@/components/status-badge";
import { compositeScore, scoreColorClass, formatDateShort, cn } from "@/lib/utils";
import type { SubmissionWithEvaluation } from "@/lib/types";
import { ChevronDown, Flag, MessageSquare, Send, Loader2 } from "lucide-react";

interface SubmissionCardProps {
  submission: SubmissionWithEvaluation;
  showClass?: boolean;
}

interface CommentData {
  id: string;
  submission_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: {
    full_name: string;
    role: string;
  };
}

export function SubmissionCard({
  submission: sub,
  showClass = true,
}: SubmissionCardProps) {
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<CommentData[]>([]);
  const [commentText, setCommentText] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const supabase = createClient();
  const hasEvaluation = sub.status !== "Pending" && sub.content_score !== null;
  const comp = hasEvaluation ? compositeScore(sub.content_score!, sub.organization_score!) : null;

  // Fetch comments when expanded
  useEffect(() => {
    if (!open) return;

    let isMounted = true;
    setLoadingComments(true);

    async function loadCommentsAndUser() {
      try {
        // Get user session
        const { data: { user } } = await supabase.auth.getUser();
        if (user && isMounted) {
          setUserId(user.id);
        }

        // Fetch comments joined with profile details
        const { data, error } = await supabase
          .from("comments")
          .select("*, profiles:profiles!comments_user_id_fkey(full_name, role)")
          .eq("submission_id", sub.id)
          .order("created_at", { ascending: true });

        if (error) throw error;

        if (isMounted) {
          setComments((data as any[]) || []);
        }
      } catch (err) {
        console.error("Failed to load comments:", err);
      } finally {
        if (isMounted) setLoadingComments(false);
      }
    }

    loadCommentsAndUser();

    return () => {
      isMounted = false;
    };
  }, [open, sub.id, supabase]);

  async function handleSendComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim() || !userId) return;

    setSendingComment(true);
    try {
      const { data, error } = await supabase
        .from("comments")
        .insert({
          submission_id: sub.id,
          user_id: userId,
          content: commentText.trim(),
        })
        .select("*, profiles:profiles!comments_user_id_fkey(full_name, role)")
        .single();

      if (error) throw error;

      setComments((prev) => [...prev, data as CommentData]);
      setCommentText("");
    } catch (err) {
      console.error("Failed to send comment:", err);
    } finally {
      setSendingComment(false);
    }
  }

  return (
    <div className="glass-card glass-card-hover overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 sm:p-5 text-left cursor-pointer"
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
            <span className={cn("text-xl font-bold font-mono", scoreColorClass(comp))}>
              {comp}
              <span className="text-xs text-slate-500 font-normal ml-0.5">/100</span>
            </span>
          )}
          <ChevronDown className={cn("w-4 h-4 text-slate-500 transition-transform", open && "rotate-180")} />
        </div>
      </button>

      {/* Expanded content */}
      {open && (
        <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-4 border-t border-[#172036] pt-4 animate-fade-in">
          {/* Flag reason */}
          {sub.status === "Flagged" && sub.flag_reason && (
            <div className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/15 rounded-lg px-4 py-3">
              <Flag className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-rose-300">Action Required</p>
                <p className="text-xs text-rose-300/80 mt-0.5">{sub.flag_reason}</p>
              </div>
            </div>
          )}

          {/* Feedback */}
          {hasEvaluation && sub.feedback && (
            <div className="bg-[#151c32] border border-[#172036] rounded-lg px-4 py-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
                <p className="text-xs font-semibold text-zinc-400">Supervisor Feedback</p>
              </div>
              <p className="text-sm text-zinc-300 leading-relaxed">{sub.feedback}</p>
            </div>
          )}

          {/* Scores breakdown */}
          {hasEvaluation && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#0e1322] border border-[#172036] rounded-lg px-3 py-2 text-center">
                <p className="text-[10px] text-zinc-500 uppercase font-semibold tracking-wider mb-0.5">Content</p>
                <p className={cn("text-lg font-bold font-mono", scoreColorClass(sub.content_score!))}>
                  {sub.content_score}
                </p>
              </div>
              <div className="bg-[#0e1322] border border-[#172036] rounded-lg px-3 py-2 text-center">
                <p className="text-[10px] text-zinc-500 uppercase font-semibold tracking-wider mb-0.5">Organization</p>
                <p className={cn("text-lg font-bold font-mono", scoreColorClass(sub.organization_score!))}>
                  {sub.organization_score}
                </p>
              </div>
            </div>
          )}

          {/* Pending message */}
          {sub.status === "Pending" && (
            <p className="text-xs text-zinc-500 italic">Awaiting supervisor review.</p>
          )}

          {/* Discussion / Feedback Thread */}
          <div className="border-t border-[#172036] pt-4 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Discussion Loop</h4>

            {/* Comments list */}
            {loadingComments ? (
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Loading comments...
              </div>
            ) : comments.length === 0 ? (
              <p className="text-xs text-zinc-500 italic">No messages in this evaluation loop yet.</p>
            ) : (
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {comments.map((comment) => {
                  const isOwn = comment.user_id === userId;
                  return (
                    <div
                      key={comment.id}
                      className={cn(
                        "p-2.5 rounded-lg text-xs leading-relaxed max-w-[85%] border",
                        isOwn
                          ? "bg-blue-600/10 border-blue-500/25 ml-auto text-blue-100"
                          : "bg-[#151c32] border-[#172036] mr-auto text-zinc-200"
                      )}
                    >
                      <div className="flex items-center justify-between gap-4 mb-1 font-semibold">
                        <span className={isOwn ? "text-blue-300" : "text-zinc-400"}>
                          {comment.profiles?.full_name} ({comment.profiles?.role})
                        </span>
                        <span className="text-[9px] font-normal text-zinc-500">
                          {formatDateShort(comment.created_at)}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap">{comment.content}</p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Post comment input */}
            <form onSubmit={handleSendComment} className="flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Type a message to respond or clarify..."
                className="flex-1 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none"
              />
              <button
                type="submit"
                disabled={sendingComment || !commentText.trim()}
                className="px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer"
              >
                {sendingComment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
