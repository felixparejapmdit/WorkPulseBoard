export type WorkOrderStatus = 'PENDING_ACK' | 'IN_PROGRESS' | 'QC_REVIEW' | 'COMPLETED';

export type WorkOrderPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ClientDetails {
  name: string;
  contact: string;
}

export interface AcknowledgedBy {
  userId: string;
  name: string;
  timestamp: string; // ISO string
}

export interface MaterialCheckItem {
  item: string;
  ready: boolean;
}

export interface WorkOrder {
  id: string;
  title: string;
  clientDetails: ClientDetails;
  status: WorkOrderStatus;
  acknowledgedBy: AcknowledgedBy | null;
  supervisorId: string | null;
  assignedWorkerIds: string[];
  materialsCheck: MaterialCheckItem[];
  estimatedCompletionDate: string; // ISO string
  createdAt: string; // ISO string
  
  // Operational KDS metadata
  priority?: WorkOrderPriority;
  slaMinutes?: number;
  description?: string;
  station?: string;
  category?: string;
  version?: number; // Monotonic counter for atomic collision checks
}

export interface StaffUser {
  id: string;
  name: string;
  role: 'SUPERVISOR' | 'WORKER';
  avatar: string;
  specialty?: string;
  email?: string;
}

export type UrgencyLevel = 'NORMAL' | 'APPROACHING' | 'BREACHED';

export interface ColumnConfig {
  status: WorkOrderStatus;
  title: string;
  subtitle: string;
  accentColor: string;
  bgGradient: string;
  badgeBg: string;
}
