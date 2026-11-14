import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Icon } from '../../components/icons';
import { HomeShell } from '../../components/HomeShell';
import { ExpenseList, ExpenseStatementRow, StatementRow, SummaryTile, ViewAllLink } from '../../components/rows';
import { Text } from '../../components/Text';
import { Chip, ChipRow, EmptyState, Hero, IconCircle, Money, Screen, SectionTitle, Segmented } from '../../components/ui';
import { planStyles, TaskRow } from '../../components/projectPlan';
import { useNav } from '../../navigation/Nav';
import { SpendDonut, TopMerchants } from '../manager/ManagerScreens';
import { byNewest, isPending, sum } from '../../store/selectors';
import { useStore } from '../../store/Store';
import { colors, font, space } from '../../theme';
import { ExpenseStatus } from '../../types';
import { formatINR, toISODate } from '../../utils/format';

function useMine() {
  const { state, currentUser } = useStore();
  const mine = currentUser ? state.expenses.filter((e) => e.userId === currentUser.id).sort(byNewest) : [];
  return { state, currentUser, mine };
}

// Crew home: project artwork carousel on top; my expenses and recent transactions for the selected project below.
export function CrewHomeScreen() {
  const { state, currentUser, mine } = useMine();
  const { toggleTask } = useStore();
  const nav = useNav();
  if (!currentUser) return null;
  const pending = mine.filter(isPending);
  const paid = mine.filter((e) => e.status === 'paid');

  return (
    <HomeShell>
      {(listing) => {
        const sample = listing.sample;
        const today = toISODate(new Date());
        const todays = state.tasks
          .filter((t) => t.projectId === listing.id && t.assigneeId === currentUser.id && (t.due === today || (t.due < today && t.status === 'todo')))
          .sort((a, b) => a.due.localeCompare(b.due));
        const left = todays.filter((t) => t.status === 'todo').length;
        return (
          <>
            <SectionTitle title="My expenses" action="View all" onAction={() => nav.setTab('expenses')} />
            <View style={{ flexDirection: 'row', gap: space.md }}>
              {sample ? (
                <>
                  <SummaryTile label="Pending" dot={colors.pending} amount={sample.pending} hint={`${sample.pendingCount} ${sample.pendingCount === 1 ? 'expense' : 'expenses'}`} />
                  <SummaryTile label="Received" dot={colors.positive} amount={sample.received} hint="This project" />
                </>
              ) : (
                <>
                  <SummaryTile label="Pending" dot={colors.pending} amount={sum(pending)} hint={`${pending.length} ${pending.length === 1 ? 'expense' : 'expenses'}`} onPress={() => nav.setTab('expenses')} />
                  <SummaryTile label="Received" dot={colors.positive} amount={sum(paid)} hint="This project" onPress={() => nav.push({ name: 'payouts' })} />
                </>
              )}
            </View>

            <PayrollCard projectId={listing.id} />

            <SectionTitle title="Recent transactions" />
            {sample ? (
              <View>
                <SampleTxns txns={sample.txns.slice(0, 5)} />
                <ViewAllLink onPress={() => nav.push({ name: 'allTransactions' })} />
              </View>
            ) : mine.length ? (
              <View>
                {mine.slice(0, 5).map((e) => (
                  <ExpenseStatementRow key={e.id} expense={e} />
                ))}
                <ViewAllLink onPress={() => nav.push({ name: 'allTransactions' })} />
              </View>
            ) : (
              <EmptyState icon="receipt" title="Nothing logged yet" message="Tap the + button below to log your first expense." />
            )}

            <SectionTitle title="Today's tasks" action={todays.length ? (left ? `${left} left` : 'All done') : undefined} onAction={() => nav.setTab('project')} />
            <View style={planStyles.card}>
              {todays.map((t, i) => (
                <View key={t.id} style={i > 0 ? { borderTopWidth: 1, borderTopColor: '#F0F0F0' } : null}>
                  <TaskRow task={t} onToggle={() => toggleTask(t.id)} />
                </View>
              ))}
              {todays.length === 0 ? <Text style={{ fontFamily: font.regular, fontSize: 13, color: colors.inkMuted, paddingVertical: 8 }}>Nothing assigned for today.</Text> : null}
            </View>
            <ViewAllLink label="Open project" onPress={() => nav.setTab('project')} />
          </>
        );
      }}
    </HomeShell>
  );
}

