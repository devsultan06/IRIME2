import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IRME — Intelligent Remote Monitoring & Evaluation",
  description:
    "A web-based asynchronous pedagogical assessment platform that converts classroom board images into structured evaluations for remote supervisors.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
