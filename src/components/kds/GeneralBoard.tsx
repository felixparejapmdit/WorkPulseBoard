"use client";

import React, { useState, useMemo } from "react";
import { 
  WorkOrder, 
  StaffUser, 
  WorkOrderStatus, 
  ColumnConfig 
} from "@/types/work-order";
import { WorkOrderCard } from "@/components/kds/WorkOrderCard";
import { 
  Search, 
  Filter, 
  Layers, 
  Flame 
} from "lucide-react";

interface GeneralBoardProps {
  workOrders: WorkOrder[];
  currentUser: StaffUser;
  onClaim: (orderId: string) => Promise<void>;
  onStatusChange: (orderId: string, status: WorkOrderStatus) => Promise<void>;
  onToggleMaterial: (orderId: string, index: number) => Promise<void>;
  onUpdateDate: (orderId: string, isoDate: string) => Promise<void>;
  onUpdateAssignees: (orderId: string, ids: string[]) => Promise<void>;
}

const COLUMNS: ColumnConfig[] = [
  {
    status: "PENDING_ACK",
    title: "New Orders",
    subtitle: "Waiting for someone to take the job",
    accentColor: "border-amber-500/50 text-amber-500",
    bgGradient: "from-amber-500/10 to-transparent dark:from-amber-500/10",
    badgeBg: "bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-500/40",
  },
  {
    status: "IN_PROGRESS",
    title: "In Progress",
    subtitle: "Currently being worked on",
    accentColor: "border-blue-500/50 text-blue-500",
    bgGradient: "from-blue-500/10 to-transparent dark:from-blue-500/10",
    badgeBg: "bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-500/40",
  },
  {
    status: "QC_REVIEW",
    title: "Needs Review",
    subtitle: "Waiting for supervisor check",
    accentColor: "border-purple-500/50 text-purple-500",
    bgGradient: "from-purple-500/10 to-transparent dark:from-purple-500/10",
    badgeBg: "bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-500/40",
  },
  {
    status: "COMPLETED",
    title: "Finished",
    subtitle: "Completed and approved",
    accentColor: "border-emerald-500/50 text-emerald-500",
    bgGradient: "from-emerald-500/10 to-transparent dark:from-emerald-500/10",
    badgeBg: "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40",
  },
];

export function GeneralBoard({
  workOrders,
  currentUser,
  onClaim,
  onStatusChange,
  onToggleMaterial,
  onUpdateDate,
  onUpdateAssignees,
}: GeneralBoardProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [onlyBreached, setOnlyBreached] = useState(false);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return workOrders.filter((order) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        order.id.toLowerCase().includes(q) ||
        order.title.toLowerCase().includes(q) ||
        order.clientDetails.name.toLowerCase().includes(q) ||
        (order.station && order.station.toLowerCase().includes(q));

      const matchesPriority =
        priorityFilter === "ALL" || order.priority === priorityFilter;

      if (onlyBreached && order.status !== "COMPLETED") {
        const elapsedMins = (Date.now() - new Date(order.createdAt).getTime()) / 60000;
        const sla = order.slaMinutes || 30;
        if (elapsedMins < sla && elapsedMins < 30) return false;
      }

      return matchesQuery && matchesPriority;
    });
  }, [workOrders, searchQuery, priorityFilter, onlyBreached]);

  // Group by status
  const ordersByStatus = useMemo(() => {
    const map: Record<WorkOrderStatus, WorkOrder[]> = {
      PENDING_ACK: [],
      IN_PROGRESS: [],
      QC_REVIEW: [],
      COMPLETED: [],
    };
    filteredOrders.forEach((o) => {
      if (map[o.status]) {
        map[o.status].push(o);
      }
    });
    return map;
  }, [filteredOrders]);

  return (
    <div className="w-full space-y-4">
      {/* Control & Search Toolbar */}
      <div className="bg-white dark:bg-[#0f172a]/90 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3 transition-colors">
        
        {/* Search Input */}
        <div className="flex items-center gap-2 flex-1 min-w-[260px] max-w-md bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white focus-within:border-blue-500 transition-colors">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            id="general-search-input"
            type="text"
            placeholder="Search by order #, customer, title, room..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-xs w-full focus:outline-none placeholder-slate-400 text-slate-900 dark:text-slate-200"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              Clear
            </button>
          )}
        </div>

        {/* Priority and Late filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-600 dark:text-slate-400">Urgency:</span>
            <select
              id="priority-filter-select"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">All Jobs</option>
              <option value="CRITICAL" className="bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400">Urgent</option>
              <option value="HIGH" className="bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400">High</option>
              <option value="MEDIUM" className="bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400">Normal</option>
              <option value="LOW" className="bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400">Low</option>
            </select>
          </div>

          <button
            id="toggle-breached-btn"
            onClick={() => setOnlyBreached(!onlyBreached)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
              onlyBreached
                ? "bg-rose-600 text-white border-rose-500 shadow-sm font-semibold"
                : "bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-rose-500" />
            <span>Late Jobs Only</span>
          </button>
        </div>
      </div>

      {/* Kanban Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
        {COLUMNS.map((col) => {
          const columnOrders = ordersByStatus[col.status] || [];
          return (
            <div
              key={col.status}
              id={`column-${col.status}`}
              className="bg-slate-100/80 dark:bg-[#0d1527]/80 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col min-h-[720px] overflow-hidden transition-colors"
            >
              {/* Column Header */}
              <div className={`p-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-b ${col.bgGradient}`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-current" />
                    <h2 className="font-bold text-sm text-slate-900 dark:text-white tracking-tight">
                      {col.title}
                    </h2>
                  </div>
                  <span
                    className={`font-mono text-xs font-bold px-2.5 py-0.5 rounded-full border ${col.badgeBg}`}
                  >
                    {columnOrders.length}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">{col.subtitle}</p>
              </div>

              {/* Column Cards */}
              <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[calc(100vh-210px)]">
                {columnOrders.length === 0 ? (
                  <div className="py-20 text-center text-slate-400 dark:text-slate-500 flex flex-col items-center justify-center gap-2">
                    <Layers className="w-8 h-8 opacity-30" />
                    <p className="text-xs font-medium">No jobs in this column</p>
                  </div>
                ) : (
                  columnOrders.map((order) => (
                    <WorkOrderCard
                      key={order.id}
                      order={order}
                      currentUser={currentUser}
                      onClaim={onClaim}
                      onStatusChange={onStatusChange}
                      onToggleMaterial={onToggleMaterial}
                      onUpdateDate={onUpdateDate}
                      onUpdateAssignees={onUpdateAssignees}
                      isStaffView={false}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