// Payroll for the crew member on this project: this month's net pay up top, the breakdown behind an
// expand control. Figures are the demo production's.
const PAYROLL: Record<string, { month: string; payday: string; rate: number; days: number; otHours: number; otRate: number; batta: number; advance: number; tdsPct: number; last: string }> = {
  kantara: { month: 'November', payday: '30 Nov', rate: 3500, days: 22, otHours: 6, otRate: 440, batta: 300, advance: 10000, tdsPct: 10, last: 'October · ₹71,250 paid on 31 Oct' },
  proj1: { month: 'November', payday: '30 Nov', rate: 2800, days: 18, otHours: 4, otRate: 350, batta: 250, advance: 0, tdsPct: 10, last: 'October · ₹52,600 paid on 31 Oct' },
  'big-dawgs': { month: 'November', payday: 'After wrap', rate: 4000, days: 2, otHours: 0, otRate: 0, batta: 300, advance: 0, tdsPct: 10, last: 'No payouts yet' },
};

function PayrollCard({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const p = PAYROLL[projectId] ?? PAYROLL.kantara;
  const base = p.rate * p.days;
  const ot = p.otHours * p.otRate;
  const batta = p.batta * p.days;
  const gross = base + ot + batta;
  const tds = Math.round((base + ot) * (p.tdsPct / 100));
  const net = gross - tds - p.advance;
  const rows: [string, string, number][] = [
    ['Day rate', `${formatINR(p.rate)} × ${p.days} days`, base],
    ['Overtime', p.otHours ? `${p.otHours} h × ${formatINR(p.otRate)}` : 'None', ot],
    ['Batta (food allowance)', `${formatINR(p.batta)} × ${p.days} days`, batta],
    ['TDS', `${p.tdsPct}% of pay`, -tds],
    ...(p.advance ? ([['Advance taken', 'Adjusted this month', -p.advance]] as [string, string, number][]) : []),
  ];
  return (
    <View style={pay.card}>
      <Pressable onPress={() => setOpen((o) => !o)} style={{ gap: 4 }} accessibilityRole="button" accessibilityState={{ expanded: open }} accessibilityLabel={`Payroll, ${p.month} net pay ${formatINR(net)}`}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={pay.kicker}>PAYROLL · {p.month.toUpperCase()}</Text>
          <Text style={pay.muted}>Payday {p.payday}</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <View style={{ gap: 2 }}>
            <Money value={net} size={24} display />
            <Text style={pay.muted}>
              Net pay · {p.days} days worked
            </Text>
          </View>
          <View style={pay.expand}>
            <Text style={pay.expandText}>{open ? 'Hide' : 'Breakdown'}</Text>
            <Icon name={open ? 'chevron-up' : 'chevron-down'} size={16} />
          </View>
        </View>
      </Pressable>
      {open ? (
        <View style={{ gap: 2, marginTop: 6 }}>
          {rows.map(([k, sub, v]) => (
            <View key={k} style={pay.row}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={pay.rowTitle}>{k}</Text>
                <Text style={pay.muted}>{sub}</Text>
              </View>
              <Text style={pay.rowAmt}>{v < 0 ? '−' : ''}{formatINR(Math.abs(v))}</Text>
            </View>
          ))}
          <View style={[pay.row, { borderTopWidth: 1, borderTopColor: '#E6E6E6', borderStyle: 'dashed' }]}>
            <Text style={[pay.rowTitle, { flex: 1, fontFamily: font.bold }]}>Net pay</Text>
            <Text style={[pay.rowAmt, { fontFamily: font.bold }]}>{formatINR(net)}</Text>
          </View>
          <Text style={[pay.muted, { marginTop: 4 }]}>Last payout: {p.last}</Text>
        </View>
      ) : null}
    </View>
  );
}

const pay = StyleSheet.create({
  card: { padding: space.lg, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: '#EDEDED', gap: 8 },
  kicker: { fontFamily: font.semibold, fontSize: 11, letterSpacing: 1.6, color: colors.inkMuted },
  muted: { fontFamily: font.regular, fontSize: 12, color: colors.inkMuted },
  expand: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 99, borderWidth: 1, borderColor: '#E2E2E2' },
  expandText: { fontFamily: font.semibold, fontSize: 12, color: colors.ink },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 9 },
  rowTitle: { fontFamily: font.medium, fontSize: 13.5, color: colors.ink },
  rowAmt: { fontFamily: font.semibold, fontSize: 13.5, color: colors.ink },
});

