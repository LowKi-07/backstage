import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ProjectCard } from '../../components/project';
import { Text } from '../../components/Text';
import { projectListing } from '../../data/projects';
import { BudgetRequestRow, DepartmentCard, ExpenseCard, ExpenseList } from '../../components/rows';
import { Button, Chip, ChipRow, EmptyState, Hero, Money, Notice, Screen, SectionTitle, Segmented } from '../../components/ui';
import { useNav } from '../../navigation/Nav';
import { byNewest, departmentSummary, isPending, managedDepartmentIds, sum } from '../../store/selectors';
import { useStore } from '../../store/Store';
import { colors, font, radius, shadow, space } from '../../theme';
import { Expense } from '../../types';
import { formatCompact, formatINR, relativeDay } from '../../utils/format';

function useManagerData() {
  const { state, currentUser } = useStore();
  const deptIds = managedDepartmentIds(state, currentUser);
  const depts = state.departments.filter((d) => deptIds.includes(d.id));
  const teamExpenses = state.expenses.filter((e) => deptIds.includes(e.departmentId)).sort(byNewest);
  // Managers never approve their own submissions.
  const toReview = teamExpenses.filter((e) => e.status === 'submitted' && e.userId !== currentUser?.id);
  return { state, currentUser, deptIds, depts, teamExpenses, toReview };
}

// Approve from a list, and say plainly when the approval was forwarded to the producer.
function useQuickApprove() {
  const { managerDecide } = useStore();
  const [message, setMessage] = useState<string | null>(null);
  const approve = (e: Expense) => {
    const result = managerDecide(e.id, 'approve');
    setMessage(result === 'escalated' ? `${formatINR(e.amount)} approved and sent to the producer for final sign-off.` : `${formatINR(e.amount)} approved.`);
  };
  return { message, setMessage, approve };
}

function approvalNote(e: Expense, threshold: number) {
  return e.amount > threshold ? { note: `Over ${formatCompact(threshold)}`, color: colors.escalated } : { note: relativeDay(e.date), color: colors.pending };
}

