import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, AuditEntry, BudgetRequest, Expense, ExpenseStatus, User } from '../types';
import { formatINR, uid } from '../utils/format';
import { createSeedState, STATE_VERSION } from './seed';
import { departmentSummary } from './selectors';

const STORAGE_KEY = 'backstage-state';

export type NewExpenseInput = Omit<Expense, 'id' | 'status' | 'createdAt' | 'history' | 'userId'>;

interface StoreApi {
  state: AppState;
  ready: boolean;
  currentUser: User | null;
  login(userId: string): void;
  logout(): void;
  submitExpense(input: NewExpenseInput): Expense;
  managerDecide(expenseId: string, decision: 'approve' | 'reject' | 'escalate', note?: string): ExpenseStatus | null;
  producerDecide(expenseId: string, decision: 'approve' | 'reject', note?: string): void;
  markPaid(expenseIds: string[], note?: string): void;
  requestBudget(departmentId: string, amount: number, reason: string): void;
  decideBudget(requestId: string, approve: boolean, note?: string): void;
  resetDemo(): void;
}

const StoreContext = createContext<StoreApi | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(createSeedState);
  const [ready, setReady] = useState(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Hydrate from device storage. Everything works offline; a cloud sync layer can replace this later.
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;
        const parsed = JSON.parse(raw) as AppState;
        if (parsed.version === STATE_VERSION) setState(parsed);
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state, ready]);

  const currentUser = useMemo(
    () => state.users.find((u) => u.id === state.currentUserId) ?? null,
    [state.users, state.currentUserId],
  );

  const actorId = () => stateRef.current.currentUserId ?? 'unknown';
  const entry = (action: AuditEntry['action'], note?: string): AuditEntry => ({
    at: new Date().toISOString(),
    byUserId: actorId(),
    action,
    note: note?.trim() || undefined,
  });

  const updateExpense = (id: string, fn: (e: Expense) => Expense) =>
    setState((s) => ({ ...s, expenses: s.expenses.map((e) => (e.id === id ? fn(e) : e)) }));

  const login = useCallback((userId: string) => setState((s) => ({ ...s, currentUserId: userId })), []);
  const logout = useCallback(() => setState((s) => ({ ...s, currentUserId: null })), []);

  const submitExpense = (input: NewExpenseInput): Expense => {
    const s = stateRef.current;
    const submitter = s.users.find((u) => u.id === s.currentUserId);
    const dept = s.departments.find((d) => d.id === input.departmentId);
    const history: AuditEntry[] = [entry('submitted')];
    let status: ExpenseStatus = 'submitted';
    // A manager can't approve their own spend – it goes straight to the producer.
    if (submitter && dept && dept.managerId === submitter.id) {
      status = 'escalated';
      history.push(entry('escalated', 'Submitted by department manager – needs producer sign-off'));
    }
    const expense: Expense = {
      ...input,
      id: uid('exp'),
      userId: actorId(),
      status,
      createdAt: new Date().toISOString(),
      history,
    };
    setState((st) => ({ ...st, expenses: [expense, ...st.expenses] }));
    return expense;
  };

  const managerDecide: StoreApi['managerDecide'] = (expenseId, decision, note) => {
    const s = stateRef.current;
    const exp = s.expenses.find((e) => e.id === expenseId);
    if (!exp || exp.status !== 'submitted') return null;
    let next: ExpenseStatus;
    let autoNote = note;
    if (decision === 'reject') {
      next = 'rejected';
    } else if (decision === 'escalate') {
      next = 'escalated';
    } else {
      // Approvals over the threshold, or that would overrun the department budget, route to the producer.
      const summary = departmentSummary(s, exp.departmentId);
      const overThreshold = exp.amount > s.project.escalationThreshold;
      const overBudget = summary.spent + exp.amount > summary.budget;
      if (overThreshold || overBudget) {
        next = 'escalated';
        const reason = overBudget ? 'would exceed department budget' : `above ${formatINR(s.project.escalationThreshold)} threshold`;
        autoNote = [note?.trim(), `Manager approved; auto-escalated (${reason})`].filter(Boolean).join(' · ');
      } else {
        next = 'approved';
      }
    }
    const action = next === 'escalated' ? 'escalated' : next === 'rejected' ? 'rejected' : 'approved';
    updateExpense(expenseId, (e) => ({ ...e, status: next, history: [...e.history, entry(action, autoNote)] }));
    return next;
  };

  const producerDecide: StoreApi['producerDecide'] = (expenseId, decision, note) => {
    updateExpense(expenseId, (e) => {
      if (e.status !== 'escalated' && e.status !== 'submitted') return e;
      const next: ExpenseStatus = decision === 'approve' ? 'approved' : 'rejected';
      return { ...e, status: next, history: [...e.history, entry(next === 'approved' ? 'approved' : 'rejected', note)] };
    });
  };

  const markPaid: StoreApi['markPaid'] = (ids, note) => {
    const set = new Set(ids);
    setState((s) => ({
      ...s,
      expenses: s.expenses.map((e) =>
        set.has(e.id) && e.status === 'approved'
          ? { ...e, status: 'paid', history: [...e.history, entry('paid', note)] }
          : e,
      ),
    }));
  };

  const requestBudget: StoreApi['requestBudget'] = (departmentId, amount, reason) => {
    const req: BudgetRequest = {
      id: uid('br'),
      departmentId,
      requestedBy: actorId(),
      amount,
      reason: reason.trim(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    setState((s) => ({ ...s, budgetRequests: [req, ...s.budgetRequests] }));
  };

  const decideBudget: StoreApi['decideBudget'] = (requestId, approve, note) => {
    setState((s) => {
      const req = s.budgetRequests.find((r) => r.id === requestId);
      if (!req || req.status !== 'pending') return s;
      return {
        ...s,
        departments: approve
          ? s.departments.map((d) => (d.id === req.departmentId ? { ...d, budget: d.budget + req.amount } : d))
          : s.departments,
        budgetRequests: s.budgetRequests.map((r) =>
          r.id === requestId
            ? {
                ...r,
                status: approve ? 'approved' : 'rejected',
                decidedAt: new Date().toISOString(),
                decidedBy: actorId(),
                note: note?.trim() || undefined,
              }
            : r,
        ),
      };
    });
  };

  const resetDemo = () => {
    const seed = createSeedState();
    setState({ ...seed, currentUserId: stateRef.current.currentUserId });
  };

  const api: StoreApi = {
    state,
    ready,
    currentUser,
    login,
    logout,
    submitExpense,
    managerDecide,
    producerDecide,
    markPaid,
    requestBudget,
    decideBudget,
    resetDemo,
  };

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreApi {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