// Transaction rows for sample projects that have no expense data behind them.
const SAMPLE_CAT: Record<string, string> = { fuel: 'fuel', package: 'props & materials', utensils: 'food & catering', shirt: 'costume & fabric' };

export function SampleTxns({ txns }: { txns: { icon: string; title: string; when: string; amount: number }[] }) {
  return (
    <View>
      {txns.map((t) => (
        <StatementRow key={t.title} icon={t.icon} title={t.title} sub={t.amount > 0 ? 'reimbursed' : SAMPLE_CAT[t.icon] ?? 'others'} amount={Math.abs(t.amount)} date={t.when} credit={t.amount > 0} />
      ))}
    </View>
  );
}


const FILTERS: { key: 'all' | ExpenseStatus | 'pending'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'paid', label: 'Paid' },
  { key: 'rejected', label: 'Rejected' },
];

export function CrewExpensesScreen() {
  const { currentUser, mine } = useMine();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['key']>('all');
  if (!currentUser) return null;
  const match = (k: (typeof FILTERS)[number]['key']) => (e: (typeof mine)[number]) => (k === 'all' ? true : k === 'pending' ? isPending(e) : e.status === k);
  const shown = mine.filter(match(filter));
  const counted = mine.filter((e) => e.status !== 'rejected');

  return (
    <Screen title="my expenses" subtitle={`${mine.length} bills · ${formatINR(sum(mine))}`}>
      <ChipRow>
        {FILTERS.map((f) => (
          <Chip key={f.key} label={f.label} count={mine.filter(match(f.key)).length} active={filter === f.key} onPress={() => setFilter(f.key)} />
        ))}
      </ChipRow>
      <ExpenseList expenses={shown} showPerson={false} empty={<EmptyState icon="inbox" title="nothing here" message="No expenses match this filter." />} />
      <SpendDonut expenses={counted} note="Across all the bills you've logged this project, rejected ones left out." />
      <TopMerchants expenses={counted} />
    </Screen>
  );
}

export function CrewPayoutsScreen({ pushed }: { pushed?: boolean }) {
  const nav = useNav();
  const { currentUser, mine } = useMine();
  const [tab, setTab] = useState<'due' | 'paid'>('due');
  if (!currentUser) return null;
  const due = mine.filter((e) => e.status === 'approved');
  const paid = mine.filter((e) => e.status === 'paid');
  const list = tab === 'due' ? due : paid;

  return (
    <Screen title="payouts" onBack={pushed ? nav.pop : undefined}>
      <Segmented
        options={[
          { key: 'due', label: 'To be paid' },
          { key: 'paid', label: 'Paid' },
        ]}
        value={tab}
        onChange={setTab}
      />
      <Hero
        eyebrow={tab === 'due' ? 'approved, payment on the way' : 'reimbursed to your account'}
        lines={tab === 'due' ? (due.length ? ['you’re owed'] : ['nothing owed', 'right now.']) : paid.length ? ['you’ve been paid'] : ['no payouts yet.']}
        amount={list.length ? sum(list) : undefined}
      />
      <ExpenseList
        expenses={list}
        showPerson={false}
        empty={
          <EmptyState
            icon="wallet"
            title={tab === 'due' ? 'no approved bills waiting' : 'no payouts yet'}
            message={tab === 'due' ? 'Bills appear here once your manager approves them.' : 'Paid bills show up here with the date they were settled.'}
          />
        }
      />
    </Screen>
  );
}
