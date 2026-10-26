import React from 'react';
import { CrewExpensesScreen, CrewHomeScreen } from '../screens/crew/CrewScreens';
import { AiChatScreen } from '../screens/shared/AiChatScreen';
import { BudgetRequestScreen } from '../screens/manager/BudgetRequestScreen';
import { ManagerApprovalsScreen, ManagerDashboardScreen, ManagerExpensesScreen } from '../screens/manager/ManagerScreens';
import { ProducerDepartmentsScreen, ProducerExpensesScreen, ProducerInboxScreen, ProducerOverviewScreen } from '../screens/producer/ProducerScreens';
import { DepartmentScreen } from '../screens/shared/DepartmentScreen';
import { ExpenseDetailScreen } from '../screens/shared/ExpenseDetailScreen';
import { NewExpenseScreen } from '../screens/shared/NewExpenseScreen';
import { ProfileScreen } from '../screens/shared/ProfileScreen';
import { managedDepartmentIds } from '../store/selectors';
import { useStore } from '../store/Store';
import { Route, TabDef, TabNavigator } from './Nav';

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

export function RoleNavigator() {
  const { state, currentUser } = useStore();
  if (!currentUser) return null;

  let tabs: TabDef[];
  if (currentUser.role === 'crew') {
    tabs = [
      { key: 'home', label: 'Home', icon: 'home-outline', render: () => <CrewHomeScreen /> },
      { key: 'expenses', label: 'My Expenses', icon: 'receipt-outline', render: () => <CrewExpensesScreen /> },
      { key: 'ai', label: 'Ask AI', icon: 'sparkles-outline', render: () => <AiChatScreen /> },
      { key: 'profile', label: 'Profile', icon: 'person-circle-outline', render: () => <ProfileScreen embedded /> },
    ];
  } else if (currentUser.role === 'manager') {
    const ids = managedDepartmentIds(state, currentUser);
    const waiting = state.expenses.filter((e) => ids.includes(e.departmentId) && e.status === 'submitted' && e.userId !== currentUser.id).length;
    tabs = [
      { key: 'dashboard', label: 'Dashboard', icon: 'grid-outline', render: () => <ManagerDashboardScreen /> },
      { key: 'approvals', label: 'Approvals', icon: 'checkmark-circle-outline', badge: waiting, render: () => <ManagerApprovalsScreen /> },
      { key: 'expenses', label: 'Expenses', icon: 'receipt-outline', render: () => <ManagerExpensesScreen /> },
      { key: 'ai', label: 'Ask AI', icon: 'sparkles-outline', render: () => <AiChatScreen /> },
    ];
  } else {
    const inbox = state.expenses.filter((e) => e.status === 'escalated').length + state.budgetRequests.filter((r) => r.status === 'pending').length;
    tabs = [
      { key: 'overview', label: 'Overview', icon: 'pie-chart-outline', render: () => <ProducerOverviewScreen /> },
      { key: 'inbox', label: 'Inbox', icon: 'mail-outline', badge: inbox, render: () => <ProducerInboxScreen /> },
      { key: 'expenses', label: 'Expenses', icon: 'receipt-outline', render: () => <ProducerExpensesScreen /> },
      { key: 'ai', label: 'Ask AI', icon: 'sparkles-outline', render: () => <AiChatScreen /> },
      { key: 'departments', label: 'Departments', icon: 'layers-outline', render: () => <ProducerDepartmentsScreen /> },
    ];
  }

  return <TabNavigator key={currentUser.id} tabs={tabs} renderRoute={renderRoute} />;
}
