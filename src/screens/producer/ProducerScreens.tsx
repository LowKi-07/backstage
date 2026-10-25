import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { DepartmentBudgetRow, ExpenseList, ExpenseRow, rowStyles } from '../../components/rows';
import { Avatar, Button, Card, Chip, ChipRow, EmptyState, Icon, ProgressBar, Screen, SectionTitle, Stat } from '../../components/ui';
import { useNav } from '../../navigation/Nav';
import { byNewest, categoryBreakdown, deptName, departmentSummary, isPending, projectSummary, sum, userName } from '../../store/selectors';
import { useStore } from '../../store/Store';
import { colors, space } from '../../theme';
import { formatCompact, formatINR, relativeDay } from '../../utils/format';

function ProfileAvatar() {
  const { currentUser } = useStore();
  const nav = useNav();
  return currentUser ? <Avatar name={currentUser.name} onPress={() => nav.push({ name: 'profile' })} dark /> : null;
}

export function ProducerOverviewScreen() {
  const { state } = useStore();
  const nav = useNav();
  const p = projectSummary(state);
  const cats = categoryBreakdown(state.expenses).slice(0, 6);
  const maxCat = cats[0]?.amount ?? 1;
  const depts = [...state.departments].sort((a, b) => departmentSummary(state, b.id).pct - departmentSummary(state, a.id).pct);
  const hot = depts.filter((d) => departmentSummary(state, d.id).pct >= 0.8);
  const inbox = state.expenses.filter((e) => e.status === 'escalated').length + state.budgetRequests.filter((r) => r.status === 'pending').length;
  const overrun = p.projectedTotal > p.totalBudget;

  return (
    <Screen title={state.project.name} subtitle={`${state.project.kind} · Day ${p.daysElapsed} of ${p.totalDays}`} right={<ProfileAvatar />}>
      <Card style={styles.hero}>
        <Text style={styles.heroLabel}>Spent so far</Text>
        <Text style={styles.heroValue}>{formatINR(p.spent)}</Text>
        <Text style={styles.heroSub}>
          of {formatCompact(p.totalBudget)} total budget · {Math.round(p.pct * 100)}%
        </Text>
        <View style={{ marginTop: space.md }}>
          <ProgressBar value={p.pct} pending={p.pending / p.totalBudget} height={10} />
        </View>
        <View style={{ flexDirection: 'row', marginTop: space.lg, gap: space.md }}>
          <Stat label="Remaining" value={formatCompact(p.remaining)} tone={colors.success} />
          <Stat label="Pending" value={formatCompact(p.pending)} tone={colors.warning} />
          <Stat label="Paid out" value={formatCompact(p.paid)} />
        </View>
      </Card>

      {inbox > 0 ? (
        <Card onPress={() => nav.setTab('inbox')} style={{ backgroundColor: colors.purpleSoft, borderColor: colors.purpleSoft }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
            <Icon name="mail-unread-outline" size={24} color={colors.purple} />
            <Text style={{ flex: 1, fontSize: 15, fontWeight: '700', color: colors.ink }}>{inbox} item{inbox > 1 ? 's' : ''} need your decision</Text>
            <Icon name="chevron-forward" size={20} color={colors.inkSoft} />
          </View>
        </Card>
      ) : null}

      <SectionTitle title="Burn rate" />
      <Card>
        <View style={{ flexDirection: 'row', gap: space.md }}>
          <Stat label="Per day" value={formatCompact(p.burnRate)} />
          <Stat label="Days left" value={`${p.daysLeft}`} hint="in schedule" />
          <Stat label="Projected" value={formatCompact(p.projectedTotal)} tone={overrun ? colors.danger : colors.success} hint={overrun ? 'over budget' : 'within budget'} />
        </View>
        <Text style={{ marginTop: space.md, fontSize: 13, color: colors.inkSoft, lineHeight: 18 }}>
          {overrun
            ? `At the current pace the production finishes ${formatCompact(p.projectedTotal - p.totalBudget)} over budget.`
            : `At the current pace you’ll finish with about ${formatCompact(p.totalBudget - p.projectedTotal)} to spare.`}{' '}
          {formatCompact(p.unallocated)} of the budget is not yet allocated to a department.
        </Text>
      </Card>

      {hot.length > 0 ? (
        <View style={styles.alert}>
          <Icon name="warning-outline" size={18} color={colors.warning} />
          <Text style={{ flex: 1, color: colors.ink, fontSize: 13.5 }}>
            {hot.map((d) => d.name).join(', ')} {hot.length > 1 ? 'have' : 'has'} used 80% or more of {hot.length > 1 ? 'their' : 'its'} budget.
          </Text>
        </View>
      ) : null}

      <SectionTitle title="Departments" action="All" onAction={() => nav.setTab('departments')} />
      <View style={rowStyles.listCard}>
        {depts.slice(0, 4).map((d, i) => (
          <View key={d.id}>
            {i > 0 ? <View style={[rowStyles.sep, { marginLeft: 0 }]} /> : null}
            <DepartmentBudgetRow dept={d} onPress={() => nav.push({ name: 'department', id: d.id })} />
          </View>
        ))}
      </View>

      <SectionTitle title="Top categories" />
      <Card style={{ gap: space.md }}>
        {cats.map((c) => (
          <View key={c.category} style={{ gap: 4 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 14, color: colors.ink }}>{c.category}</Text>
              <Text style={{ fontSize: 14, fontWeight: '700', color: colors.ink }}>{formatCompact(c.amount)}</Text>
            </View>
            <View style={styles.catTrack}>
              <View style={[styles.catBar, { width: `${(c.amount / maxCat) * 100}%` }]} />
            </View>
          </View>
        ))}
      </Card>
    </Screen>
  );
}

type InboxTab = 'escalations' | 'budget' | 'pay';

export function ProducerInboxScreen() {
  const { state, producerDecide, decideBudget, markPaid } = useStore();
  const [tab, setTab] = useState<InboxTab>('escalations');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);

  const escalated = state.expenses.filter((e) => e.status === 'escalated').sort(byNewest);
  const requests = state.budgetRequests.filter((r) => r.status === 'pending');
  const toPay = state.expenses.filter((e) => e.status === 'approved').sort(byNewest);

  return (
    <Screen title="Inbox" subtitle="Escalations, budget requests & payouts" right={<ProfileAvatar />}>
      <ChipRow>
        <Chip label="Escalations" count={escalated.length} active={tab === 'escalations'} onPress={() => setTab('escalations')} />
        <Chip label="Budget requests" count={requests.length} active={tab === 'budget'} onPress={() => setTab('budget')} />
        <Chip label="Ready to pay" count={toPay.length} active={tab === 'pay'} onPress={() => setTab('pay')} />
      </ChipRow>

      {message ? (
        <View style={{ backgroundColor: colors.successSoft, padding: space.md, borderRadius: 12 }}>
          <Text style={{ color: colors.success, fontWeight: '600' }}>{message}</Text>
        </View>
      ) : null}

      {tab === 'escalations' ? (
        escalated.length === 0 ? (
          <EmptyState icon="checkmark-done-circle-outline" title="No escalations" message="Spends above the approval threshold or over budget land here." />
        ) : (
          <View style={rowStyles.listCard}>
            {escalated.map((e, i) => {
              const s = departmentSummary(state, e.departmentId);
              return (
                <View key={e.id}>
                  {i > 0 ? <View style={rowStyles.sep} /> : null}
                  <ExpenseRow expense={e} />
                  <Text style={styles.context}>
                    {deptName(state, e.departmentId)} at {Math.round(s.pct * 100)}% → {Math.round(((s.spent + e.amount) / s.budget) * 100)}% if approved
                  </Text>
                  <View style={styles.actions}>
                    <Button label="Reject" small variant="danger" onPress={() => { producerDecide(e.id, 'reject', 'Rejected by producer'); setMessage('Rejected.'); }} style={{ flex: 1 }} />
                    <Button label="Approve" small variant="success" icon="checkmark" onPress={() => { producerDecide(e.id, 'approve'); setMessage(`Approved ${formatINR(e.amount)}.`); }} style={{ flex: 1 }} />
                  </View>
                </View>
              );
            })}
          </View>
        )
      ) : null}

      {tab === 'budget' ? (
        requests.length === 0 ? (
          <EmptyState icon="wallet-outline" title="No budget requests" message="Managers can ask for more budget from their department page." />
        ) : (
          requests.map((r) => {
            const s = departmentSummary(state, r.departmentId);
            return (
              <Card key={r.id} style={{ gap: space.sm }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: colors.ink }}>{deptName(state, r.departmentId)}</Text>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: colors.ink }}>+{formatINR(r.amount)}</Text>
                </View>
                <Text style={{ fontSize: 14, color: colors.ink, lineHeight: 20 }}>{r.reason}</Text>
                <Text style={{ fontSize: 12.5, color: colors.inkSoft }}>
                  {userName(state, r.requestedBy)} · {relativeDay(r.createdAt)} · budget {formatCompact(s.budget)} → {formatCompact(s.budget + r.amount)} · {Math.round(s.pct * 100)}% used
                </Text>
                <TextInput
                  placeholder="Note (optional)"
                  placeholderTextColor={colors.inkMuted}
                  value={notes[r.id] ?? ''}
                  onChangeText={(t) => setNotes((n) => ({ ...n, [r.id]: t }))}
                  style={styles.noteInput}
                />
                <View style={{ flexDirection: 'row', gap: space.sm }}>
                  <Button label="Decline" variant="danger" small onPress={() => { decideBudget(r.id, false, notes[r.id]); setMessage('Budget request declined.'); }} style={{ flex: 1 }} />
                  <Button label="Approve" variant="success" small icon="checkmark" onPress={() => { decideBudget(r.id, true, notes[r.id]); setMessage(`${deptName(state, r.departmentId)} budget increased by ${formatINR(r.amount)}.`); }} style={{ flex: 1 }} />
                </View>
              </Card>
            );
          })
        )
      ) : null}

      {tab === 'pay' ? (
        toPay.length === 0 ? (
          <EmptyState icon="cash-outline" title="Nothing to pay" message="Approved expenses waiting for reimbursement appear here." />
        ) : (
          <>
            <Card style={{ gap: space.sm }}>
              <Text style={{ fontSize: 13, color: colors.inkSoft }}>
                {toPay.length} approved · owed to {new Set(toPay.map((e) => e.userId)).size} people/vendors
              </Text>
              <Text style={{ fontSize: 24, fontWeight: '800', color: colors.ink }}>{formatINR(sum(toPay))}</Text>
              <Button
                label="Mark all as paid"
                icon="cash-outline"
                onPress={() => {
                  markPaid(toPay.map((e) => e.id), 'Bulk settlement');
                  setMessage(`${toPay.length} payments marked as paid.`);
                }}
              />
              <Text style={{ fontSize: 12, color: colors.inkMuted }}>Bank payout integration comes with the Finance module. For now this records the payment in the audit trail.</Text>
            </Card>
            <ExpenseList expenses={toPay} />
          </>
        )
      ) : null}
    </Screen>
  );
}

