"use client";

import React, { useState, useEffect } from "react";
import { 
  Layers, 
  UserCheck, 
  Plus, 
  RotateCcw, 
  Zap, 
  Maximize2, 
  Minimize2, 
  ShieldAlert,
  Clock,
  Sun,
  Moon,
  Trash2,
  DownloadCloud,
  Lock,
  Sparkles
} from "lucide-react";
import { StaffUser, WorkOrder } from "@/types/work-order";
import { MOCK_STAFF } from "@/lib/mock-data";

interface NavbarProps {
  currentView: "general" | "staff";
  onViewChange: (view: "general" | "staff") => void;
  currentUser: StaffUser;
  onUserChange: (user: StaffUser) => void;
  workOrders: WorkOrder[];
  onOpenCreateModal: () => void;
  onLoadSampleData: () => void;
  onStartEmpty: () => void;
  onSimulateCollision: () => void;
  lastSyncTime: Date;
  isOnline: boolean;
  isEncrypted: boolean;
  theme: "dark" | "light";
  onToggleTheme: () => void;
}

export function Navbar({
  currentView,
  onViewChange,
  currentUser,
  onUserChange,
  workOrders,
  onOpenCreateModal,
  onLoadSampleData,
  onStartEmpty,
  onSimulateCollision,
  lastSyncTime,
  isOnline,
  isEncrypted,
  theme,
  onToggleTheme,
}: NavbarProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [timeStr, setTimeStr] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setTimeStr(d.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Simple counts
  const pendingCount = workOrders.filter((w) => w.status === "PENDING_ACK").length;
  const inProgressCount = workOrders.filter((w) => w.status === "IN_PROGRESS").length;
  const qcCount = workOrders.filter((w) => w.status === "QC_REVIEW").length;
  const completedCount = workOrders.filter((w) => w.status === "COMPLETED").length;

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0c1322]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white px-4 py-3 shadow-md transition-colors">
      <div className="max-w-[1920px] mx-auto flex flex-wrap items-center justify-between gap-4">
        
        {/* Brand & Privacy Status */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center shadow-md shadow-blue-500/20 text-white">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                WorkPulse
              </h1>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20">
                Team Dashboard
              </span>
              {/* Privacy Encryption Badge */}
              <span 
                title="Customer details and notes are encrypted on your device using AES-GCM 256-bit encryption"
                className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30"
              >
                <Lock className="w-2.5 h-2.5" />
                <span>Encrypted</span>
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5 font-medium">
                <span className={`w-2 h-2 rounded-full ${isOnline ? "bg-emerald-500 animate-ping" : "bg-amber-500"}`} />
                <span className={isOnline ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}>
                  {isOnline ? "Live Sync Active" : "Connecting..."}
                </span>
              </span>
              <span>•</span>
              <span className="font-mono text-[11px]">
                Updated {lastSyncTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
            </div>
          </div>
        </div>

        {/* View Switcher: Team Board vs My Assigned Jobs */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-inner">
          <button
            id="view-general-btn"
            onClick={() => onViewChange("general")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
              currentView === "general"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Team Board</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-black/20 text-white font-mono">
              {workOrders.length}
            </span>
          </button>

          <button
            id="view-staff-btn"
            onClick={() => onViewChange("staff")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
              currentView === "staff"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>My Assigned Jobs</span>
          </button>
        </div>

        {/* Simple Status Counters */}
        <div className="hidden xl:flex items-center gap-2 bg-slate-100 dark:bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-mono">
          <div className="flex items-center gap-1.5 px-2">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-slate-600 dark:text-slate-400">New:</span>
            <span className="font-bold text-amber-600 dark:text-amber-400">{pendingCount}</span>
          </div>
          <div className="h-3 w-px bg-slate-300 dark:bg-slate-700" />
          <div className="flex items-center gap-1.5 px-2">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-slate-600 dark:text-slate-400">In Progress:</span>
            <span className="font-bold text-blue-600 dark:text-blue-400">{inProgressCount}</span>
          </div>
          <div className="h-3 w-px bg-slate-300 dark:bg-slate-700" />
          <div className="flex items-center gap-1.5 px-2">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            <span className="text-slate-600 dark:text-slate-400">Review:</span>
            <span className="font-bold text-purple-600 dark:text-purple-400">{qcCount}</span>
          </div>
          <div className="h-3 w-px bg-slate-300 dark:bg-slate-700" />
          <div className="flex items-center gap-1.5 px-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-slate-600 dark:text-slate-400">Done:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">{completedCount}</span>
          </div>
        </div>

        {/* Actions & Person Switcher */}
        <div className="flex items-center gap-2.5 flex-wrap">
          
          {/* User selector */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">User:</span>
            <select
              id="active-user-select"
              value={currentUser.id}
              onChange={(e) => {
                const found = MOCK_STAFF.find((s) => s.id === e.target.value);
                if (found) onUserChange(found);
              }}
              className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer border-none"
            >
              {MOCK_STAFF.map((staff) => (
                <option key={staff.id} value={staff.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                  {staff.name}
                </option>
              ))}
            </select>
          </div>

          {/* New Work Order Button */}
          <button
            id="create-wo-btn"
            onClick={onOpenCreateModal}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Job</span>
          </button>

          {/* Load Sample Data Button */}
          <button
            id="load-sample-btn"
            onClick={onLoadSampleData}
            title="Load sample jobs to test the dashboard"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium transition-all"
          >
            <DownloadCloud className="w-3.5 h-3.5 text-blue-500" />
            <span className="hidden sm:inline">Load Sample Data</span>
          </button>

          {/* Start Empty Button */}
          <button
            id="start-empty-btn"
            onClick={onStartEmpty}
            title="Clear all jobs and start with a blank board"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium transition-all"
          >
            <Trash2 className="w-3.5 h-3.5 text-slate-500 hover:text-rose-500" />
            <span className="hidden sm:inline">Start Empty</span>
          </button>

          {/* Simulate Collision Button */}
          <button
            id="simulate-collision-btn"
            onClick={onSimulateCollision}
            title="Test what happens if two people try to claim the same job at the same time"
            className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-300 text-xs font-medium transition-all"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
            <span>Test Duplicate Claim</span>
          </button>

          {/* Light / Dark Mode Toggle */}
          <button
            id="theme-toggle-btn"
            onClick={onToggleTheme}
            title={theme === "dark" ? "Switch to Light Theme" : "Switch to Dark Theme"}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 transition-all"
          >
            {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            title="Full Screen Display"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 transition-all"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Clock */}
          <div className="hidden md:flex items-center gap-1 font-mono text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
            <Clock className="w-3.5 h-3.5 text-blue-500" />
            <span>{timeStr || "00:00:00"}</span>
          </div>

        </div>
      </div>
    </header>
  );
}
