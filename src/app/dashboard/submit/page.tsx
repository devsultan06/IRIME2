"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { validateImageFile } from "@/lib/utils";
import {
  Upload,
  Camera,
  Sparkles,
  Loader2,
  Check,
  RotateCcw,
  Send,
  X,
  Image as ImageIcon,
  AlertCircle,
} from "lucide-react";

export default function SubmitPage() {
  const [topic, setTopic] = useState("");
  const [subject, setSubject] = useState("");
  const [classArm, setClassArm] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [editedText, setEditedText] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  const handleFile = useCallback((f: File) => {
    const validation = validateImageFile(f);
    if (!validation.valid) {
      setError(validation.error || "Invalid file.");
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setError("");
    setExtractedText(null);
  }, []);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  }

  function removeFile() {
    setFile(null);
    setPreview(null);
    setExtractedText(null);
    setEditedText("");
  }

  async function handleExtract() {
    if (!file) return;
    if (!topic.trim() || !subject.trim()) {
      setError("Lesson Topic and Subject Area are required.");
      return;
    }

    setExtracting(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("/api/extract", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Extraction failed.");

      setExtractedText(data.text);
      setEditedText(data.text);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to extract text. Try a clearer photo."
      );
    } finally {
      setExtracting(false);
    }
  }

  async function handleSubmit() {
    if (!file || !editedText.trim()) return;
    if (!topic.trim() || !subject.trim()) {
      setError("Lesson Topic and Subject Area are required.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated.");

      // Upload image to Supabase Storage
      const fileExt = file.name.split(".").pop() || "jpg";
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("board-images")
        .upload(filePath, file);

      if (uploadError) throw new Error("Image upload failed: " + uploadError.message);

      const {
        data: { publicUrl },
      } = supabase.storage.from("board-images").getPublicUrl(filePath);

      // Save submission
      const { error: insertError } = await supabase
        .from("submissions")
        .insert({
          student_id: user.id,
          topic: topic.trim(),
          subject_area: subject.trim(),
          class_arm: classArm.trim() || null,
          image_url: publicUrl,
          image_filename: file.name,
          extracted_text: editedText.trim(),
          status: "Pending",
        });

      if (insertError) throw new Error("Submission failed: " + insertError.message);

      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 1500);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Submission failed."
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleDiscard() {
    setExtractedText(null);
    setEditedText("");
  }

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] animate-fade-in">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            Submission Sent!
          </h2>
          <p className="text-sm text-slate-400">
            Your lesson board has been sent to your supervisor for review.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Submit Lesson Board
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Photograph the completed board at the end of your lesson. Ensure the
          image is well-lit and captures the full board surface.
        </p>
      </div>

      {/* Metadata fields */}
      <div className="glass-card p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Lesson Topic <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Photosynthesis"
            className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-700/40 text-white placeholder-slate-500 text-sm transition-all"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Subject Area <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Biology"
              className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-700/40 text-white placeholder-slate-500 text-sm transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Class / Arm
            </label>
            <input
              type="text"
              value={classArm}
              onChange={(e) => setClassArm(e.target.value)}
              placeholder="e.g. SS2A"
              className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-700/40 text-white placeholder-slate-500 text-sm transition-all"
            />
          </div>
        </div>
      </div>

      {/* Image upload */}
      <div className="glass-card p-6">
        <label className="block text-sm font-medium text-slate-300 mb-3">
          Board Image <span className="text-rose-400">*</span>
        </label>

        {!file ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all cursor-pointer ${
              dragOver
                ? "border-blue-400 bg-blue-500/5"
                : "border-slate-700/50 hover:border-slate-600/60 hover:bg-slate-800/20"
            }`}
          >
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileInput}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-800/60 border border-slate-700/30 flex items-center justify-center">
                {dragOver ? (
                  <Upload className="w-6 h-6 text-blue-400" />
                ) : (
                  <Camera className="w-6 h-6 text-slate-400" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-300">
                  Drop your board photo here, or{" "}
                  <span className="text-blue-400">browse</span>
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  JPG, PNG, WEBP · Max 10MB
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden border border-slate-700/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview!}
                alt="Board preview"
                className="w-full max-h-[400px] object-contain bg-slate-950"
              />
              <button
                onClick={removeFile}
                className="absolute top-3 right-3 p-2 rounded-xl bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 backdrop-blur-sm border border-slate-700/50">
                <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs text-slate-300 truncate max-w-[200px]">
                  {file.name}
                </span>
              </div>
            </div>

            {/* Extract button */}
            {!extractedText && (
              <button
                onClick={handleExtract}
                disabled={extracting}
                className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                {extracting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Extracting text from board…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Extract Board Transcript
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Transcript editor */}
      {extractedText !== null && (
        <div className="glass-card p-6 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-semibold text-white">
                AI Transcript
              </h3>
            </div>
            <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold">
              Review & edit before submitting
            </span>
          </div>

          <textarea
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            rows={12}
            className="w-full px-4 py-3 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-200 text-sm font-mono leading-relaxed resize-y transition-all"
            placeholder="Transcript will appear here..."
          />

          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={submitting || !editedText.trim()}
              className="flex-1 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting…
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit to Supervisor
                </>
              )}
            </button>
            <button
              onClick={handleDiscard}
              className="px-6 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-700/80 font-medium text-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Discard
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 bg-rose-500/8 border border-rose-500/15 rounded-xl px-4 py-3 animate-fade-in">
          <AlertCircle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
          <p className="text-sm text-rose-300">{error}</p>
        </div>
      )}
    </div>
  );
}
