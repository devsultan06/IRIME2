import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SubmissionCard } from "@/components/submission-card";
import { FileText, Inbox } from "lucide-react";

export default async function SubmissionsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch submissions for this student along with evaluations
  const { data: submissions, error } = await supabase
    .from("submissions")
    .select("*, evaluations(*)")
    .eq("student_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching submissions:", error);
  }

  // Flatten evaluations into submissions
  const flatSubmissions = (submissions || []).map((s) => ({
    ...s,
    content_score: s.evaluations?.[0]?.content_score ?? null,
    organization_score: s.evaluations?.[0]?.organization_score ?? null,
    feedback: s.evaluations?.[0]?.feedback ?? null,
    is_flagged: s.evaluations?.[0]?.is_flagged ?? null,
    flag_reason: s.evaluations?.[0]?.flag_reason ?? null,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/15 flex items-center justify-center">
          <FileText className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            My Submissions
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            A complete historical ledger of your lesson board submissions and supervisor evaluations.
          </p>
        </div>
      </div>

      {/* History Ledger */}
      {flatSubmissions.length === 0 ? (
        <div className="glass-card p-12 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-full bg-slate-800/40 border border-slate-700/30 flex items-center justify-center text-slate-500">
            <Inbox className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-300">No submissions found</h3>
            <p className="text-xs text-slate-500 mt-1">
              You haven&apos;t uploaded or submitted any classroom board artifacts yet.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {flatSubmissions.map((sub) => (
            <SubmissionCard key={sub.id} submission={sub} />
          ))}
        </div>
      )}
    </div>
  );
}
