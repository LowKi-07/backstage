import { AppState, Expense, ExpenseStatus, User } from '../types';

const SPENT: ExpenseStatus[] = ['approved', 'paid'];
const PENDING: ExpenseStatus[] = ['submitted', 'escalated'];

export const isSpent = (e: Expense) => SPENT.includes(e.status);
export const isPending = (e: Expense) => PENDING.includes(e.status);

export const sum = (list: Expense[]) => list.reduce((acc, e) => acc + e.amount, 0);

export function departmentSummary(state: AppState, departmentId: string) {
  const dept = state.departments.find((d) => d.id === departmentId);
  const list = state.expenses.filter((e) => e.departmentId === departmentId);
  const spent = sum(list.filter(isSpent));
  const pending = sum(list.filter(isPending));
  const budget = dept?.budget ?? 0;
  return {
    budget,
    spent,
    pending,
    remaining: budget - spent,
    pct: budget > 0 ? spent / budget : 0,
    count: list.length,
  };
}

export function projectSummary(state: AppState) {
  const { project, departments, expenses } = state;
  const allocated = departments.reduce((a, d) => a + d.budget, 0);
  const spent = sum(expenses.filter(isSpent));
  const pending = sum(expenses.filter(isPending));
  const paid = sum(expenses.filter((e) => e.status === 'paid'));
  const start = new Date(project.startDate).getTime();
  const end = new Date(project.endDate).getTime();
  const now = Date.now();
  const daysElapsed = Math.max(1, Math.ceil((now - start) / 86400000));
  const totalDays = Math.max(1, Math.ceil((end - start) / 86400000));
  const daysLeft = Math.max(0, Math.ceil((end - now) / 86400000));
  const burnRate = spent / daysElapsed;
  const remaining = project.totalBudget - spent;
  const runwayDays = burnRate > 0 ? Math.floor(remaining / burnRate) : Infinity;
  const projectedTotal = spent + burnRate * daysLeft;
  return {
    totalBudget: project.totalBudget,
    allocated,
    unallocated: project.totalBudget - allocated,
    spent,
    pending,
    paid,
    remaining,
    pct: spent / project.totalBudget,
    daysElapsed,
    totalDays,
    daysLeft,
    burnRate,
    runwayDays,
    projectedTotal,
  };
}

export function categoryBreakdown(expenses: Expense[]) {
  const map = new Map<string, number>();
  expenses.filter(isSpent).forEach((e) => map.set(e.category, (map.get(e.category) ?? 0) + e.amount));
  return [...map.entries()].map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount);
}

export function managedDepartmentIds(state: AppState, user: User | null): string[] {
  if (!user) return [];
  return state.departments.filter((d) => d.managerId === user.id).map((d) => d.id);
}

export const byNewest = (a: Expense, b: Expense) => b.createdAt.localeCompare(a.createdAt);

export function userName(state: AppState, id: string) {
  return state.users.find((u) => u.id === id)?.name ?? 'Unknown';
}

export function deptName(state: AppState, id: string) {
  return state.departments.find((d) => d.id === id)?.name ?? 'Unknown';
}
