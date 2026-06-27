import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StudentDashboard } from "./student-dashboard";
import { SupervisorDashboard } from "./supervisor-dashboard";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  if (profile.role === "student") {
    // Fetch student-specific data
    const { data: studentMeta } = await supabase
      .from("students")
      .select("*, supervisor:profiles!students_supervisor_id_fkey(full_name, institution)")
      .eq("user_id", user.id)
      .single();

    const { data: submissions } = await supabase
      .from("submissions")
      .select("*, evaluations(*)")
      .eq("student_id", user.id)
      .order("created_at", { ascending: false });

    return (
      <StudentDashboard
        profile={profile}
        studentMeta={studentMeta}
        submissions={submissions || []}
      />
    );
  }

  if (profile.role === "supervisor") {
    // Fetch supervisor stats
    const { data: students } = await supabase
      .from("students")
      .select("user_id")
      .eq("supervisor_id", user.id);

    const studentIds = students?.map((s) => s.user_id) || [];

    const { data: allSubmissions } = await supabase
      .from("submissions")
      .select("*, evaluations(*)")
      .in("student_id", studentIds.length > 0 ? studentIds : ["__none__"])
      .order("created_at", { ascending: false });

    const subs = allSubmissions || [];
    const pending = subs.filter((s) => s.status === "Pending").length;
    const flagged = subs.filter((s) => s.status === "Flagged").length;
    const reviewed = subs.length - pending - flagged;

    const evaluatedSubs = subs
      .filter((s) => s.evaluations && s.evaluations.length > 0)
      .map((s) => s.evaluations[0].content_score);
    const avgScore =
      evaluatedSubs.length > 0
        ? Math.round(
            evaluatedSubs.reduce((a: number, b: number) => a + b, 0) /
              evaluatedSubs.length
          )
        : null;

    const stats = {
      total_students: studentIds.length,
      total_submissions: subs.length,
      pending,
      reviewed,
      flagged,
      avg_score: avgScore,
    };

    return <SupervisorDashboard profile={profile} stats={stats} />;
  }

  redirect("/login");
}
