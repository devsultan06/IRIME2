import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ReviewClient } from "./review-client";

export default async function ReviewPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get students supervised by this supervisor
  const { data: students } = await supabase
    .from("students")
    .select("user_id")
    .eq("supervisor_id", user.id);

  const studentIds = students?.map((s) => s.user_id) || [];

  if (studentIds.length === 0) {
    return (
      <ReviewClient initialPending={[]} />
    );
  }

  // Get pending submissions for this supervisor's group
  const { data: submissions, error } = await supabase
    .from("submissions")
    .select("*, profiles!submissions_student_id_fkey(full_name)")
    .in("student_id", studentIds)
    .eq("status", "Pending")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching review queue:", error);
  }

  return (
    <ReviewClient initialPending={submissions || []} />
  );
}
