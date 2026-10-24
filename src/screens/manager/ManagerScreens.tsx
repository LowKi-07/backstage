import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { DepartmentBudgetRow, ExpenseList, ExpenseRow, rowStyles } from '../../components/rows';
import { Avatar, Button, Card, Chip, ChipRow, EmptyState, Icon, Screen, SectionTitle, Stat } from '../../components/ui';
import { useNav } from '../../navigation/Nav';
import { byNewest, departmentSummary, isPending, managedDepartmentIds, sum } from '../../store/selectors';
import { useStore } from '../../store/Store';
import { colors, space } from '../../theme';
import { formatCompact, formatINR } from '../../utils/format';

function useManagerData() {
  const { state, currentUser } = useStore();
  const deptIds = managedDepartmentIds(state, currentUser);
  const depts = state.departments.filter((d) => deptIds.includes(d.id));
  const teamExpenses = state.expenses.filter((e) => deptIds.includes(e.departmentId)).sort(byNewest);
  // Managers never approve their own submissions.
  const toReview = teamExpenses.filter((e) => e.status === 'submitted' && e.userId !== currentUser?.id);
  return { state, currentUser, deptIds, depts, teamExpenses, toReview };
}

export function ManagerDashboardScreen() {
  const { state, currentUser, depts, teamExpenses, toReview } = useManagerData();
  const nav = useNav();
  if (!currentUser) return null;

  const totals = depts.reduce(
    (acc, d) => {
      const s = departmentSummary(state, d.id);
      return { budget: acc.budget + s.budget, spent: acc.spent + s.spent, pending: acc.pending + s.pending };
    },
    { budget: 0, spent: 0, pending: 0 },
  );
  const withProducer = teamExpenses.filter((e) => e.status === 'escalated');
  const myRequests = state.budgetRequests.filter((r) => r.requestedBy === currentUser.id && r.status === 'pending');

  return (
    <Screen
      title="Dashboard"
      subtitle={depts.map((d) => d.name).join(' · ')}
      right={<Avatar name={currentUser.name} onPress={() => nav.push({ name: 'profile' })} dark />}
    >
      {toReview.length > 0 ? (
        <Card onPress={() => nav.setTab('approvals')} style={{ backgroundColor: colors.warningSoft, borderColor: colors.warningSoft }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
            <Icon name="time-outline" size={26} color={colors.warning} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.ink }}>
                {toReview.length} expense{toReview.length > 1 ? 's' : ''} need your approval
              </Text>
              <Text style={{ fontSize: 13, color: colors.inkSoft }}>{formatINR(sum(toReview))} in total</Text>
            </View>
            <Icon name="chevron-forward" size={20} color={colors.inkSoft} />
          </View>
        </Card>
      ) : null}

      <Card>
        <View style={{ flexDirection: 'row', gap: space.md }}>
          <Stat label="Spent" value={formatCompact(totals.spent)} />
          <Stat label="Budget" value={formatCompact(totals.budget)} />
          <Stat label="Remaining" value={formatCompact(totals.budget - totals.spent)} tone={colors.success} />
        </View>
        <Text style={{ marginTop: space.md, color: colors.inkSoft, fontSize: 13 }}>
          {withProducer.length > 0 ? `${withProducer.length} escalated to producer · ` : ''}
          {myRequests.length > 0 ? `${myRequests.length} budget request pending · ` : ''}
          {formatCompact(totals.pending)} awaiting approval
        </Text>
      </Card>

      <SectionTitle title="Department budgets" action="Request budget" onAction={() => nav.push({ name: 'budgetRequest' })} />
      <View style={rowStyles.listCard}>
        {depts.map((d, i) => (
          <View key={d.id}>
            {i > 0 ? <View style={[rowStyles.sep, { marginLeft: 0 }]} /> : null}
            <DepartmentBudgetRow dept={d} onPress={() => nav.push({ name: 'department', id: d.id })} />
          </View>
        ))}
      </View>

      <SectionTitle title="Latest from the team" action="See all" onAction={() => nav.setTab('expenses')} />
      <ExpenseList expenses={teamExpenses.slice(0, 5)} empty={<EmptyState icon="receipt-outline" title="No expenses yet" />} />

      <Button label="Log my own expense" icon="add" variant="secondary" onPress={() => nav.push({ name: 'newExpense' })} />
    </Screen>
  );
}

