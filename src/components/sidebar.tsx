"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import type { Profile } from "@/lib/types";
import {
  GraduationCap,
  LayoutDashboard,
  Upload,
  FileText,
  ClipboardList,
  Users,
  LogOut,
  Menu,
  X,
  Copy,
  Check,
} from "lucide-react";

interface SidebarProps {
  profile: Profile;
}

export function Sidebar({ profile }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const isStudent = profile.role === "student";

  const navItems = isStudent
    ? [
        {
          href: "/dashboard",
          label: "Overview",
          icon: LayoutDashboard,
        },
        {
          href: "/dashboard/submit",
          label: "Submit Board",
          icon: Upload,
        },
        {
          href: "/dashboard/submissions",
          label: "My Submissions",
          icon: FileText,
        },
      ]
    : [
        {
          href: "/dashboard",
          label: "Overview",
          icon: LayoutDashboard,
        },
        {
          href: "/dashboard/review",
          label: "Review Queue",
          icon: ClipboardList,
        },
        {
          href: "/dashboard/students",
          label: "Supervisee Records",
          icon: Users,
        },
      ];

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function copyCode() {
    if (profile.supervisor_code) {
      navigator.clipboard.writeText(profile.supervisor_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-6 py-6 border-b border-[#172036]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">
              IRME
            </h1>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-blue-600/10 text-blue-400 border border-blue-500/25"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-[#151c32]"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Supervisor code (if supervisor) */}
      {!isStudent && profile.supervisor_code && (
        <div className="px-4 pb-3">
          <div className="bg-[#151c32] border border-[#172036] rounded-lg px-4 py-3">
            <p className="text-[0.65rem] text-zinc-500 uppercase tracking-widest font-semibold mb-1">
              Invite Code
            </p>
            <div className="flex items-center justify-between gap-2">
              <code className="text-sm font-bold font-mono text-blue-400 tracking-wide">
                {profile.supervisor_code}
              </code>
              <button
                onClick={copyCode}
                className="p-1.5 rounded-md hover:bg-zinc-800/50 text-zinc-500 hover:text-white transition-all cursor-pointer"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User info & Sign out */}
      <div className="px-4 pb-4 border-t border-[#172036] pt-4">
        <div className="mb-3 px-1">
          <p className="text-sm font-medium text-white truncate">
            {profile.full_name}
          </p>
          <p className="text-xs text-zinc-500 capitalize">{profile.role}</p>
          {profile.institution && (
            <p className="text-xs text-zinc-600 truncate mt-0.5">
              {profile.institution}
            </p>
          )}
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm text-zinc-400 hover:text-rose-400 hover:bg-rose-500/8 transition-all font-medium cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-zinc-950 border border-zinc-850 text-zinc-300 backdrop-blur-lg"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-[#0e1322] border-r border-[#172036] z-40 transform transition-transform duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
