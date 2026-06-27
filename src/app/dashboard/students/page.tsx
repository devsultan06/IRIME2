import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StudentsClient } from "./students-client";

export default async function StudentsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get roster
  const { data: studentsRaw, error: studentsError } = await supabase
    .from("students")
    .select("*, profile:profiles!students_user_id_fkey(full_name, institution)")
    .eq("supervisor_id", user.id);

  if (studentsError) {
    console.error("Error fetching students:", studentsError);
  }

  const studentIds = studentsRaw?.map((s) => s.user_id) || [];

  if (studentIds.length === 0) {
    return <StudentsClient roster={[]} submissionsMap={{}} />;
  }

  // Fetch all submissions for these students in one query
  const { data: submissionsRaw, error: subsError } = await supabase
    .from("submissions")
    .select("*, evaluations(*)")
    .in("student_id", studentIds)
    .order("created_at", { ascending: false });

  if (subsError) {
    console.error("Error fetching submissions roster:", subsError);
  }

  // Group submissions by student ID
  const submissionsMap: Record<string, any[]> = {};
  studentIds.forEach((id) => {
    submissionsMap[id] = [];
  });

  const subs = submissionsRaw || [];
  subs.forEach((sub) => {
    if (submissionsMap[sub.student_id]) {
      submissionsMap[sub.student_id].push(sub);
    }
  });

  // Calculate status statistics per student
  const roster = (studentsRaw || []).map((s) => {
    const studentSubs = submissionsMap[s.user_id] || [];
    const pending = studentSubs.filter((item) => item.status === "Pending").length;
    const reviewed = studentSubs.filter((item) => item.status === "Reviewed").length;
    const flagged = studentSubs.filter((item) => item.status === "Flagged").length;

    return {
      id: s.user_id,
      full_name: s.profile?.full_name || "Unknown student",
      institution: s.profile?.institution || "",
      matric_number: s.matric_number,
      school_name: s.school_name,
      pending,
      reviewed,
      flagged,
    };
  });

  return <StudentsClient roster={roster} submissionsMap={submissionsMap} />;
}
