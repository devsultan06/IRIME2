"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  GraduationCap,
  Loader2,
  Eye,
  EyeOff,
  UserCircle,
  Users,
  Info,
  Copy,
  Check,
} from "lucide-react";
import { generateSupervisorCode } from "@/lib/utils";

type Role = "student" | "supervisor";

export default function RegisterPage() {
  const [role, setRole] = useState<Role>("student");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [institution, setInstitution] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Student-specific
  const [matric, setMatric] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [supervisorCode, setSupervisorCode] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setGeneratedCode("");

    // Validation
    const errors: string[] = [];
    if (!fullName || !email || !institution || !password || !confirmPassword)
      errors.push("All fields are required.");
    if (password !== confirmPassword) errors.push("Passwords do not match.");
    if (password.length < 8)
      errors.push("Password must be at least 8 characters.");
    if (role === "student" && !supervisorCode)
      errors.push("Supervisor Code is required.");

    if (errors.length > 0) {
      setError(errors.join(" "));
      return;
    }

    setLoading(true);

    try {
      // If student, verify supervisor code exists first
      if (role === "student") {
        const { data: supervisor } = await supabase
          .from("profiles")
          .select("id")
          .eq("supervisor_code", supervisorCode.trim())
          .single();

        if (!supervisor) {
          setError(
            "Supervisor code not found. Verify with your supervisor."
          );
          setLoading(false);
          return;
        }
      }

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      if (!authData.user) {
        setError("Registration failed. Please try again.");
        setLoading(false);
        return;
      }

      const userId = authData.user.id;

      // Generate supervisor code if supervisor
      const supCode =
        role === "supervisor"
          ? generateSupervisorCode(fullName)
          : null;

      // Create profile
      const { error: profileError } = await supabase.from("profiles").insert({
        id: userId,
        email,
        role,
        full_name: fullName,
        institution,
        supervisor_code: supCode,
      });

      if (profileError) {
        setError("Profile creation failed: " + profileError.message);
        setLoading(false);
        return;
      }

      // If student, create student record linking to supervisor
      if (role === "student") {
        const { data: supervisor } = await supabase
          .from("profiles")
          .select("id")
          .eq("supervisor_code", supervisorCode.trim())
          .single();

        if (supervisor) {
          await supabase.from("students").insert({
            user_id: userId,
            supervisor_id: supervisor.id,
            matric_number: matric || null,
            school_name: schoolName || null,
          });
        }

        setSuccess("Account created successfully! You can now sign in.");
      } else {
        setGeneratedCode(supCode || "");
        setSuccess("Supervisor account created successfully!");
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function copyCode() {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg relative z-10 animate-fade-in">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              IRME
            </h1>
          </div>
          <p className="text-zinc-400 text-xs">Create your account</p>
        </div>

        <div className="glass-card p-8">
          {/* Role toggle */}
          <div className="flex gap-2 mb-6 p-1 bg-zinc-950 rounded-lg">
            <button
              type="button"
              onClick={() => setRole("student")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all ${
                role === "student"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <UserCircle className="w-4 h-4" />
              Student Teacher
            </button>
            <button
              type="button"
              onClick={() => setRole("supervisor")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all ${
                role === "supervisor"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Users className="w-4 h-4" />
              Academic Supervisor
            </button>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="As it appears on official documents"
                className="w-full px-4 py-3 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@university.edu"
                className="w-full px-4 py-3 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                Institution / University
              </label>
              <input
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="Your university name"
                className="w-full px-4 py-3 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    className="w-full px-4 py-3 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 text-sm pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full px-4 py-3 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 text-sm"
                />
              </div>
            </div>

            {/* Student-specific fields */}
            {role === "student" && (
              <>
                <div className="flex items-start gap-2 bg-blue-500/10 border border-blue-500/10 rounded-lg px-4 py-3 mt-2">
                  <Info className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-blue-300 leading-relaxed">
                    Your supervisor will provide you with a unique Supervisor
                    Code during your pre-deployment briefing.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                      Matric / Student Number
                    </label>
                    <input
                      type="text"
                      value={matric}
                      onChange={(e) => setMatric(e.target.value)}
                      placeholder="e.g. 220401"
                      className="w-full px-4 py-3 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                      Assigned School
                    </label>
                    <input
                      type="text"
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      placeholder="Placement school"
                      className="w-full px-4 py-3 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Supervisor Code
                  </label>
                  <input
                    type="text"
                    value={supervisorCode}
                    onChange={(e) => setSupervisorCode(e.target.value)}
                    placeholder="e.g. SUP-ADAMU-3F9A2B"
                    className="w-full px-4 py-3 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 text-sm font-mono tracking-wider"
                  />
                </div>
              </>
            )}

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs rounded-lg px-4 py-3">
                {success}
              </div>
            )}

            {/* Supervisor code display */}
            {generatedCode && (
              <div className="glass-card p-5 !mb-0 border-zinc-850">
                <p className="text-[0.65rem] uppercase tracking-widest text-zinc-500 font-semibold mb-1">
                  Your Supervisor Code
                </p>
                <div className="flex items-center gap-3">
                  <code className="text-base font-bold font-mono text-blue-400 tracking-wide">
                    {generatedCode}
                  </code>
                  <button
                    type="button"
                    onClick={copyCode}
                    className="p-2 rounded-md bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-400 hover:text-white transition-all cursor-pointer"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
                  Share this code with your student teachers so they can connect
                  to your supervision group.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading
                ? "Creating account…"
                : role === "student"
                  ? "Create Student Account"
                  : "Create Supervisor Account"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-zinc-400">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
