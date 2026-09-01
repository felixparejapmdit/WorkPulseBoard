"use client";

import React, { useState, useMemo } from "react";
import { 
  WorkOrder, 
  StaffUser, 
  WorkOrderStatus 
} from "@/types/work-order";
import { MOCK_STAFF } from "@/lib/mock-data";
import { WorkOrderCard } from "@/components/kds/WorkOrderCard";
import { 
  UserCheck, 
  Users, 
  CheckSquare, 
  X
} from "lucide-react";

interface StaffDashboardProps {
  workOrders: WorkOrder[];
  currentUser: StaffUser;
  onClaim: (orderId: string) => Promise<void>;
  onStatusChange: (orderId: string, status: WorkOrderStatus) => Promise<void>;
  onToggleMaterial: (orderId: string, index: number) => Promise<void>;
  onUpdateDate: (orderId: string, isoDate: string) => Promise<void>;
  onUpdateAssignees: (orderId: string, ids: string[]) => Promise<void>;
  onUpdateSupervisor: (orderId: string, supervisorId: string | null) => Promise<void>;
}

export function StaffDashboard({
  workOrders,
  currentUser,
  onClaim,
  onStatusChange,
  onToggleMaterial,
  onUpdateDate,
  onUpdateAssignees,
  onUpdateSupervisor,
}: StaffDashboardProps) {
  const [roleFilter, setRoleFilter] = useState<"ALL" | "SUPERVISED" | "ASSIGNED">("ALL");
  const [editingAssigneesOrderId, setEditingAssigneesOrderId] = useState<string | null>(null);

  // Personalized filter
  const myOrders = useMemo(() => {
    return workOrders.filter((order) => {
      const isSupervisor = order.supervisorId === currentUser.id;
      const isAssignedWorker = order.assignedWorkerIds.includes(currentUser.id);

      if (roleFilter === "SUPERVISED") return isSupervisor;
      if (roleFilter === "ASSIGNED") return isAssignedWorker;
      return isSupervisor || isAssignedWorker;
    });
  }, [workOrders, currentUser.id, roleFilter]);

  const supervisedCount = workOrders.filter((w) => w.supervisorId === currentUser.id).length;
  const assignedWorkerCount = workOrders.filter((w) => w.assignedWorkerIds.includes(currentUser.id)).length;
  const pendingActionCount = myOrders.filter((w) => w.status !== "COMPLETED").length;
  const completedCount = myOrders.filter((w) => w.status === "COMPLETED").length;

  const currentEditingOrder = workOrders.find((w) => w.id === editingAssigneesOrderId);

  return (
    <div className="w-full space-y-6">
      {/* Personalized Header Banner */}
      <div className="bg-gradient-to-r from-white via-emerald-50 to-white dark:from-slate-900 dark:via-emerald-950/40 dark:to-slate-900 border border-emerald-200 dark:border-emerald-500/30 rounded-2xl p-5 shadow-sm dark:shadow-2xl transition-colors">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white text-xl font-bold shadow-md ring-2 ring-emerald-400/30">
              {currentUser.avatar}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {currentUser.name}
                </h2>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                    currentUser.role === "SUPERVISOR"
                      ? "bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/40"
                      : "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/40"
                  }`}
                >
                  {currentUser.role === "SUPERVISOR" ? "Supervisor" : "Worker"}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-medium">
                {currentUser.specialty || "Team Member"} • {currentUser.email}
              </p>
              <div className="flex items-center gap-3 mt-2 text-xs text-slate-600 dark:text-slate-300 font-mono">
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Showing {myOrders.length} active jobs assigned to you
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3">
            <div className="bg-white/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-center shadow-sm">
              <span className="block text-slate-500 dark:text-slate-400 text-[10px] uppercase font-semibold">
                Supervising
              </span>
              <span className="text-lg font-bold font-mono text-purple-600 dark:text-purple-400">
                {supervisedCount}
              </span>
            </div>
            <div className="bg-white/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-center shadow-sm">
              <span className="block text-slate-500 dark:text-slate-400 text-[10px] uppercase font-semibold">
                Assigned
              </span>
              <span className="text-lg font-bold font-mono text-blue-600 dark:text-blue-400">
                {assignedWorkerCount}
              </span>
            </div>
            <div className="bg-white/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-center shadow-sm">
              <span className="block text-slate-500 dark:text-slate-400 text-[10px] uppercase font-semibold">
                To Do
              </span>
              <span className="text-lg font-bold font-mono text-amber-600 dark:text-amber-400">
                {pendingActionCount}
              </span>
            </div>
            <div className="bg-white/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-center shadow-sm">
              <span className="block text-slate-500 dark:text-slate-400 text-[10px] uppercase font-semibold">
                Done
              </span>
              <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {completedCount}
              </span>
            </div>
          </div>
        </div>

        {/* Filter sub-tabs */}
        <div className="flex items-center gap-2 mt-5 pt-4 border-t border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-500 dark:text-slate-400 mr-2 font-medium">Show:</span>
          <button
            id="filter-all-btn"
            onClick={() => setRoleFilter("ALL")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
              roleFilter === "ALL"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800"
            }`}
          >
            All My Jobs ({myOrders.length})
          </button>
          <button
            id="filter-supervised-btn"
            onClick={() => setRoleFilter("SUPERVISED")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
              roleFilter === "SUPERVISED"
                ? "bg-purple-600 text-white shadow-sm"
                : "bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800"
            }`}
          >
            As Supervisor ({supervisedCount})
          </button>
          <button
            id="filter-assigned-btn"
            onClick={() => setRoleFilter("ASSIGNED")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
              roleFilter === "ASSIGNED"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800"
            }`}
          >
            As Worker ({assignedWorkerCount})
          </button>
        </div>
      </div>

      {/* Grid of My Orders */}
      {myOrders.length === 0 ? (
        <div className="bg-white dark:bg-[#0f172a]/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-16 text-center text-slate-500 dark:text-slate-400 space-y-3 shadow-sm">
          <UserCheck className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto opacity-40" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-200">No jobs assigned right now</h3>
          <p className="text-xs max-w-md mx-auto text-slate-500 dark:text-slate-400">
            {currentUser.name} has no active jobs matching this filter. Switch the active user at the top or create a new job.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {myOrders.map((order) => (
            <div key={order.id} className="flex flex-col gap-2">
              <WorkOrderCard
                order={order}
                currentUser={currentUser}
                onClaim={onClaim}
                onStatusChange={onStatusChange}
                onToggleMaterial={onToggleMaterial}
                onUpdateDate={onUpdateDate}
                onUpdateAssignees={onUpdateAssignees}
                isStaffView={true}
              />

              {/* Workers Panel */}
              <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/90 rounded-xl p-3 text-xs space-y-2 shadow-sm transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-blue-500" />
                    <span>Assigned Workers</span>
                  </span>
                  <button
                    id={`manage-crew-btn-${order.id}`}
                    onClick={() => setEditingAssigneesOrderId(order.id)}
                    className="text-blue-600 dark:text-blue-400 hover:underline font-semibold text-[11px]"
                  >
                    Change Workers
                  </button>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {order.assignedWorkerIds.length === 0 ? (
                    <span className="text-slate-400 dark:text-slate-500 italic text-[11px]">No workers assigned yet</span>
                  ) : (
                    order.assignedWorkerIds.map((wId) => {
                      const staff = MOCK_STAFF.find((s) => s.id === wId);
                      if (!staff) return null;
                      return (
                        <span
                          key={wId}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-[11px]"
                        >
                          <span className="w-3.5 h-3.5 rounded-full bg-blue-600 text-[9px] font-bold flex items-center justify-center text-white">
                            {staff.avatar}
                          </span>
                          <span>{staff.name}</span>
                        </span>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Crew Assignment Modal */}
      {editingAssigneesOrderId && currentEditingOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Assign Team Members</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{currentEditingOrder.id} • {currentEditingOrder.title}</p>
              </div>
              <button
                onClick={() => setEditingAssigneesOrderId(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {MOCK_STAFF.map((staff) => {
                const isSelected = currentEditingOrder.assignedWorkerIds.includes(staff.id);
                return (
                  <div
                    key={staff.id}
                    onClick={() => {
                      const nextIds = isSelected
                        ? currentEditingOrder.assignedWorkerIds.filter((id) => id !== staff.id)
                        : [...currentEditingOrder.assignedWorkerIds, staff.id];
                      onUpdateAssignees(currentEditingOrder.id, nextIds);
                    }}
                    className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-500/60 text-blue-900 dark:text-white"
                        : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-white">
                        {staff.avatar}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">{staff.name}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{staff.role} • {staff.specialty}</p>
                      </div>
                    </div>
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <div className="w-4 h-4 rounded border border-slate-300 dark:border-slate-600" />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setEditingAssigneesOrderId(null)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
