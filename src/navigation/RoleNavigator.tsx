import React from 'react';
import { CrewExpensesScreen, CrewHomeScreen, CrewPayoutsScreen } from '../screens/crew/CrewScreens';
import { BudgetRequestScreen } from '../screens/manager/BudgetRequestScreen';
import { ManagerApprovalsScreen, ManagerBudgetsScreen, ManagerDashboardScreen, ManagerExpensesScreen } from '../screens/manager/ManagerScreens';
import { ProducerDepartmentsScreen, ProducerExpensesScreen, ProducerInboxScreen, ProducerOverviewScreen } from '../screens/producer/ProducerScreens';
import { AiChatScreen } from '../screens/shared/AiChatScreen';
import { DepartmentScreen } from '../screens/shared/DepartmentScreen';
import { ExpenseDetailScreen } from '../screens/shared/ExpenseDetailScreen';
import { NewExpenseScreen } from '../screens/shared/NewExpenseScreen';
import { ProfileScreen } from '../screens/shared/ProfileScreen';
import { managedDepartmentIds } from '../store/selectors';
import { useStore } from '../store/Store';
import { CenterDef, Route, TabDef, TabNavigator } from './Nav';

function renderRoute(r: Route) {
  switch (r.name) {
    case 'expense':
      return <ExpenseDetailScreen key={r.id} id={r.id} />;
    case 'newExpense':
      return <NewExpenseScreen />;
    case 'department':
      return <DepartmentScreen key={r.id} id={r.id} />;
    case 'budgetRequest':
      return <BudgetRequestScreen departmentId={r.departmentId} />;
    case 'profile':
      return <ProfileScreen />;
  }
}

const ai: TabDef = { key: 'ai', label: 'Ask AI', glyph: 'sparkles', render: () => <AiChatScreen /> };

export function RoleNavigator() {
  const { state, currentUser } = useStore();
  if (!currentUser) return null;

  let tabs: TabDef[];
  let center: CenterDef;
  if (currentUser.role === 'crew') {
    const toBePaid = state.expenses.filter((e) => e.userId === currentUser.id && e.status === 'approved').length;
    tabs = [
      { key: 'home', label: 'Home', glyph: 'home', render: () => <CrewHomeScreen /> },
      { key: 'expenses', label: 'Expenses', glyph: 'receipt', render: () => <CrewExpensesScreen /> },
      { key: 'payouts', label: 'Payouts', glyph: 'wallet', badge: toBePaid, render: () => <CrewPayoutsScreen /> },
      ai,
    ];
    center = { icon: 'plus', label: 'Add expense', route: { name: 'newExpense' } };
  } else if (currentUser.role === 'manager') {
    const ids = managedDepartmentIds(state, currentUser);
    const waiting = state.expenses.filter((e) => ids.includes(e.departmentId) && e.status === 'submitted' && e.userId !== currentUser.id).length;
    tabs = [
      { key: 'home', label: 'Home', glyph: 'home', render: () => <ManagerDashboardScreen /> },
      { key: 'expenses', label: 'Expenses', glyph: 'receipt', render: () => <ManagerExpensesScreen /> },
      { key: 'budgets', label: 'Budgets', glyph: 'grid', render: () => <ManagerBudgetsScreen /> },
      ai,
    ];
    center = { icon: 'check-double', label: 'Approvals', badge: waiting, tab: { key: 'approvals', render: () => <ManagerApprovalsScreen /> } };
  } else {
    const inbox = state.expenses.filter((e) => e.status === 'escalated').length + state.budgetRequests.filter((r) => r.status === 'pending').length;
    tabs = [
      { key: 'home', label: 'Home', glyph: 'home', render: () => <ProducerOverviewScreen /> },
      { key: 'expenses', label: 'Expenses', glyph: 'receipt', render: () => <ProducerExpensesScreen /> },
      { key: 'budgets', label: 'Budgets', glyph: 'grid', render: () => <ProducerDepartmentsScreen /> },
      ai,
    ];
    center = { icon: 'inbox', label: 'Inbox', badge: inbox, tab: { key: 'inbox', render: () => <ProducerInboxScreen /> } };
  }

  return <TabNavigator key={currentUser.id} tabs={tabs} center={center} renderRoute={renderRoute} />;
}
