"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { WorkOrder, WorkOrderStatus, WorkOrderPriority } from "@/types/work-order";
import { INITIAL_WORK_ORDERS } from "@/lib/mock-data";
import { encryptData, decryptData } from "@/lib/encryption";
import { 
  getFirestoreDb, 
  collection, 
  onSnapshot, 
  doc, 
  runTransaction, 
  setDoc,
  updateDoc 
} from "@/lib/firebase";

const STORAGE_KEY = "workpulse_orders_v1";
const CHANNEL_NAME = "workpulse_kds_sync_channel";

export interface ClaimUser {
  userId: string;
  name: string;
}

export interface UseWorkOrdersReturn {
  workOrders: WorkOrder[];
  isLoading: boolean;
  error: string | null;
  lastSyncTime: Date;
  isOnline: boolean;
  isEncrypted: boolean;
  claimWorkOrder: (orderId: string, user: ClaimUser) => Promise<{ success: boolean; error?: string }>;
  updateStatus: (orderId: string, newStatus: WorkOrderStatus) => Promise<void>;
  toggleMaterial: (orderId: string, itemIndex: number) => Promise<void>;
  updateAssignees: (orderId: string, assignedWorkerIds: string[]) => Promise<void>;
  updateSupervisor: (orderId: string, supervisorId: string | null) => Promise<void>;
  updateEstimatedDate: (orderId: string, estimatedDateIso: string) => Promise<void>;
  createWorkOrder: (newOrder: {
    title: string;
    clientDetails: { name: string; contact: string };
    supervisorId: string | null;
    assignedWorkerIds: string[];
    materialsCheck: { item: string; ready: boolean }[];
    estimatedCompletionDate: string;
    priority?: WorkOrderPriority;
    slaMinutes?: number;
    station?: string;
    category?: string;
    description?: string;
  }) => Promise<WorkOrder>;
  loadSampleData: () => void;
  clearAllOrders: () => void;
  resetToDefault: () => void;
  simulateRaceCondition: (orderId: string, rivalUser: ClaimUser) => Promise<void>;
}