export function ManagerApprovalsScreen() {
  const { state, currentUser, toReview, teamExpenses } = useManagerData();
  const { managerDecide } = useStore();
  const nav = useNav();
  const [message, setMessage] = useState<string | null>(null);
  if (!currentUser) return null;

  const threshold = state.project.escalationThreshold;
  const quick = toReview.filter((e) => e.amount <= threshold);
  const escalated = teamExpenses.filter((e) => e.status === 'escalated');

  const approve = (id: string) => {
    const result = managerDecide(id, 'approve');
    setMessage(result === 'escalated' ? 'Approved and forwarded to the producer (over threshold or budget).' : 'Approved.');
  };

  const approveAll = () => {
    let forwarded = 0;
    quick.forEach((e) => {
      if (managerDecide(e.id, 'approve') === 'escalated') forwarded++;
    });
    setMessage(`Approved ${quick.length - forwarded} expense${quick.length - forwarded === 1 ? '' : 's'}${forwarded ? `, ${forwarded} forwarded to producer` : ''}.`);
  };

  return (
    <Screen
      title="Approvals"
      subtitle={`${toReview.length} waiting · ${formatINR(sum(toReview))}`}
      right={<Avatar name={currentUser.name} onPress={() => nav.push({ name: 'profile' })} dark />}
    >
      {message ? (
        <View style={{ backgroundColor: colors.successSoft, padding: space.md, borderRadius: 12 }}>
          <Text style={{ color: colors.success, fontWeight: '600' }}>{message}</Text>
        </View>
      ) : null}

      {quick.length > 1 ? (
        <Button label={`Approve all ${quick.length} under ${formatCompact(threshold)}`} icon="checkmark-done" variant="success" onPress={approveAll} />
      ) : null}

      {toReview.length === 0 ? (
        <EmptyState icon="checkmark-done-circle-outline" title="All caught up" message="New expenses from your team will show up here." />
      ) : (
        <View style={rowStyles.listCard}>
          {toReview.map((e, i) => (
            <View key={e.id}>
              {i > 0 ? <View style={rowStyles.sep} /> : null}
              <ExpenseRow expense={e} />
              <View style={{ flexDirection: 'row', gap: space.sm, paddingHorizontal: space.lg, paddingBottom: space.md, marginLeft: 52 }}>
                <Button label="Review" small variant="secondary" onPress={() => nav.push({ name: 'expense', id: e.id })} style={{ flex: 1 }} />
                <Button label="Approve" small variant="success" icon="checkmark" onPress={() => approve(e.id)} style={{ flex: 1 }} />
              </View>
              {e.amount > threshold ? (
                <Text style={{ fontSize: 12, color: colors.purple, paddingHorizontal: space.lg, paddingBottom: space.md, marginLeft: 52, marginTop: -6 }}>
                  Over {formatCompact(threshold)} – will also need producer sign-off
                </Text>
              ) : null}
            </View>
          ))}
        </View>
      )}

      {escalated.length > 0 ? (
        <>
          <SectionTitle title="Waiting on producer" />
          <ExpenseList expenses={escalated} />
        </>
      ) : null}
    </Screen>
  );
}

export function ManagerExpensesScreen() {
  const { state, currentUser, depts, teamExpenses } = useManagerData();
  const nav = useNav();
  const [dept, setDept] = useState<string | 'all'>('all');
  const [status, setStatus] = useState<'all' | 'pending' | 'approved' | 'paid' | 'rejected'>('all');
  if (!currentUser) return null;

  const shown = teamExpenses.filter(
    (e) =>
      (dept === 'all' || e.departmentId === dept) &&
      (status === 'all' || (status === 'pending' ? isPending(e) : e.status === status)),
  );

  return (
    <Screen
      title="Team expenses"
      subtitle={`${shown.length} shown · ${formatINR(sum(shown))}`}
      right={<Avatar name={currentUser.name} onPress={() => nav.push({ name: 'profile' })} dark />}
    >
      {depts.length > 1 ? (
        <ChipRow>
          <Chip label="All depts" active={dept === 'all'} onPress={() => setDept('all')} />
          {depts.map((d) => (
            <Chip key={d.id} label={d.name} active={dept === d.id} onPress={() => setDept(d.id)} />
          ))}
        </ChipRow>
      ) : null}
      <ChipRow>
        {(['all', 'pending', 'approved', 'paid', 'rejected'] as const).map((s) => (
          <Chip key={s} label={s[0].toUpperCase() + s.slice(1)} active={status === s} onPress={() => setStatus(s)} />
        ))}
      </ChipRow>
      <ExpenseList expenses={shown} empty={<EmptyState icon="file-tray-outline" title="No matching expenses" />} />
      <Text style={{ fontSize: 12, color: colors.inkMuted, textAlign: 'center' }}>
        {state.project.name} · {depts.map((d) => d.name).join(', ')}
      </Text>
    </Screen>
  );
}
