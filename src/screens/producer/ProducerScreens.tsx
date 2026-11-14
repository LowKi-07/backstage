import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon } from '../../components/icons';
import { DepartmentCard, ExpenseCard, ExpenseList } from '../../components/rows';
import { Text, TextInput } from '../../components/Text';
import { Button, Card, Chip, ChipRow, EmptyState, Hero, InfoPill, Money, Notice, ProgressBar, Screen, SectionTitle, Segmented, Stat } from '../../components/ui';
import { useNav } from '../../navigation/Nav';
import { byNewest, categoryBreakdown, deptName, departmentSummary, isPending, projectSummary, sum, userName } from '../../store/selectors';
import { useStore } from '../../store/Store';
import { colors, font, radius, shadow, space } from '../../theme';
import { Expense } from '../../types';
import { formatCompact, formatINR, relativeDay } from '../../utils/format';

function escalationNote(state: ReturnType<typeof useStore>['state'], e: Expense) {
  const s = departmentSummary(state, e.departmentId);
  return s.spent + e.amount > s.budget ? { note: 'Over budget', color: colors.negative } : { note: relativeDay(e.date), color: colors.escalated };
}

export function ProducerOverviewScreen() {
  const { state, producerDecide, addComment } = useStore();
  const [openId, setOpenId] = useState<string | null>(null);
  const nav = useNav();
  const [message, setMessage] = useState<string | null>(null);
  const p = projectSummary(state);
  const cats = categoryBreakdown(state.expenses).slice(0, 5);
  const maxCat = cats[0]?.amount ?? 1;
  const depts = [...state.departments].sort((a, b) => departmentSummary(state, b.id).pct - departmentSummary(state, a.id).pct);
  const hot = depts.filter((d) => departmentSummary(state, d.id).pct >= 0.8);
  const escalated = state.expenses.filter((e) => e.status === 'escalated').sort(byNewest);
  const requests = state.budgetRequests.filter((r) => r.status === 'pending');
  const overrun = p.projectedTotal > p.totalBudget;

  return (
    <Screen>
      <Hero eyebrow={`${state.project.kind} · day ${p.daysElapsed} of ${p.totalDays}`} lines={['spent so far']} amount={p.spent}>
        <Text style={styles.heroSub}>
          of {formatCompact(p.totalBudget)} budget · {Math.round(p.pct * 100)}% used
        </Text>
        <View style={{ alignSelf: 'stretch', marginTop: space.md }}>
          <ProgressBar value={p.pct} pending={p.pending / p.totalBudget} height={5} />
        </View>
      </Hero>

      <SectionTitle title="money matters" />
      <ChipRow>
        <InfoPill icon="wallet" label="remaining" value={formatCompact(p.remaining)} onPress={() => nav.setTab('budgets')} />
        <InfoPill icon="clock" label="pending" value={formatCompact(p.pending)} valueColor={colors.pending} onPress={() => nav.setTab('expenses')} />
        <InfoPill icon="banknote" label="paid out" value={formatCompact(p.paid)} valueColor={colors.ink} onPress={() => nav.setTab('expenses')} />
      </ChipRow>

      {message ? <Notice text={message} tone={colors.positive} /> : null}

      {escalated.length || requests.length ? (
        <>
          <SectionTitle title={`needs your decision (${escalated.length + requests.length})`} action="view all" onAction={() => nav.setTab('inbox')} />
          <View style={{ gap: space.md }}>
            {escalated.slice(0, 3).map((e) => {
              const n = escalationNote(state, e);
              return (
                <ExpenseCard
                  key={e.id}
                  expense={e}
                  open={openId === e.id}
                  onToggle={() => setOpenId((c) => (c === e.id ? null : e.id))}
                  actions={{
                    approve: () => {
                      producerDecide(e.id, 'approve');
                      setMessage(`Approved ${formatINR(e.amount)}. It’s ready to pay.`);
                    },
                    decline: (r) => {
                      if (r) addComment(e.id, r);
                        producerDecide(e.id, 'reject', r ?? 'Declined by producer');
                      setMessage(`Declined ${formatINR(e.amount)}.`);
                    },
                    comment: (t) => {
                      addComment(e.id, t);
                      setMessage('Comment sent.');
                    },
                  }}
                  note={n.note}
                  noteColor={n.color}
                />
              );
            })}
            {requests.length ? (
              <Card onPress={() => nav.setTab('inbox')} style={styles.requestTeaser}>
                <Icon name="trending" size={22} />
                <Text style={styles.teaserText}>
                  {requests.length} budget {requests.length === 1 ? 'request' : 'requests'} · {formatINR(requests.reduce((a, r) => a + r.amount, 0))}
                </Text>
                <Icon name="chevron-right" size={20} color={colors.inkSoft} />
              </Card>
            ) : null}
          </View>
        </>
      ) : null}

      <SectionTitle title="burn rate" />
      <Card style={{ gap: space.md }}>
        <View style={{ flexDirection: 'row', gap: space.md }}>
          <Stat label="per day" value={formatCompact(p.burnRate)} />
          <Stat label="days left" value={`${p.daysLeft}`} />
          <Stat label="projected" value={formatCompact(p.projectedTotal)} tone={overrun ? colors.negative : colors.positive} />
        </View>
        <Text style={styles.body}>
          {overrun
            ? `At this pace the shoot wraps ${formatCompact(p.projectedTotal - p.totalBudget)} over budget.`
            : `At this pace you wrap with about ${formatCompact(p.totalBudget - p.projectedTotal)} to spare.`}{' '}
          {formatCompact(p.unallocated)} is still unallocated.
        </Text>
      </Card>

      {hot.length ? <Notice text={`${hot.map((d) => d.name).join(', ')} ${hot.length > 1 ? 'have' : 'has'} used 80% or more of the budget.`} tone={colors.pending} /> : null}

      <SectionTitle title="departments" action="view all" onAction={() => nav.setTab('budgets')} />
      <View style={{ gap: space.md }}>
        {depts.slice(0, 3).map((d) => (
          <DepartmentCard key={d.id} dept={d} onPress={() => nav.push({ name: 'department', id: d.id })} />
        ))}
      </View>

      <SectionTitle title="top categories" />
      <Card style={{ gap: space.lg }}>
        {cats.map((c) => (
          <View key={c.category} style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={styles.catName}>{c.category.toLowerCase()}</Text>
              <Text style={styles.catAmt}>{formatCompact(c.amount)}</Text>
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
  const { state, producerDecide, decideBudget, markPaid, addComment } = useStore();
  const [openId, setOpenId] = useState<string | null>(null);
  const [tab, setTab] = useState<InboxTab>('escalations');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);

  const escalated = state.expenses.filter((e) => e.status === 'escalated').sort(byNewest);
  const requests = state.budgetRequests.filter((r) => r.status === 'pending');
  const toPay = state.expenses.filter((e) => e.status === 'approved').sort(byNewest);

  return (
    <Screen title="inbox">
      <Segmented
        options={[
          { key: 'escalations', label: `Approve ${escalated.length}` },
          { key: 'budget', label: `Budget ${requests.length}` },
          { key: 'pay', label: `Pay ${toPay.length}` },
        ]}
        value={tab}
        onChange={(k) => {
          setTab(k);
          setMessage(null);
        }}
      />

      {message ? <Notice text={message} tone={colors.positive} /> : null}

      {tab === 'escalations' ? (
        escalated.length === 0 ? (
          <EmptyState icon="check-double" title="no escalations" message="Spends above the approval limit, or over a department budget, land here." />
        ) : (
          <>
            <Hero lines={[`${escalated.length} ${escalated.length === 1 ? 'bill' : 'bills'} need you`]} amount={sum(escalated)} />
            <View style={{ gap: space.md }}>
              {escalated.map((e) => {
                const n = escalationNote(state, e);
                return (
                  <ExpenseCard
                    key={e.id}
                    expense={e}
                    open={openId === e.id}
                    onToggle={() => setOpenId((c) => (c === e.id ? null : e.id))}
                    actions={{
                      approve: () => {
                        producerDecide(e.id, 'approve');
                        setMessage(`Approved ${formatINR(e.amount)}.`);
                      },
                      decline: (r) => {
                        if (r) addComment(e.id, r);
                        producerDecide(e.id, 'reject', r ?? 'Declined by producer');
                        setMessage(`Declined ${formatINR(e.amount)}.`);
                      },
                      comment: (t) => {
                        addComment(e.id, t);
                        setMessage('Comment sent.');
                      },
                    }}
                    note={n.note}
                    noteColor={n.color}
                  />
                );
              })}
            </View>
            <Notice text="Tap a bill to see the receipt and its history, or to reject it with a reason." tone={colors.inkSoft} />
          </>
        )
      ) : null}

      {tab === 'budget' ? (
        requests.length === 0 ? (
          <EmptyState icon="trending" title="no budget requests" message="Managers can ask for more budget from their Budgets tab." />
        ) : (
          requests.map((r) => {
            const s = departmentSummary(state, r.departmentId);
            return (
              <Card key={r.id} style={{ gap: space.md }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.reqDept}>{deptName(state, r.departmentId)}</Text>
                  <Money value={r.amount} size={21} display signed />
                </View>
                <Text style={styles.body}>{r.reason}</Text>
                <Text style={styles.meta}>
                  {userName(state, r.requestedBy)} · {relativeDay(r.createdAt)} · {formatCompact(s.budget)} → {formatCompact(s.budget + r.amount)} · {Math.round(s.pct * 100)}% used
                </Text>
                <TextInput
                  placeholder="Add a note (optional)"
                  value={notes[r.id] ?? ''}
                  onChangeText={(t) => setNotes((n) => ({ ...n, [r.id]: t }))}
                  style={styles.noteInput}
                />
                <View style={{ flexDirection: 'row', gap: space.sm }}>
                  <Button
                    label="Decline"
                    variant="danger"
                    small
                    onPress={() => {
                      decideBudget(r.id, false, notes[r.id]);
                      setMessage('Budget request declined.');
                    }}
                    style={{ flex: 1 }}
                  />
                  <Button
                    label="Approve"
                    small
                    onPress={() => {
                      decideBudget(r.id, true, notes[r.id]);
                      setMessage(`${deptName(state, r.departmentId)} budget raised by ${formatINR(r.amount)}.`);
                    }}
                    style={{ flex: 2 }}
                  />
                </View>
              </Card>
            );
          })
        )
      ) : null}

      {tab === 'pay' ? (
        toPay.length === 0 ? (
          <EmptyState icon="banknote" title="nothing to pay" message="Approved expenses waiting for reimbursement appear here." />
        ) : (
          <>
            <Hero lines={['ready to pay']} amount={sum(toPay)}>
              <Text style={styles.heroSub}>
                {toPay.length} approved · {new Set(toPay.map((e) => e.userId)).size} people
              </Text>
              <Button
                label="Mark all as paid"
                onPress={() => {
                  markPaid(
                    toPay.map((e) => e.id),
                    'Bulk settlement',
                  );
                  setMessage(`${toPay.length} payments marked as paid.`);
                }}
                style={{ marginTop: space.lg, minWidth: 220 }}
              />
            </Hero>
            <Notice text="Bank payouts arrive with the finance module. For now this records the payment in each bill’s history." tone={colors.inkSoft} />
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
    <Screen title="all expenses" subtitle={`${shown.length} bills · ${formatINR(sum(shown))}`}>
      <View style={styles.search}>
        <Icon name="search" size={22} strokeWidth={1.5} />
        <TextInput placeholder="vendor, person or description" value={query} onChangeText={setQuery} style={styles.searchInput} accessibilityLabel="Search expenses" />
      </View>
      <ChipRow>
        <Chip label="All depts" active={dept === 'all'} onPress={() => setDept('all')} />
        {state.departments.map((d) => (
          <Chip key={d.id} label={d.name} active={dept === d.id} onPress={() => setDept(d.id)} />
        ))}
      </ChipRow>
      <ChipRow>
        {(['all', 'pending', 'approved', 'paid', 'rejected'] as const).map((s) => (
          <Chip key={s} label={s} active={status === s} onPress={() => setStatus(s)} />
        ))}
      </ChipRow>
      <ExpenseList expenses={shown} empty={<EmptyState icon="search" title="no matching expenses" />} />
    </Screen>
  );
}

export function ProducerDepartmentsScreen() {
  const { state } = useStore();
  const nav = useNav();
  const p = projectSummary(state);
  return (
    <Screen title="budgets" subtitle={`${formatCompact(p.allocated)} allocated of ${formatCompact(p.totalBudget)}`}>
      <View style={{ gap: space.md }}>
        {state.departments.map((d) => (
          <DepartmentCard key={d.id} dept={d} onPress={() => nav.push({ name: 'department', id: d.id })} />
        ))}
      </View>
      <Card style={{ gap: 6 }}>
        <Text style={styles.meta}>unallocated reserve</Text>
        <Money value={p.unallocated} size={24} display />
        <Text style={styles.meta}>Approved budget requests are added on top of department allocations.</Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroSub: { fontFamily: font.medium, fontSize: 14, color: colors.inkSoft, marginTop: 2 },
  body: { fontFamily: font.regular, fontSize: 14, color: colors.inkSoft, lineHeight: 21 },
  meta: { fontFamily: font.regular, fontSize: 13.5, color: colors.inkMuted, lineHeight: 19 },
  requestTeaser: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.lg },
  teaserText: { flex: 1, fontFamily: font.medium, fontSize: 15, color: colors.ink },
  catName: { fontFamily: font.medium, fontSize: 14, color: colors.ink },
  catAmt: { fontFamily: font.semibold, fontSize: 14, color: colors.ink },
  catTrack: { height: 4, backgroundColor: colors.track, borderRadius: 2, overflow: 'hidden' },
  catBar: { height: 4, backgroundColor: colors.ink, borderRadius: 2 },
  reqDept: { fontFamily: font.semibold, fontSize: 18, color: colors.ink },
  noteInput: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12, fontFamily: font.medium, fontSize: 14 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: space.lg,
    backgroundColor: colors.surface,
    boxShadow: shadow.soft,
  },
  searchInput: { flex: 1, fontFamily: font.medium, fontSize: 15, paddingVertical: 14 },
});
