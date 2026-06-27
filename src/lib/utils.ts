import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// ── Score Utilities ──────────────────────────────────────────────────────────

export function compositeScore(content: number, org: number): number {
  return Math.round(content * 0.6 + org * 0.4);
}

export function scoreColorClass(score: number): string {
  if (score >= 70) return "text-emerald-400";
  if (score >= 50) return "text-amber-400";
  return "text-rose-400";
}

export function scoreBgClass(score: number): string {
  if (score >= 70) return "bg-emerald-500/15 border-emerald-500/25";
  if (score >= 50) return "bg-amber-500/15 border-amber-500/25";
  return "bg-rose-500/15 border-rose-500/25";
}

// ── Rubric Anchors ───────────────────────────────────────────────────────────

const RUBRIC_ANCHORS = {
  content: [
    [0, 39, "Inaccurate / missing core concepts"],
    [40, 59, "Partially correct, notable gaps"],
    [60, 74, "Mostly accurate, minor gaps"],
    [75, 89, "Accurate and complete"],
    [90, 100, "Exemplary depth and accuracy"],
  ] as const,
  organization: [
    [0, 39, "Disorganized, hard to follow"],
    [40, 59, "Some structure, inconsistent"],
    [60, 74, "Clear structure, minor issues"],
    [75, 89, "Well-structured and legible"],
    [90, 100, "Model board organization"],
  ] as const,
};

export function rubricLabel(kind: "content" | "organization", score: number): string {
  for (const [lo, hi, label] of RUBRIC_ANCHORS[kind]) {
    if (score >= lo && score <= hi) return label;
  }
  return "";
}

// ── Supervisor Code Generation ───────────────────────────────────────────────

export function generateSupervisorCode(username: string): string {
  const clean = username.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
  const token = Array.from(crypto.getRandomValues(new Uint8Array(3)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
  return `SUP-${clean}-${token}`;
}

// ── Format Helpers ───────────────────────────────────────────────────────────

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Image Validation ─────────────────────────────────────────────────────────

export const MAX_IMAGE_SIZE_MB = 10;
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
];

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
    return { valid: false, error: `Image exceeds ${MAX_IMAGE_SIZE_MB}MB limit.` };
  }
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { valid: false, error: "Accepted formats: JPG, PNG, WEBP only." };
  }
  return { valid: true };
}
