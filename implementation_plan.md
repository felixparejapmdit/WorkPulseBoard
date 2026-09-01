# Implementation Plan: Real-Time Smart Central Operations Dashboard & Staff Work Order System (KDS-Style Command Center)

Building a high-visibility, real-time KDS (Kitchen Display System / Command Center) operations dashboard and personalized staff work order system using Next.js App Router, Tailwind CSS, Lucide Icons, and Firestore/real-time reactive synchronization.

## Proposed System Architecture

### 1. Core Data Model & Types (`@/types/work-order.ts`)
- Strict TypeScript interface adhering to specification:
  - `id: string`
  - `title: string`
  - `clientDetails: { name: string; contact: string }`
  - `status: 'PENDING_ACK' | 'IN_PROGRESS' | 'QC_REVIEW' | 'COMPLETED'`
  - `acknowledgedBy: { userId: string; name: string; timestamp: string } | null`
  - `supervisorId: string | null`
  - `assignedWorkerIds: string[]`
  - `materialsCheck: { item: string; ready: boolean }[]`
  - `estimatedCompletionDate: string` (ISO)
  - `createdAt: string` (ISO)
- Additional operational properties: `priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'`, `slaMinutes: number`, `notes?: string[]`, `description?: string`.

### 2. State & Real-Time Sync Hook (`@/hooks/useWorkOrders.ts`)
- **Real-Time Snapshot Engine**: Sub-second synchronization using multi-layered sync (Firestore `onSnapshot` when connected + native `BroadcastChannel` & `localStorage` synchronization for zero-config, cross-tab instantaneous <50ms updates).
- **Atomic Claim / Acknowledge**: 
  - Prevents race conditions on concurrent claims.
  - Optimistic UI update with immediate local badge/state transition.
  - Collision detection: If already claimed by another user, automatically rolls back state and triggers a non-intrusive alert toast.
- **Interactive Mutation Helpers**:
  - `createWorkOrder(data)`
  - `claimWorkOrder(id, user)` (Atomic with optimistic update & rollback)
  - `updateStatus(id, newStatus)`
  - `toggleMaterial(id, itemIndex)`
  - `updateAssignees(id, workerIds)`
  - `updateSupervisor(id, supervisorId)`
  - `updateEstimatedDate(id, isoDate)`
  - `resetToMockData()`

### 3. Smart Central Operations Dashboard (`@/components/kds/GeneralBoard.tsx`)
- **Master Command Center (KDS-style)**:
  - 4 Kanban status columns (`PENDING_ACK`, `IN_PROGRESS`, `QC_REVIEW`, `COMPLETED`).
  - Visual live urgency timers:
    - 🟢 Green: On track (< 15 mins)
    - 🟡 Amber: Approaching SLA (15-30 mins)
    - 🔴 Flashing Red: Breached SLA / Overdue
  - Atomic "Claim / Acknowledge" button with real-time status indication.
  - Quick action toolbar: Search filter, priority filter, sound chime toggle, quick order generation.
  - Real-time pulse indicator showing connection health and active sync count.

### 4. Personalized Staff Dashboard (`@/components/kds/StaffDashboard.tsx`)
- Filtered specifically to `supervisorId === currentUserId || assignedWorkerIds.includes(currentUserId)`.
- Active user persona switcher (e.g. Supervisor "Sarah Miller", Field Lead "Alex Chen", Technician "Maria Garcia") for testing personalized views.
- Interactive controls:
  - Material checklist toggles with instant progress bar.
  - Worker assignment manager modal/popover.
  - Estimated completion date inline picker.
  - Workflow stage progression buttons (`Start Work`, `Send for QC`, `Supervisor Sign-off`).

### 5. UI Polish & Aesthetics
- High-contrast, dark-mode inspired KDS Command Center aesthetic with crisp typography, glowing status rings, smooth micro-animations, glassmorphic cards, and responsive layout.

---

## Proposed Changes

### Configuration & Base Setup
#### [NEW] `package.json`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.mjs`, `next.config.ts`
- Setup Next.js 14+ with Tailwind CSS, Lucide React, and TypeScript.
- Setup test runner (Jest or Vitest + React Testing Library) and ESLint.

---

### Data & State Layer
#### [NEW] [work-order.ts](file:///home/inccm01/Documents/PROJECTS/WorkPulse%20Dashboard/src/types/work-order.ts)
- Comprehensive TypeScript interfaces and helper type guards.

#### [NEW] [firebase.ts](file:///home/inccm01/Documents/PROJECTS/WorkPulse%20Dashboard/src/lib/firebase.ts)
- Firebase configuration with local real-time fallback bridge.

#### [NEW] [mock-data.ts](file:///home/inccm01/Documents/PROJECTS/WorkPulse%20Dashboard/src/lib/mock-data.ts)
- Initial rich dataset representing active field orders, pending acknowledgments, and QC reviews.

#### [NEW] [useWorkOrders.ts](file:///home/inccm01/Documents/PROJECTS/WorkPulse%20Dashboard/src/hooks/useWorkOrders.ts)
- Custom React hook managing real-time subscriptions, optimistic mutations, race condition rollbacks, and filter state.

---

### Presentation Layer
#### [NEW] [GeneralBoard.tsx](file:///home/inccm01/Documents/PROJECTS/WorkPulse%20Dashboard/src/components/kds/GeneralBoard.tsx)
- The KDS master command center board with Kanban columns, live timers, and claim actions.

#### [NEW] [StaffDashboard.tsx](file:///home/inccm01/Documents/PROJECTS/WorkPulse%20Dashboard/src/components/kds/StaffDashboard.tsx)
- The personalized worker/supervisor view with checklist toggles, worker assignment, and SLA updater.

#### [NEW] [WorkOrderCard.tsx](file:///home/inccm01/Documents/PROJECTS/WorkPulse%20Dashboard/src/components/kds/WorkOrderCard.tsx)
- Modular KDS work order card supporting both Master board view and Staff view modes.

#### [NEW] [CreateWorkOrderModal.tsx](file:///home/inccm01/Documents/PROJECTS/WorkPulse%20Dashboard/src/components/kds/CreateWorkOrderModal.tsx)
- Modal for fast dispatching of new work orders.

#### [NEW] [Navbar.tsx](file:///home/inccm01/Documents/PROJECTS/WorkPulse%20Dashboard/src/components/kds/Navbar.tsx)
- Header with view switcher (General Board vs. Staff Dashboard), live metrics summary, simulated active user picker, and fullscreen toggle.

#### [NEW] [page.tsx](file:///home/inccm01/Documents/PROJECTS/WorkPulse%20Dashboard/src/app/page.tsx)
- Main application shell integrating the navigation, boards, and real-time state.

---

### Testing & Verification Layer
#### [NEW] `src/hooks/__tests__/useWorkOrders.test.ts`
- Unit tests verifying optimistic updates, atomic claiming, material toggles, and status transitions.

---

## Verification Plan

### Automated Tests
- Run `npm run lint` to confirm 0 lint errors.
- Run `npm test` or `npm run build` to confirm clean type checking and unit test passing.

### Manual Verification via Browser Sub-Agent
1. Start the Next.js development server (`npm run dev`).
2. Verify General Board displays the Kanban columns with live ticking timers and urgency colors.
3. Test creating a new Work Order and observe instant rendering in under 500ms.
4. Test clicking "Claim / Acknowledge" and verify optimistic instant update with timestamp and user assignment.
5. Switch to Staff Dashboard as "Alex Chen" or "Sarah Miller", toggle material checklist items, and verify instant reactive state updates.
6. Verify two browser sessions / tabs synchronize updates in real-time.
