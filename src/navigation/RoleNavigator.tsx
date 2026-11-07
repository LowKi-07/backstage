import React from 'react';
import { AddChoiceSheet } from '../screens/crew/AddChoiceSheet';
import { CrewExpensesScreen, CrewHomeScreen, CrewPayoutsScreen } from '../screens/crew/CrewScreens';
import { ReviewExpenseScreen } from '../screens/crew/ReviewExpenseScreen';
import { VoiceExpenseScreen } from '../screens/crew/VoiceExpenseScreen';
import { BudgetRequestScreen } from '../screens/manager/BudgetRequestScreen';
import { ManagerApprovalsScreen, ManagerBudgetsScreen, ManagerDashboardScreen, ManagerExpensesScreen } from '../screens/manager/ManagerScreens';
import { ProducerDepartmentsScreen, ProducerExpensesScreen, ProducerInboxScreen, ProducerOverviewScreen } from '../screens/producer/ProducerScreens';
import { AiChatScreen } from '../screens/shared/AiChatScreen';
import { DepartmentScreen } from '../screens/shared/DepartmentScreen';
import { ExpenseDetailScreen } from '../screens/shared/ExpenseDetailScreen';
import { NewExpenseScreen, SubmittedScreen } from '../screens/shared/NewExpenseScreen';
import { ProjectPickerScreen } from '../screens/shared/ProjectPickerScreen';
import { ProfileScreen } from '../screens/shared/ProfileScreen';
import { managedDepartmentIds } from '../store/selectors';
import { useStore } from '../store/Store';
import { CenterDef, Route, TabDef, TabNavigator } from './Nav';

function renderRoute(r: Route) {
  switch (r.name) {
    case 'expense':
      return <ExpenseDetailScreen key={r.id} id={r.id} />;
    case 'newExpense':
      return <NewExpenseScreen draft={r.draft} />;
    case 'voiceExpense':
      return <VoiceExpenseScreen />;
    case 'reviewExpense':
      return <ReviewExpenseScreen draft={r.draft} />;
    case 'submitted':
      return <SubmittedScreen key={r.id} id={r.id} />;
    case 'projects':
      return <ProjectPickerScreen pushed />;
    case 'payouts':
      return <CrewPayoutsScreen pushed />;
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
  let initialTab: string | undefined;
  if (currentUser.role === 'crew') {
    tabs = [
      { key: 'home', label: 'Home', glyph: 'home', render: () => <CrewHomeScreen /> },
      { key: 'expenses', label: 'Expenses', glyph: 'wallet', render: () => <CrewExpensesScreen /> },
      { key: 'project', label: 'Project', glyph: 'receipt', render: () => <ProjectPickerScreen /> },
      ai,
    ];
    center = { icon: 'plus', label: 'Add expense', sheet: (close, nav) => <AddChoiceSheet close={close} nav={nav} /> };
    // Crew pick a project right after signing in.
    if (!state.selectedProjectId) initialTab = 'project';
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

  return <TabNavigator key={currentUser.id} tabs={tabs} center={center} renderRoute={renderRoute} initialTab={initialTab} />;
}
