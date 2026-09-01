"use client";

import React, { useState, useEffect } from "react";
import { useWorkOrders } from "@/hooks/useWorkOrders";
import { GeneralBoard } from "@/components/kds/GeneralBoard";
import { StaffDashboard } from "@/components/kds/StaffDashboard";
import { Navbar } from "@/components/kds/Navbar";
import { CreateWorkOrderModal } from "@/components/kds/CreateWorkOrderModal";
import { StaffUser } from "@/types/work-order";
import { MOCK_STAFF } from "@/lib/mock-data";
import { CheckCircle2, AlertTriangle, X, ShieldAlert, Sparkles, Trash2, DownloadCloud } from "lucide-react";
import confetti from "canvas-confetti";

interface Toast {
  id: string;
  type: "success" | "warning" | "error" | "info";
  title: string;
  message: string;
}

export default function WorkPulseDashboardPage() {
  const {
    workOrders,
    isLoading,
    error,
    lastSyncTime,
    isOnline,
    isEncrypted,
    claimWorkOrder,
    updateStatus,
    toggleMaterial,
    updateAssignees,
    updateSupervisor,
    updateEstimatedDate,
    createWorkOrder,
    loadSampleData,
    clearAllOrders,
    simulateRaceCondition,
  } = useWorkOrders();

  const [currentView, setCurrentView] = useState<"general" | "staff">("general");
  const [currentUser, setCurrentUser] = useState<StaffUser>(MOCK_STAFF[0]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // Load and apply theme
  useEffect(() => {
    try {
      const savedTheme = window.localStorage.getItem("workpulse_theme") as "dark" | "light" | null;
      const initialTheme = savedTheme || "dark";
      setTheme(initialTheme);
      if (initialTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } catch {}
  }, []);

  const handleToggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    try {
      window.localStorage.setItem("workpulse_theme", nextTheme);
      if (nextTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } catch {}
  };

  // Sound generator helper
  const playChime = (type: "success" | "alert" | "error") => {
    try {
      if (typeof window === "undefined") return;
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "success") {
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.25);
      } else if (type === "alert") {
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
      } else if (type === "error") {
        osc.frequency.setValueAtTime(320, ctx.currentTime);
        osc.frequency.setValueAtTime(220, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch {}
  };

  const addToast = (toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  // Claim Order handler
  const handleClaim = async (orderId: string) => {
    const result = await claimWorkOrder(orderId, {
      userId: currentUser.id,
      name: currentUser.name,
    });

    if (result.success) {
      playChime("success");
      addToast({
        type: "success",
        title: "You Claimed This Job!",
        message: `${currentUser.name} is now working on ${orderId}.`,
      });
      try {
        confetti({
          particleCount: 30,
          spread: 60,
          origin: { y: 0.8 },
          colors: ["#3b82f6", "#10b981"],
        });
      } catch (e) {}
    } else {
      playChime("error");
      addToast({
        type: "error",
        title: "Someone Else Claimed It First",
        message: result.error || "This job was already claimed by another team member. Your board has been updated.",
      });
    }
  };

  // Status transition handler
  const handleStatusChange = async (orderId: string, newStatus: any) => {
    await updateStatus(orderId, newStatus);
    playChime("alert");
    const label =
      newStatus === "IN_PROGRESS"
        ? "In Progress"
        : newStatus === "QC_REVIEW"
        ? "Needs Review"
        : newStatus === "COMPLETED"
        ? "Finished"
        : "New";
    addToast({
      type: "info",
      title: "Job Moved",
      message: `Order ${orderId} moved to "${label}".`,
    });
  };

  // Create work order
  const handleCreateOrder = async (orderData: any) => {
    const created = await createWorkOrder(orderData);
    playChime("alert");
    addToast({
      type: "success",
      title: "New Job Added",
      message: `Posted ${created.id}: "${created.title}" to the board.`,
    });
  };

  // Load sample data button action
  const handleLoadSampleData = () => {
    loadSampleData();
    playChime("success");
    addToast({
      type: "success",
      title: "Sample Data Loaded",
      message: "Loaded 6 sample jobs so you can test the board.",
    });
  };

  // Start empty button action
  const handleStartEmpty = () => {
    clearAllOrders();
    playChime("alert");
    addToast({
      type: "info",
      title: "Board Cleared",
      message: "Board is now empty. Click '+ New Job' to create jobs or 'Load Sample Data' anytime.",
    });
  };

  // Simulate collision
  const handleSimulateCollision = async () => {
    const pending = workOrders.find((w) => w.status === "PENDING_ACK");
    if (!pending) {
      addToast({
        type: "warning",
        title: "No New Jobs Waiting",
        message: "Create a new job first or load sample data to test duplicate claims.",
      });
      return;
    }

    const rivalUser = MOCK_STAFF.find((s) => s.id !== currentUser.id) || MOCK_STAFF[1];

    await simulateRaceCondition(pending.id, {
      userId: rivalUser.id,
      name: rivalUser.name,
    });

    const result = await claimWorkOrder(pending.id, {
      userId: currentUser.id,
      name: currentUser.name,
    });

    if (!result.success) {
      playChime("error");
      addToast({
        type: "error",
        title: "Duplicate Claim Prevented!",
        message: `Both you and ${rivalUser.name} clicked at once. ${rivalUser.name} got it first, so your board updated safely.`,
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070b14] text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      {/* Top Navbar */}
      <Navbar
        currentView={currentView}
        onViewChange={setCurrentView}
        currentUser={currentUser}
        onUserChange={setCurrentUser}
        workOrders={workOrders}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        onLoadSampleData={handleLoadSampleData}
        onStartEmpty={handleStartEmpty}
        onSimulateCollision={handleSimulateCollision}
        lastSyncTime={lastSyncTime}
        isOnline={isOnline}
        isEncrypted={isEncrypted}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-[1920px] w-full mx-auto p-4 md:p-6">
        {isLoading ? (
          <div className="py-24 text-center space-y-4">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-semibold text-slate-500 tracking-wider">
              LOADING WORKPULSE BOARD...
            </p>
          </div>
        ) : currentView === "general" ? (
          <GeneralBoard
            workOrders={workOrders}
            currentUser={currentUser}
            onClaim={handleClaim}
            onStatusChange={handleStatusChange}
            onToggleMaterial={toggleMaterial}
            onUpdateDate={updateEstimatedDate}
            onUpdateAssignees={updateAssignees}
          />
        ) : (
          <StaffDashboard
            workOrders={workOrders}
            currentUser={currentUser}
            onClaim={handleClaim}
            onStatusChange={handleStatusChange}
            onToggleMaterial={toggleMaterial}
            onUpdateDate={updateEstimatedDate}
            onUpdateAssignees={updateAssignees}
            onUpdateSupervisor={updateSupervisor}
          />
        )}
      </main>

      {/* Create Work Order Modal */}
      <CreateWorkOrderModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateOrder}
        currentUser={currentUser}
      />

      {/* Toast Notification Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-3.5 rounded-2xl border shadow-xl backdrop-blur-md transition-all duration-300 flex items-start justify-between gap-3 animate-in slide-in-from-bottom-3 ${
              toast.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-950/90 border-emerald-200 dark:border-emerald-500/50 text-emerald-900 dark:text-emerald-100"
                : toast.type === "error"
                ? "bg-rose-50 dark:bg-rose-950/90 border-rose-200 dark:border-rose-500/50 text-rose-900 dark:text-rose-100"
                : toast.type === "warning"
                ? "bg-amber-50 dark:bg-amber-950/90 border-amber-200 dark:border-amber-500/50 text-amber-900 dark:text-amber-100"
                : "bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
            }`}
          >
            <div className="flex items-start gap-2.5">
              {toast.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />}
              {toast.type === "error" && <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />}
              {toast.type === "warning" && <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />}
              {toast.type === "info" && <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />}
              <div>
                <h4 className="text-xs font-bold tracking-tight">{toast.title}</h4>
                <p className="text-[11px] opacity-90 mt-0.5 leading-relaxed">{toast.message}</p>
              </div>
            </div>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
