export type Role = 'crew' | 'manager' | 'producer';

export interface User {
  id: string;
  name: string;
  role: Role;
  title: string;
  phone: string;
  departmentIds: string[];
}

export interface Department {
  id: string;
  name: string;
  icon: string; // Ionicons name
  budget: number;
  managerId: string;
}

export interface Project {
  id: string;
  name: string;
  kind: 'Feature Film' | 'Web Series' | 'TV Series' | 'Music Video' | 'Ad Film';
  startDate: string; // ISO date
  endDate: string;
  totalBudget: number;
  escalationThreshold: number; // manager approvals above this go to the producer
}

export type ExpenseStatus = 'submitted' | 'escalated' | 'approved' | 'rejected' | 'paid';

export type AuditAction = 'submitted' | 'approved' | 'escalated' | 'rejected' | 'paid';

export interface AuditEntry {
  at: string; // ISO datetime
  byUserId: string;
  action: AuditAction;
  note?: string;
}

export interface Expense {
  id: string;
  userId: string;
  departmentId: string;
  amount: number;
  category: string;
  description: string;
  vendor?: string;
  gstin?: string;
  date: string; // ISO date the expense was incurred
  receiptUri?: string;
  status: ExpenseStatus;
  createdAt: string;
  history: AuditEntry[];
}

export type BudgetRequestStatus = 'pending' | 'approved' | 'rejected';

export interface BudgetRequest {
  id: string;
  departmentId: string;
  requestedBy: string;
  amount: number;
  reason: string;
  status: BudgetRequestStatus;
  createdAt: string;
  decidedAt?: string;
  decidedBy?: string;
  note?: string;
}

export interface AppState {
  version: number;
  currentUserId: string | null;
  project: Project;
  users: User[];
  departments: Department[];
  expenses: Expense[];
  budgetRequests: BudgetRequest[];
}

export const CATEGORIES = [
  'Fuel',
  'Transport',
  'Food & Catering',
  'Accommodation',
  'Equipment Rental',
  'Props & Materials',
  'Costume & Fabric',
  'Makeup Supplies',
  'Location Fees',
  'Labour / Daily Wages',
  'Printing & Stationery',
  'Miscellaneous',
] as const;
