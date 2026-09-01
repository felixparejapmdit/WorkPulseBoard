import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useWorkOrders } from "@/hooks/useWorkOrders";
import { encryptData, decryptData } from "@/lib/encryption";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

class MockBroadcastChannel {
  name: string;
  onmessage: ((event: any) => void) | null = null;
  constructor(name: string) {
    this.name = name;
  }
  postMessage(data: any) {}
  close() {}
}

(window as any).BroadcastChannel = MockBroadcastChannel;

describe("useWorkOrders Hook & Operations", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it("initializes with mock work orders", async () => {
    const { result } = renderHook(() => useWorkOrders());
    expect(result.current.workOrders.length).toBeGreaterThan(0);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isEncrypted).toBe(true);
  });

  it("optimistically claims a pending work order and updates acknowledgedBy and status", async () => {
    const { result } = renderHook(() => useWorkOrders());

    const pendingOrder = result.current.workOrders.find((w) => w.status === "PENDING_ACK");
    expect(pendingOrder).toBeDefined();

    let claimResult: any;
    await act(async () => {
      claimResult = await result.current.claimWorkOrder(pendingOrder!.id, {
        userId: "wrk-alex",
        name: "Alex Chen",
      });
    });

    expect(claimResult.success).toBe(true);

    const updated = result.current.workOrders.find((w) => w.id === pendingOrder!.id);
    expect(updated?.acknowledgedBy?.userId).toBe("wrk-alex");
    expect(updated?.acknowledgedBy?.name).toBe("Alex Chen");
    expect(updated?.status).toBe("IN_PROGRESS");
  });

  it("prevents double-claiming and detects collision on already-claimed work order", async () => {
    const { result } = renderHook(() => useWorkOrders());

    const pendingOrder = result.current.workOrders.find((w) => w.status === "PENDING_ACK");
    expect(pendingOrder).toBeDefined();

    await act(async () => {
      await result.current.claimWorkOrder(pendingOrder!.id, {
        userId: "wrk-alex",
        name: "Alex Chen",
      });
    });

    let collisionResult: any;
    await act(async () => {
      collisionResult = await result.current.claimWorkOrder(pendingOrder!.id, {
        userId: "wrk-maria",
        name: "Maria Garcia",
      });
    });

    expect(collisionResult.success).toBe(false);
    expect(collisionResult.error).toContain("already claimed");

    const target = result.current.workOrders.find((w) => w.id === pendingOrder!.id);
    expect(target?.acknowledgedBy?.userId).toBe("wrk-alex");
  });

  it("clears all orders with clearAllOrders and reloads with loadSampleData", async () => {
    const { result } = renderHook(() => useWorkOrders());
    expect(result.current.workOrders.length).toBeGreaterThan(0);

    // Clear board
    await act(async () => {
      result.current.clearAllOrders();
    });
    expect(result.current.workOrders.length).toBe(0);

    // Reload sample data
    await act(async () => {
      result.current.loadSampleData();
    });
    expect(result.current.workOrders.length).toBeGreaterThan(0);
  });

  it("encrypts and decrypts work order data seamlessly", async () => {
    const sample = [{ id: "WO-99", title: "Encrypted Test", clientDetails: { name: "Secret Client", contact: "secret@test.com" } }];
    const encrypted = await encryptData(sample);
    expect(encrypted.startsWith("wp_enc:")).toBe(true);

    const decrypted = await decryptData<typeof sample>(encrypted, []);
    expect(decrypted[0].title).toBe("Encrypted Test");
    expect(decrypted[0].clientDetails.contact).toBe("secret@test.com");
  });
});
