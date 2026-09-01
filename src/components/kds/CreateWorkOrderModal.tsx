"use client";

import React, { useState } from "react";
import { 
  X, 
  Trash2, 
  Zap, 
  Sparkles
} from "lucide-react";
import { StaffUser, WorkOrderPriority } from "@/types/work-order";
import { MOCK_STAFF } from "@/lib/mock-data";

interface CreateWorkOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (orderData: any) => Promise<void>;
  currentUser: StaffUser;
}

export function CreateWorkOrderModal({
  isOpen,
  onClose,
  onSubmit,
  currentUser,
}: CreateWorkOrderModalProps) {
  const [title, setTitle] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientContact, setClientContact] = useState("");
  const [station, setStation] = useState("Main Floor");
  const [priority, setPriority] = useState<WorkOrderPriority>("HIGH");
  const [slaMinutes, setSlaMinutes] = useState(30);
  const [supervisorId, setSupervisorId] = useState<string>("sup-sarah");
  const [assignedWorkerIds, setAssignedWorkerIds] = useState<string[]>(["wrk-alex"]);
  const [estimatedHours, setEstimatedHours] = useState(3);
  const [materials, setMaterials] = useState<string[]>([
    "Basic Hand Tools",
    "Safety Gloves",
  ]);
  const [newMaterialItem, setNewMaterialItem] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleAddMaterial = () => {
    if (newMaterialItem.trim()) {
      setMaterials([...materials, newMaterialItem.trim()]);
      setNewMaterialItem("");
    }
  };

  const handleRemoveMaterial = (index: number) => {
    setMaterials(materials.filter((_, i) => i !== index));
  };

  const handleApplyPreset = (presetType: "VALVE" | "SOFTWARE" | "INSPECTION") => {
    if (presetType === "VALVE") {
      setTitle("Fix High-Pressure Water Valve Leak");
      setClientName("Apex Facilities Inc");
      setClientContact("John Doe (555-0199)");
      setStation("Room 4 - Water Pumps");
      setPriority("CRITICAL");
      setSlaMinutes(20);
      setMaterials(["Replacement rubber seal ring", "Wrench tool set", "Pressure meter"]);
      setDescription("Customer reported water dripping on floor. Replace the old rubber seal ring.");
    } else if (presetType === "SOFTWARE") {
      setTitle("Update Computer System Software");
      setClientName("Solaria Microgrid");
      setClientContact("Tech Support (support@solaria.io)");
      setStation("Computer Control Room");
      setPriority("HIGH");
      setSlaMinutes(45);
      setMaterials(["USB Flash Drive with update", "Connecting cable"]);
      setDescription("Screen is freezing periodically. Install the latest software update and restart.");
    } else if (presetType === "INSPECTION") {
      setTitle("Routine Monthly Equipment Check");
      setClientName("BioHealth Labs");
      setClientContact("Dr. Emily Stone (emily@biohealth.org)");
      setStation("Lab Room 2");
      setPriority("MEDIUM");
      setSlaMinutes(60);
      setMaterials(["Inspection checklist clipboard", "Flashlight", "Cleaning wipe pack"]);
      setDescription("Perform routine check on filters, clean the dust, and record meter readings.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !clientName.trim()) return;

    setIsSubmitting(true);
    try {
      const completionDate = new Date(Date.now() + estimatedHours * 60 * 60 * 1000).toISOString();
      await onSubmit({
        title: title.trim(),
        clientDetails: {
          name: clientName.trim(),
          contact: clientContact.trim() || "Customer (No phone provided)",
        },
        station,
        priority,
        slaMinutes,
        supervisorId,
        assignedWorkerIds,
        estimatedCompletionDate: completionDate,
        materialsCheck: materials.map((item) => ({ item, ready: false })),
        description: description.trim(),
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 text-slate-900 dark:text-white my-8 transition-colors">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-600/20 border border-blue-200 dark:border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Create New Job</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Fill out this form to post a new job to the board</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Example Presets */}
        <div className="bg-slate-50 dark:bg-slate-900/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
          <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Quick Examples:</span>
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => handleApplyPreset("VALVE")}
              className="px-2.5 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-700/40 text-rose-800 dark:text-rose-300 font-semibold transition-colors"
            >
              Fix Leaking Valve (Urgent)
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset("SOFTWARE")}
              className="px-2.5 py-1 rounded-lg bg-blue-100 hover:bg-blue-200 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-700/40 text-blue-800 dark:text-blue-300 font-semibold transition-colors"
            >
              Update Software
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset("INSPECTION")}
              className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-700/40 text-emerald-800 dark:text-emerald-300 font-semibold transition-colors"
            >
              Routine Check
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Job Title *
            </label>
            <input
              id="wo-title-input"
              type="text"
              required
              placeholder="e.g. Fix leaking pipe in bathroom, replace light fixture"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Customer or Company Name *
              </label>
              <input
                id="wo-client-name-input"
                type="text"
                required
                placeholder="e.g. Apex Facilities, John Smith"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Customer Phone or Email
              </label>
              <input
                id="wo-client-contact-input"
                type="text"
                placeholder="e.g. 555-0199 or email@client.com"
                value={clientContact}
                onChange={(e) => setClientContact(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Location or Room
              </label>
              <input
                type="text"
                value={station}
                onChange={(e) => setStation(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                How Urgent?
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as WorkOrderPriority)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              >
                <option value="CRITICAL">Urgent (Needs instant attention)</option>
                <option value="HIGH">High (Do today)</option>
                <option value="MEDIUM">Normal (Standard work)</option>
                <option value="LOW">Low (Whenever possible)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Target Minutes (Warning Timer)
              </label>
              <input
                type="number"
                min={5}
                max={480}
                value={slaMinutes}
                onChange={(e) => setSlaMinutes(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Supervisor in Charge
              </label>
              <select
                value={supervisorId}
                onChange={(e) => setSupervisorId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              >
                {MOCK_STAFF.filter((s) => s.role === "SUPERVISOR").map((sup) => (
                  <option key={sup.id} value={sup.id}>
                    {sup.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Estimated Hours to Finish
              </label>
              <input
                type="number"
                min={1}
                max={72}
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Items & Tools Needed Checklist */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Items & Tools Needed
            </label>
            <div className="space-y-2 mb-2">
              {materials.map((mat, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-300"
                >
                  <span>{mat}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveMaterial(idx)}
                    className="text-slate-400 hover:text-rose-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type item needed (e.g. Wrench, Ladder, Light bulb)..."
                value={newMaterialItem}
                onChange={(e) => setNewMaterialItem(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddMaterial();
                  }
                }}
                className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleAddMaterial}
                className="px-3 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-white transition-colors"
              >
                Add Item
              </button>
            </div>
          </div>

          {/* Simple Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Notes or Special Instructions
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Any details the team should know..."
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              id="submit-create-wo-btn"
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition-all disabled:opacity-50"
            >
              {isSubmitting ? "Posting..." : "Post Job to Board"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