export function ProducerExpensesScreen() {
  const { state } = useStore();
  const [query, setQuery] = useState('');
  const [dept, setDept] = useState<string | 'all'>('all');
  const [status, setStatus] = useState<'all' | 'pending' | 'approved' | 'paid' | 'rejected'>('all');

  const q = query.trim().toLowerCase();
  const shown = state.expenses
    .filter(
      (e) =>
        (dept === 'all' || e.departmentId === dept) &&
        (status === 'all' || (status === 'pending' ? isPending(e) : e.status === status)) &&
        (!q ||
          e.description.toLowerCase().includes(q) ||
          (e.vendor ?? '').toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q) ||
          userName(state, e.userId).toLowerCase().includes(q)),
    )
    .sort(byNewest);

  return (
    <Screen title="All expenses" subtitle={`${shown.length} shown · ${formatINR(sum(shown))}`} right={<ProfileAvatar />}>
      <View style={styles.search}>
        <Icon name="search" size={18} color={colors.inkMuted} />
        <TextInput
          placeholder="Search vendor, person, description"
          placeholderTextColor={colors.inkMuted}
          value={query}
          onChangeText={setQuery}
          style={{ flex: 1, fontSize: 15, color: colors.ink, paddingVertical: 10 }}
        />
      </View>
      <ChipRow>
        <Chip label="All depts" active={dept === 'all'} onPress={() => setDept('all')} />
        {state.departments.map((d) => (
          <Chip key={d.id} label={d.name} active={dept === d.id} onPress={() => setDept(d.id)} />
        ))}
      </ChipRow>
      <ChipRow>
        {(['all', 'pending', 'approved', 'paid', 'rejected'] as const).map((s) => (
          <Chip key={s} label={s[0].toUpperCase() + s.slice(1)} active={status === s} onPress={() => setStatus(s)} />
        ))}
      </ChipRow>
      <ExpenseList expenses={shown} empty={<EmptyState icon="search-outline" title="No matching expenses" />} />
    </Screen>
  );
}