export function useWorkOrders(): UseWorkOrdersReturn {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isEncrypted] = useState<boolean>(true);

  const channelRef = useRef<BroadcastChannel | null>(null);
  const workOrdersRef = useRef<WorkOrder[]>([]);
  workOrdersRef.current = workOrders;

  // Persist with client-side AES-GCM encryption and broadcast
  const persistAndBroadcast = useCallback(async (updatedOrders: WorkOrder[], origin = "local") => {
    try {
      if (typeof window !== "undefined") {
        // Encrypt payload before storing in localStorage
        const encrypted = await encryptData(updatedOrders);
        window.localStorage.setItem(STORAGE_KEY, encrypted);

        if (channelRef.current && origin === "local") {
          try {
            channelRef.current.postMessage({
              type: "SYNC_ORDERS_ENCRYPTED",
              payload: encrypted,
              timestamp: Date.now(),
            });
          } catch {}
        }
      }
    } catch (err) {
      console.error("Failed to encrypt and persist work orders:", err);
    }
  }, []);

  // Initialize data and real-time listeners
  useEffect(() => {
    let firestoreUnsub: (() => void) | null = null;
    const db = getFirestoreDb();

    // 1. If real Firestore is configured, listen to onSnapshot
    if (db) {
      try {
        const ordersCol = collection(db, "workOrders");
        firestoreUnsub = onSnapshot(ordersCol, (snapshot) => {
          const remoteOrders: WorkOrder[] = [];
          snapshot.forEach((doc) => {
            remoteOrders.push({ id: doc.id, ...doc.data() } as WorkOrder);
          });

          if (remoteOrders.length > 0) {
            setWorkOrders(remoteOrders);
            setLastSyncTime(new Date());
            persistAndBroadcast(remoteOrders, "remote");
          }
          setIsLoading(false);
        }, (err) => {
          console.warn("Firestore listener error, using local encrypted channel:", err);
          setError("Using Encrypted Live Channel");
          setIsOnline(false);
        });
      } catch (err) {
        console.warn("Error setting up Firestore listener:", err);
      }
    }

    // 2. Setup high-speed BroadcastChannel with encryption support
    if (typeof window !== "undefined") {
      try {
        const channel = new BroadcastChannel(CHANNEL_NAME);
        channelRef.current = channel;

        channel.onmessage = async (event) => {
          if (event.data?.type === "SYNC_ORDERS_ENCRYPTED" && event.data.payload) {
            const decrypted = await decryptData<WorkOrder[]>(event.data.payload, []);
            if (Array.isArray(decrypted)) {
              setWorkOrders(decrypted);
              setLastSyncTime(new Date(event.data.timestamp || Date.now()));
              window.localStorage.setItem(STORAGE_KEY, event.data.payload);
            }
          } else if (event.data?.type === "SYNC_ORDERS" && Array.isArray(event.data.orders)) {
            setWorkOrders(event.data.orders);
            setLastSyncTime(new Date(event.data.timestamp || Date.now()));
          }
        };
      } catch (e) {
        console.warn("BroadcastChannel fallback:", e);
      }

      // Storage event listener for cross-tab fallback
      const handleStorage = async (e: StorageEvent) => {
        if (e.key === STORAGE_KEY && e.newValue) {
          try {
            const decrypted = await decryptData<WorkOrder[]>(e.newValue, []);
            if (Array.isArray(decrypted)) {
              setWorkOrders(decrypted);
              setLastSyncTime(new Date());
            }
          } catch (parseErr) {
            console.error("Storage parse error:", parseErr);
          }
        }
      };
      window.addEventListener("storage", handleStorage);

      // Load initial data from encrypted localStorage or seed with INITIAL_WORK_ORDERS
      const initLoad = async () => {
        try {
          const saved = window.localStorage.getItem(STORAGE_KEY);
          if (saved) {
            const decrypted = await decryptData<WorkOrder[]>(saved, []);
            if (Array.isArray(decrypted)) {
              setWorkOrders(decrypted);
              setIsLoading(false);
              return;
            }
          }
        } catch (err) {
          console.error("Failed to load initial encrypted local state:", err);
        }

        // Seed with sample data
        setWorkOrders(INITIAL_WORK_ORDERS);
        persistAndBroadcast(INITIAL_WORK_ORDERS);
        setIsLoading(false);
      };

      initLoad();

      return () => {
        window.removeEventListener("storage", handleStorage);
        channelRef.current?.close();
        if (firestoreUnsub) firestoreUnsub();
      };
    }
  }, [persistAndBroadcast]);

  // Atomic Claim / Acknowledge with Optimistic UI update and Rollback on collision
  const claimWorkOrder = useCallback(
    async (orderId: string, user: ClaimUser): Promise<{ success: boolean; error?: string }> => {
      const currentOrders = workOrdersRef.current;
      const targetOrder = currentOrders.find((wo) => wo.id === orderId);

      if (!targetOrder) {
        return { success: false, error: "Work order not found." };
      }

      // Pre-check: already claimed?
      if (targetOrder.acknowledgedBy) {
        return {
          success: false,
          error: `Job already claimed by ${targetOrder.acknowledgedBy.name} at ${new Date(targetOrder.acknowledgedBy.timestamp).toLocaleTimeString()}`,
        };
      }

      // 1. Optimistic Update
      const optimisticTimestamp = new Date().toISOString();
      const backupOrders = [...currentOrders];

      const optimisticOrders = currentOrders.map((wo) => {
        if (wo.id === orderId) {
          return {
            ...wo,
            acknowledgedBy: {
              userId: user.userId,
              name: user.name,
              timestamp: optimisticTimestamp,
            },
            status: (wo.status === "PENDING_ACK" ? "IN_PROGRESS" : wo.status) as WorkOrderStatus,
            version: (wo.version || 1) + 1,
          };
        }
        return wo;
      });

      setWorkOrders(optimisticOrders);
      setLastSyncTime(new Date());

      // 2. Perform Backend / Real-time Concurrency Validation
      const db = getFirestoreDb();
      if (db) {
        try {
          const docRef = doc(db, "workOrders", orderId);
          await runTransaction(db, async (transaction) => {
            const sfDoc = await transaction.get(docRef);
            if (!sfDoc.exists()) {
              throw new Error("Work order does not exist!");
            }
            const data = sfDoc.data() as WorkOrder;
            if (data.acknowledgedBy && data.acknowledgedBy.userId !== user.userId) {
              throw new Error(`RACE_CONDITION: Already claimed by ${data.acknowledgedBy.name}`);
            }
            transaction.update(docRef, {
              acknowledgedBy: {
                userId: user.userId,
                name: user.name,
                timestamp: optimisticTimestamp,
              },
              status: (data.status === "PENDING_ACK" ? "IN_PROGRESS" : data.status),
              version: (data.version || 1) + 1,
            });
          });

          await persistAndBroadcast(optimisticOrders);
          return { success: true };
        } catch (err: any) {
          // Rollback on collision!
          console.warn("Claim transaction collision detected! Rolling back...", err.message);
          setWorkOrders(backupOrders);
          setError(err.message);
          return {
            success: false,
            error: err.message.replace("RACE_CONDITION: ", "") || "Collision detected: Job already claimed by another team member.",
          };
        }
      }

      // Local / Cross-tab mode Concurrency Check:
      try {
        const freshStored = window.localStorage.getItem(STORAGE_KEY);
        if (freshStored) {
          const decrypted: WorkOrder[] = await decryptData<WorkOrder[]>(freshStored, []);
          const currentFresh = decrypted.find((wo) => wo.id === orderId);
          if (currentFresh?.acknowledgedBy && currentFresh.acknowledgedBy.userId !== user.userId) {
            console.warn("Local collision detected! Rolling back optimistic update...");
            setWorkOrders(backupOrders);
            return {
              success: false,
              error: `Collision! Job was already claimed by ${currentFresh.acknowledgedBy.name}.`,
            };
          }
        }
      } catch (err) {
        console.error("Local collision verification error:", err);
      }

      // Success: persist and broadcast
      await persistAndBroadcast(optimisticOrders);
      return { success: true };
    },
    [persistAndBroadcast]
  );

  // Status transition
  const updateStatus = useCallback(
    async (orderId: string, newStatus: WorkOrderStatus) => {
      const updated = workOrdersRef.current.map((wo) => {
        if (wo.id === orderId) {
          return {
            ...wo,
            status: newStatus,
            version: (wo.version || 1) + 1,
          };
        }
        return wo;
      });

      setWorkOrders(updated);
      await persistAndBroadcast(updated);

      const db = getFirestoreDb();
      if (db) {
        try {
          await updateDoc(doc(db, "workOrders", orderId), {
            status: newStatus,
          });
        } catch (e) {
          console.warn("Firestore status update failed:", e);
        }
      }
    },
    [persistAndBroadcast]
  );

  // Toggle material checklist item
  const toggleMaterial = useCallback(
    async (orderId: string, itemIndex: number) => {
      const updated = workOrdersRef.current.map((wo) => {
        if (wo.id === orderId) {
          const newChecklist = wo.materialsCheck.map((mat, idx) => {
            if (idx === itemIndex) {
              return { ...mat, ready: !mat.ready };
            }
            return mat;
          });
          return {
            ...wo,
            materialsCheck: newChecklist,
            version: (wo.version || 1) + 1,
          };
        }
        return wo;
      });

      setWorkOrders(updated);
      await persistAndBroadcast(updated);

      const db = getFirestoreDb();
      if (db) {
        try {
          const order = updated.find((wo) => wo.id === orderId);
          if (order) {
            await updateDoc(doc(db, "workOrders", orderId), {
              materialsCheck: order.materialsCheck,
            });
          }
        } catch (e) {
          console.warn("Firestore material checklist update failed:", e);
        }
      }
    },
    [persistAndBroadcast]
  );

  // Update assigned workers
  const updateAssignees = useCallback(
    async (orderId: string, assignedWorkerIds: string[]) => {
      const updated = workOrdersRef.current.map((wo) => {
        if (wo.id === orderId) {
          return {
            ...wo,
            assignedWorkerIds,
            version: (wo.version || 1) + 1,
          };
        }
        return wo;
      });

      setWorkOrders(updated);
      await persistAndBroadcast(updated);

      const db = getFirestoreDb();
      if (db) {
        try {
          await updateDoc(doc(db, "workOrders", orderId), {
            assignedWorkerIds,
          });
        } catch (e) {
          console.warn("Firestore assignees update failed:", e);
        }
      }
    },
    [persistAndBroadcast]
  );

  // Update supervisor
  const updateSupervisor = useCallback(
    async (orderId: string, supervisorId: string | null) => {
      const updated = workOrdersRef.current.map((wo) => {
        if (wo.id === orderId) {
          return {
            ...wo,
            supervisorId,
            version: (wo.version || 1) + 1,
          };
        }
        return wo;
      });

      setWorkOrders(updated);
      await persistAndBroadcast(updated);

      const db = getFirestoreDb();
      if (db) {
        try {
          await updateDoc(doc(db, "workOrders", orderId), {
            supervisorId,
          });
        } catch (e) {
          console.warn("Firestore supervisor update failed:", e);
        }
      }
    },
    [persistAndBroadcast]
  );

  // Update estimated completion date
  const updateEstimatedDate = useCallback(
    async (orderId: string, estimatedDateIso: string) => {
      const updated = workOrdersRef.current.map((wo) => {
        if (wo.id === orderId) {
          return {
            ...wo,
            estimatedCompletionDate: estimatedDateIso,
            version: (wo.version || 1) + 1,
          };
        }
        return wo;
      });

      setWorkOrders(updated);
      await persistAndBroadcast(updated);

      const db = getFirestoreDb();
      if (db) {
        try {
          await updateDoc(doc(db, "workOrders", orderId), {
            estimatedCompletionDate: estimatedDateIso,
          });
        } catch (e) {
          console.warn("Firestore estimatedDate update failed:", e);
        }
      }
    },
    [persistAndBroadcast]
  );

  // Create new work order
  const createWorkOrder = useCallback(
    async (data: {
      title: string;
      clientDetails: { name: string; contact: string };
      supervisorId: string | null;
      assignedWorkerIds: string[];
      materialsCheck: { item: string; ready: boolean }[];
      estimatedCompletionDate: string;
      priority?: WorkOrderPriority;
      slaMinutes?: number;
      station?: string;
      category?: string;
      description?: string;
    }): Promise<WorkOrder> => {
      const nextNum = Math.floor(100 + Math.random() * 900);
      const newOrder: WorkOrder = {
        id: `WO-${nextNum}`,
        title: data.title,
        clientDetails: data.clientDetails,
        status: "PENDING_ACK",
        acknowledgedBy: null,
        supervisorId: data.supervisorId,
        assignedWorkerIds: data.assignedWorkerIds,
        materialsCheck: data.materialsCheck,
        estimatedCompletionDate: data.estimatedCompletionDate,
        createdAt: new Date().toISOString(),
        priority: data.priority || "MEDIUM",
        slaMinutes: data.slaMinutes || 30,
        station: data.station || "Main Area",
        category: data.category || "General Work",
        description: data.description || "",
        version: 1,
      };

      const updated = [newOrder, ...workOrdersRef.current];
      setWorkOrders(updated);
      await persistAndBroadcast(updated);

      const db = getFirestoreDb();
      if (db) {
        try {
          await setDoc(doc(db, "workOrders", newOrder.id), newOrder);
        } catch (e) {
          console.warn("Firestore creation fallback:", e);
        }
      }

      return newOrder;
    },
    [persistAndBroadcast]
  );

  // Load sample data
  const loadSampleData = useCallback(() => {
    setWorkOrders(INITIAL_WORK_ORDERS);
    persistAndBroadcast(INITIAL_WORK_ORDERS);
  }, [persistAndBroadcast]);

  // Start empty (clear all orders)
  const clearAllOrders = useCallback(() => {
    setWorkOrders([]);
    persistAndBroadcast([]);
  }, [persistAndBroadcast]);

  // Reset to default mock data (alias)
  const resetToDefault = useCallback(() => {
    loadSampleData();
  }, [loadSampleData]);

  // Simulate a race condition / collision explicitly
  const simulateRaceCondition = useCallback(
    async (orderId: string, rivalUser: ClaimUser) => {
      const currentOrders = workOrdersRef.current;
      const updated = currentOrders.map((wo) => {
        if (wo.id === orderId) {
          return {
            ...wo,
            acknowledgedBy: {
              userId: rivalUser.userId,
              name: rivalUser.name,
              timestamp: new Date().toISOString(),
            },
            status: "IN_PROGRESS" as WorkOrderStatus,
            version: (wo.version || 1) + 1,
          };
        }
        return wo;
      });

      setWorkOrders(updated);
      await persistAndBroadcast(updated);
    },
    [persistAndBroadcast]
  );

  return {
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
    resetToDefault,
    simulateRaceCondition,
  };
}