export function ManagerDashboardScreen() {
  const { state, currentUser, depts, toReview } = useManagerData();
  const nav = useNav();
  if (!currentUser) return null;

  const totals = depts.reduce(
    (acc, d) => {
      const s = departmentSummary(state, d.id);
      return { budget: acc.budget + s.budget, spent: acc.spent + s.spent };
    },
    { budget: 0, spent: 0 },
  );
  const threshold = state.project.escalationThreshold;
  const overLimit = toReview.filter((e) => e.amount > threshold).length;
  const hour = new Date().getHours();
  const hello = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <Screen>
      <Text style={dashStyles.greeting}>
        {hello}, {currentUser.name.split(' ')[0]}
      </Text>
      <ProjectCard
        listing={projectListing(state.selectedProjectId)}
        onPress={() => nav.push({ name: 'projects' })}
        detail={
          <Text style={dashStyles.detail} numberOfLines={2}>
            You manage <Text style={dashStyles.detailStrong}>{depts.map((d) => d.name).join(' · ')}</Text>
          </Text>
        }
      />

      <View style={dashStyles.review}>
        <View style={{ flex: 1, gap: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={[dashStyles.dot, { backgroundColor: toReview.length ? colors.pending : colors.positive }]} />
            <Text style={[dashStyles.reviewLabel, { color: toReview.length ? colors.pending : colors.positive }]}>{toReview.length ? 'Pending your review' : 'All caught up'}</Text>
          </View>
          <Money value={sum(toReview)} size={28} display />
          <Text style={dashStyles.detail}>
            {toReview.length} {toReview.length === 1 ? 'bill' : 'bills'}
            {overLimit ? ` · ${overLimit} over ${formatCompact(threshold)}` : ''}
          </Text>
        </View>
        {toReview.length ? <Button label="Review" small onPress={() => nav.setTab('approvals')} style={{ minWidth: 104 }} /> : null}
      </View>

      <SectionTitle title="Money matters" />
      <View style={{ flexDirection: 'row', gap: space.sm }}>
        <MiniStat label="Remaining" value={formatCompact(totals.budget - totals.spent)} tone={colors.positive} />
        <MiniStat label="Spent" value={formatCompact(totals.spent)} />
        <MiniStat label="Budget" value={formatCompact(totals.budget)} />
      </View>

      <SectionTitle title="Department budgets" action="Request more" onAction={() => nav.push({ name: 'budgetRequest' })} />
      <View style={{ gap: space.md }}>
        {depts.map((d) => (
          <DepartmentCard key={d.id} dept={d} onPress={() => nav.push({ name: 'department', id: d.id })} />
        ))}
      </View>
    </Screen>
  );
}

function MiniStat({ label: text, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <View style={dashStyles.mini}>
      <Text style={dashStyles.miniLabel}>{text}</Text>
      <Text style={[dashStyles.miniValue, tone ? { color: tone } : null]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const dashStyles = StyleSheet.create({
  greeting: { fontFamily: font.display, fontSize: 22, color: colors.ink, letterSpacing: -0.5 },
  detail: { fontFamily: font.regular, fontSize: 13, color: colors.inkSoft },
  detailStrong: { fontFamily: font.bold, fontSize: 13, color: colors.ink },
  review: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg, borderRadius: radius.lg, backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.lineSoft },
  dot: { width: 7, height: 7, borderRadius: 4 },
  reviewLabel: { fontFamily: font.semibold, fontSize: 13 },
  mini: { flex: 1, gap: 2, padding: space.md, borderRadius: radius.md, backgroundColor: colors.surface, boxShadow: shadow.soft },
  miniLabel: { fontFamily: font.regular, fontSize: 12.5, color: colors.inkSoft },
  miniValue: { fontFamily: font.bold, fontSize: 17, color: colors.ink },
});

export function ManagerApprovalsScreen() {
  const { state, currentUser, toReview, teamExpenses } = useManagerData();
  const { managerDecide } = useStore();
  const { message, setMessage, approve } = useQuickApprove();
  const [tab, setTab] = useState<'review' | 'producer'>('review');
  if (!currentUser) return null;

  const threshold = state.project.escalationThreshold;
  const quick = toReview.filter((e) => e.amount <= threshold);
  const escalated = teamExpenses.filter((e) => e.status === 'escalated');

  const approveAll = () => {
    let forwarded = 0;
    quick.forEach((e) => {
      if (managerDecide(e.id, 'approve') === 'escalated') forwarded++;
    });
    const done = quick.length - forwarded;
    setMessage(`Approved ${done} ${done === 1 ? 'bill' : 'bills'}${forwarded ? `, ${forwarded} sent to the producer` : ''}.`);
  };

  return (
    <Screen title="approvals">
      <Segmented
        options={[
          { key: 'review', label: `To review ${toReview.length}` },
          { key: 'producer', label: `With producer ${escalated.length}` },
        ]}
        value={tab}
        onChange={setTab}
      />

      {message ? <Notice text={message} tone={colors.positive} /> : null}

      {tab === 'review' ? (
        toReview.length === 0 ? (
          <EmptyState icon="check-double" title="all caught up" message="New expenses from your team will show up here." />
        ) : (
          <>
            <Hero lines={[`${toReview.length} ${toReview.length === 1 ? 'bill' : 'bills'} to review`]} amount={sum(toReview)} />
            {quick.length > 1 ? <Button label={`Approve all ${quick.length} under ${formatCompact(threshold)}`} icon="check-double" variant="outline" onPress={approveAll} /> : null}
            <View style={{ gap: space.md }}>
              {toReview.map((e) => {
                const n = approvalNote(e, threshold);
                return <ExpenseCard key={e.id} expense={e} actionLabel={`Approve ${formatINR(e.amount)}`} onAction={() => approve(e)} note={n.note} noteColor={n.color} />;
              })}
            </View>
            <Notice text="Tap a bill to see the receipt, reject it with a reason, or send it to the producer." tone={colors.inkSoft} />
          </>
        )
      ) : escalated.length === 0 ? (
        <EmptyState icon="inbox" title="nothing with the producer" message={`Bills over ${formatCompact(threshold)} or over budget wait here for the producer.`} />
      ) : (
        <View style={{ gap: space.md }}>
          {escalated.map((e) => (
            <ExpenseCard key={e.id} expense={e} />
          ))}
        </View>
      )}
    </Screen>
  );
}

export function ManagerExpensesScreen() {
  const { currentUser, depts, teamExpenses } = useManagerData();
  const [dept, setDept] = useState<string | 'all'>('all');
  const [status, setStatus] = useState<'all' | 'pending' | 'approved' | 'paid' | 'rejected'>('all');
  if (!currentUser) return null;

  const shown = teamExpenses.filter((e) => (dept === 'all' || e.departmentId === dept) && (status === 'all' || (status === 'pending' ? isPending(e) : e.status === status)));

  return (
    <Screen title="team expenses" subtitle={`${shown.length} bills · ${formatINR(sum(shown))}`}>
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
          <Chip key={s} label={s} active={status === s} onPress={() => setStatus(s)} />
        ))}
      </ChipRow>
      <ExpenseList expenses={shown} empty={<EmptyState icon="inbox" title="no matching expenses" />} />
    </Screen>
  );
}

export function ManagerBudgetsScreen() {
  const { state, currentUser, depts, deptIds } = useManagerData();
  const nav = useNav();
  if (!currentUser) return null;
  const requests = state.budgetRequests.filter((r) => deptIds.includes(r.departmentId));
  const budget = depts.reduce((a, d) => a + d.budget, 0);

  return (
    <Screen title="budgets" subtitle={`${depts.length} departments · ${formatCompact(budget)} allocated`}>
      <View style={{ gap: space.md }}>
        {depts.map((d) => (
          <DepartmentCard key={d.id} dept={d} onPress={() => nav.push({ name: 'department', id: d.id })} />
        ))}
      </View>
      <Button label="Request more budget" icon="plus" variant="outline" onPress={() => nav.push({ name: 'budgetRequest' })} />
      <SectionTitle title="budget requests" />
      {requests.length ? (
        requests.map((r) => <BudgetRequestRow key={r.id} request={r} />)
      ) : (
        <EmptyState icon="trending" title="no requests yet" message="Ask the producer for more budget when a department runs short." />
      )}
    </Screen>
  );
}