export function ProducerDepartmentsScreen() {
  const { state } = useStore();
  const nav = useNav();
  const p = projectSummary(state);
  return (
    <Screen title="Departments" subtitle={`${formatCompact(p.allocated)} allocated of ${formatCompact(p.totalBudget)}`} right={<ProfileAvatar />}>
      <View style={rowStyles.listCard}>
        {state.departments.map((d, i) => (
          <View key={d.id}>
            {i > 0 ? <View style={[rowStyles.sep, { marginLeft: 0 }]} /> : null}
            <DepartmentBudgetRow dept={d} onPress={() => nav.push({ name: 'department', id: d.id })} />
          </View>
        ))}
      </View>
      <Card>
        <Text style={{ fontSize: 13, color: colors.inkSoft }}>Unallocated reserve</Text>
        <Text style={{ fontSize: 20, fontWeight: '700', color: colors.ink, marginTop: 2 }}>{formatINR(p.unallocated)}</Text>
        <Text style={{ fontSize: 12.5, color: colors.inkMuted, marginTop: 4 }}>Approved budget requests are added on top of department allocations.</Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.surface },
  heroLabel: { fontSize: 13, color: colors.inkSoft, fontWeight: '600' },
  heroValue: { fontSize: 32, fontWeight: '800', color: colors.ink, marginTop: 2 },
  heroSub: { fontSize: 13, color: colors.inkSoft, marginTop: 2 },
  alert: { flexDirection: 'row', gap: space.sm, backgroundColor: colors.warningSoft, padding: space.md, borderRadius: 12, alignItems: 'center' },
  catTrack: { height: 6, backgroundColor: colors.track, borderRadius: 3, overflow: 'hidden' },
  catBar: { height: 6, backgroundColor: colors.brand, borderRadius: 3 },
  context: { fontSize: 12, color: colors.inkSoft, paddingHorizontal: space.lg, marginLeft: 52, marginTop: -6 },
  actions: { flexDirection: 'row', gap: space.sm, paddingHorizontal: space.lg, paddingVertical: space.md, marginLeft: 52 },
  noteInput: { borderWidth: 1, borderColor: colors.line, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: colors.ink },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: space.md,
  },
});
