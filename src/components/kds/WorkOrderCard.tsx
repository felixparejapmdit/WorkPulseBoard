"use client";

import React, { useState, useEffect } from "react";
import { 
  WorkOrder, 
  StaffUser, 
  UrgencyLevel, 
  WorkOrderStatus 
} from "@/types/work-order";
import { MOCK_STAFF } from "@/lib/mock-data";
import { 
  Clock, 
  CheckSquare, 
  Square, 
  User, 
  Users, 
  Calendar, 
  ShieldCheck, 
  Zap, 
  Building2, 
  Flame,
  ArrowRight,
  CheckCircle2
} from "lucide-react";

interface WorkOrderCardProps {
  order: WorkOrder;
  currentUser: StaffUser;
  onClaim: (orderId: string) => Promise<void>;
  onStatusChange: (orderId: string, status: WorkOrderStatus) => Promise<void>;
  onToggleMaterial?: (orderId: string, index: number) => Promise<void>;
  onUpdateDate?: (orderId: string, isoDate: string) => Promise<void>;
  onUpdateAssignees?: (orderId: string, ids: string[]) => Promise<void>;
  isStaffView?: boolean;
}

export function WorkOrderCard({
  order,
  currentUser,
  onClaim,
  onStatusChange,
  onToggleMaterial,
  onUpdateDate,
  onUpdateAssignees,
  isStaffView = false,
}: WorkOrderCardProps) {
  const [elapsedMinutes, setElapsedMinutes] = useState<number>(0);
  const [elapsedSecondsFormatted, setElapsedSecondsFormatted] = useState<string>("00:00");
  const [isClaiming, setIsClaiming] = useState<boolean>(false);
  const [isEditingDate, setIsEditingDate] = useState<boolean>(false);
  const [dateInput, setDateInput] = useState<string>(
    order.estimatedCompletionDate ? new Date(order.estimatedCompletionDate).toISOString().slice(0, 16) : ""
  );

  // Live Timer
  useEffect(() => {
    const updateElapsed = () => {
      const created = new Date(order.createdAt).getTime();
      const diffMs = Math.max(0, Date.now() - created);
      const totalSecs = Math.floor(diffMs / 1000);
      const mins = Math.floor(totalSecs / 60);
      const secs = totalSecs % 60;
      setElapsedMinutes(mins);
      setElapsedSecondsFormatted(
        `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
      );
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [order.createdAt]);

  const slaTarget = order.slaMinutes || 30;
  let urgency: UrgencyLevel = "NORMAL";
  if (order.status !== "COMPLETED") {
    if (elapsedMinutes >= slaTarget || elapsedMinutes >= 30) {
      urgency = "BREACHED";
    } else if (elapsedMinutes >= 15) {
      urgency = "APPROACHING";
    }
  }

  const handleClaimClick = async () => {
    setIsClaiming(true);
    try {
      await onClaim(order.id);
    } finally {
      setIsClaiming(false);
    }
  };

  const totalMaterials = order.materialsCheck.length;
  const readyMaterials = order.materialsCheck.filter((m) => m.ready).length;
  const materialsPercent = totalMaterials > 0 ? Math.round((readyMaterials / totalMaterials) * 100) : 100;

  const supervisor = MOCK_STAFF.find((s) => s.id === order.supervisorId);
  const assignedStaff = MOCK_STAFF.filter((s) => order.assignedWorkerIds.includes(s.id));

  // Style classes for Light & Dark mode
  const getCardClasses = () => {
    if (order.status === "COMPLETED") {
      return "border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/50 dark:bg-slate-900/60";
    }
    if (urgency === "BREACHED") {
      return "border-rose-300 dark:border-rose-500/80 bg-rose-50/70 dark:bg-rose-950/20 shadow-md shadow-rose-500/10 dark:shadow-rose-950/40 animate-glow-red";
    }
    if (urgency === "APPROACHING") {
      return "border-amber-300 dark:border-amber-500/60 bg-amber-50/70 dark:bg-amber-950/15 shadow-sm shadow-amber-500/10 dark:shadow-amber-950/30";
    }
    return "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-sm hover:shadow-md";
  };

  return (
    <div
      id={`order-card-${order.id}`}
      className={`rounded-2xl border transition-all duration-300 p-4 relative flex flex-col justify-between gap-3 text-slate-800 dark:text-slate-200 ${getCardClasses()}`}
    >
      {/* Top row: ID, Urgency / Priority & Timer */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
              {order.id}
            </span>
            {order.priority && (
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                  order.priority === "CRITICAL"
                    ? "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/40"
                    : order.priority === "HIGH"
                    ? "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/40"
                    : order.priority === "MEDIUM"
                    ? "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/40"
                    : "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700/50 dark:text-slate-300 dark:border-slate-600"
                }`}
              >
                {order.priority === "CRITICAL" ? "Urgent" : order.priority === "HIGH" ? "High" : order.priority === "MEDIUM" ? "Normal" : "Low"}
              </span>
            )}
            {order.station && (
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate max-w-[140px]">
                {order.station}
              </span>
            )}
          </div>

          {/* Simple Urgency Timer */}
          <div
            id={`timer-${order.id}`}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-colors ${
              order.status === "COMPLETED"
                ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30"
                : urgency === "BREACHED"
                ? "bg-rose-600 text-white border-rose-500 shadow-md animate-pulse"
                : urgency === "APPROACHING"
                ? "bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-500/40"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-emerald-400 border-slate-200 dark:border-slate-700"
            }`}
          >
            {urgency === "BREACHED" ? (
              <Flame className="w-3.5 h-3.5 text-yellow-300" />
            ) : (
              <Clock className="w-3.5 h-3.5" />
            )}
            <span>{elapsedSecondsFormatted}</span>
            {urgency === "BREACHED" && (
              <span className="text-[9px] uppercase tracking-wider ml-0.5 font-sans font-bold">
                Late
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug tracking-tight">
          {order.title}
        </h3>

        {/* Customer Details */}
        <div className="mt-1.5 flex items-start gap-1.5 text-xs bg-slate-50 dark:bg-slate-950/50 p-2 rounded-xl border border-slate-200 dark:border-slate-800/80">
          <Building2 className="w-3.5 h-3.5 mt-0.5 text-slate-400 shrink-0" />
          <div className="min-w-0">
            <p className="font-semibold text-slate-800 dark:text-slate-300 truncate">
              {order.clientDetails.name}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {order.clientDetails.contact}
            </p>
          </div>
        </div>

        {order.description && (
          <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {order.description}
          </p>
        )}
      </div>

      {/* Items & Tools Needed */}
      <div className="bg-slate-50 dark:bg-slate-950/60 rounded-xl p-2.5 border border-slate-200 dark:border-slate-800/80">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <CheckSquare className="w-3.5 h-3.5 text-blue-500" />
            <span>Items & Tools Needed</span>
          </span>
          <span className={`text-[11px] font-mono font-semibold ${readyMaterials === totalMaterials ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
            {readyMaterials}/{totalMaterials} ready
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mb-2">
          <div
            className={`h-full transition-all duration-300 rounded-full ${
              readyMaterials === totalMaterials ? "bg-emerald-500" : "bg-blue-500"
            }`}
            style={{ width: `${materialsPercent}%` }}
          />
        </div>

        {/* Checklist */}
        <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
          {order.materialsCheck.map((mat, idx) => (
            <div
              key={idx}
              onClick={() => onToggleMaterial && onToggleMaterial(order.id, idx)}
              className={`flex items-center gap-2 text-xs py-0.5 px-1.5 rounded cursor-pointer transition-colors ${
                mat.ready
                  ? "text-slate-400 dark:text-slate-500 line-through bg-slate-100/60 dark:bg-slate-900/30"
                  : "text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60"
              }`}
            >
              {mat.ready ? (
                <CheckSquare className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              ) : (
                <Square className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              )}
              <span className="truncate">{mat.item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Claim Button / Ownership Badge */}
      <div className="space-y-2 text-xs">
        {order.acknowledgedBy ? (
          <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/30 rounded-xl px-2.5 py-1.5">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                {order.acknowledgedBy.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="truncate">
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold block uppercase">
                  Taken By
                </span>
                <span className="text-slate-900 dark:text-slate-200 font-bold truncate">
                  {order.acknowledgedBy.name}
                </span>
              </div>
            </div>
            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 shrink-0">
              {new Date(order.acknowledgedBy.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        ) : (
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/30 rounded-xl p-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              <span className="text-xs text-amber-800 dark:text-amber-300 font-semibold">
                Waiting for someone
              </span>
            </div>
            <button
              id={`claim-btn-${order.id}`}
              onClick={handleClaimClick}
              disabled={isClaiming}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-sm transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>{isClaiming ? "Claiming..." : "Take This Job"}</span>
            </button>
          </div>
        )}

        {/* Supervisor & Assigned Workers */}
        <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5 truncate">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-500 shrink-0" />
            <span className="truncate">
              Lead: <strong className="text-slate-700 dark:text-slate-300">{supervisor?.name.split(" ")[0] || "None"}</strong>
            </span>
          </div>

          <div className="flex items-center gap-1 truncate">
            <Users className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span className="truncate">
              {assignedStaff.length > 0 ? (
                <span>{assignedStaff.map((s) => s.name.split(" ")[0]).join(", ")}</span>
              ) : (
                <span className="text-slate-400 italic">No workers</span>
              )}
            </span>
          </div>
        </div>

        {/* Target Finish Time */}
        <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950/40 p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px]">
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Target Finish:</span>
            {isEditingDate ? (
              <input
                type="datetime-local"
                value={dateInput}
                onChange={(e) => setDateInput(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded px-1.5 py-0.5 text-[11px]"
              />
            ) : (
              <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                {order.estimatedCompletionDate
                  ? new Date(order.estimatedCompletionDate).toLocaleDateString([], {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "Not set"}
              </span>
            )}
          </div>

          {isStaffView && onUpdateDate && (
            <div>
              {isEditingDate ? (
                <button
                  onClick={async () => {
                    if (dateInput) {
                      await onUpdateDate(order.id, new Date(dateInput).toISOString());
                    }
                    setIsEditingDate(false);
                  }}
                  className="px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium text-[10px]"
                >
                  Save
                </button>
              ) : (
                <button
                  onClick={() => setIsEditingDate(true)}
                  className="text-blue-600 dark:text-blue-400 hover:underline text-[10px] font-medium"
                >
                  Edit
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action / Next Stage Button */}
      <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
          Status:{" "}
          <strong
            className={
              order.status === "PENDING_ACK"
                ? "text-amber-600 dark:text-amber-400"
                : order.status === "IN_PROGRESS"
                ? "text-blue-600 dark:text-blue-400"
                : order.status === "QC_REVIEW"
                ? "text-purple-600 dark:text-purple-400"
                : "text-emerald-600 dark:text-emerald-400"
            }
          >
            {order.status === "PENDING_ACK" ? "New" : order.status === "IN_PROGRESS" ? "In Progress" : order.status === "QC_REVIEW" ? "Needs Review" : "Done"}
          </strong>
        </span>

        {/* Workflow Progression Buttons */}
        <div className="flex items-center gap-1.5">
          {order.status === "PENDING_ACK" && (
            <button
              onClick={() => onStatusChange(order.id, "IN_PROGRESS")}
              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white dark:bg-blue-600/30 dark:hover:bg-blue-600 dark:text-blue-300 dark:hover:text-white border border-blue-200 dark:border-blue-500/40 transition-colors"
            >
              <span>Start Job</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}

          {order.status === "IN_PROGRESS" && (
            <button
              onClick={() => onStatusChange(order.id, "QC_REVIEW")}
              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-600 text-purple-700 hover:text-white dark:bg-purple-600/30 dark:hover:bg-purple-600 dark:text-purple-300 dark:hover:text-white border border-purple-200 dark:border-purple-500/40 transition-colors"
            >
              <span>Send for Review</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}

          {order.status === "QC_REVIEW" && (
            <button
              onClick={() => onStatusChange(order.id, "COMPLETED")}
              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white dark:bg-emerald-600/30 dark:hover:bg-emerald-600 dark:text-emerald-300 dark:hover:text-white border border-emerald-200 dark:border-emerald-500/40 transition-colors"
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>Approve & Finish</span>
            </button>
          )}

          {order.status === "COMPLETED" && (
            <span className="flex items-center gap-1 text-[11px] font-mono font-semibold text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30">
              <CheckCircle2 className="w-3 h-3" />
              <span>Completed</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
