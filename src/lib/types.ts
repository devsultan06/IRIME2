export type UserRole = "student" | "supervisor";

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
  institution: string | null;
  supervisor_code: string | null;
  created_at: string;
  last_login: string | null;
}

export interface Student {
  user_id: string;
  supervisor_id: string;
  matric_number: string | null;
  school_name: string | null;
}

export type SubmissionStatus = "Pending" | "Reviewed" | "Flagged";

export interface Submission {
  id: string;
  student_id: string;
  topic: string;
  subject_area: string | null;
  class_arm: string | null;
  image_url: string;
  image_filename: string | null;
  extracted_text: string | null;
  status: SubmissionStatus;
  created_at: string;
}

export interface Evaluation {
  submission_id: string;
  supervisor_id: string;
  content_score: number;
  organization_score: number;
  feedback: string;
  is_flagged: boolean;
  flag_reason: string | null;
  evaluated_at: string;
}

// ── Joined / Computed Types ──────────────────────────────────────────────────

export interface SubmissionWithEvaluation extends Submission {
  content_score: number | null;
  organization_score: number | null;
  feedback: string | null;
  is_flagged: boolean | null;
  flag_reason: string | null;
}

export interface SupervisorSubmission extends SubmissionWithEvaluation {
  student_name: string;
}

export interface SuperviseeRecord {
  id: string;
  full_name: string;
  institution: string | null;
  pending: number;
  reviewed: number;
  flagged: number;
}

export interface SupervisorStats {
  total_students: number;
  total_submissions: number;
  pending: number;
  reviewed: number;
  flagged: number;
  avg_score: number | null;
}
