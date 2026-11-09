import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { HomeShell } from '../../components/HomeShell';
import { Icon } from '../../components/icons';
import { SampleTxns } from '../crew/CrewScreens';
import { Text } from '../../components/Text';
import { BudgetRequestRow, categoryIcon, DepartmentCard, ExpenseCard, ExpenseList, ExpenseStatementRow, ViewAllLink } from '../../components/rows';
import { Avatar, Button, Chip, ChipRow, EmptyState, Hero, Money, Notice, Screen, SectionTitle, Segmented } from '../../components/ui';
import { useNav } from '../../navigation/Nav';
import { byNewest, categoryBreakdown, departmentSummary, isPending, isSpent, managedDepartmentIds, sum, userName } from '../../store/selectors';
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

// Manager home: project artwork carousel on top; budget used, bills to review, money matters, recent team
// spend and department budgets below.
export function ManagerDashboardScreen() {
  const { state, currentUser, depts, toReview, teamExpenses } = useManagerData();
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

  return (
    <HomeShell>
      {(listing) => {
        const ms = listing.managerSample;
        const budget = ms ? ms.budget : totals.budget;
        const spent = ms ? ms.spent : totals.spent;
        const review = ms ? ms.review : sum(toReview);
        const count = ms ? ms.reviewCount : toReview.length;
        const pct = budget ? Math.round((spent / budget) * 100) : 0;
        return (
          <>
            <View style={dashStyles.budget}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <Text style={dashStyles.budgetLine}>
                  <Text style={dashStyles.budgetSpent}>{formatCompact(spent)}</Text> spent of {formatCompact(budget)}
                </Text>
                <Text style={dashStyles.budgetPct}>{pct}%</Text>
              </View>
              <View style={dashStyles.track}>
                <View style={[dashStyles.fill, { width: `${Math.min(100, pct)}%` }]} />
              </View>
              <Text style={dashStyles.budgetLeft}>{formatCompact(budget - spent)} remaining</Text>
            </View>

            <View style={dashStyles.review}>
              <View style={{ flex: 1, gap: 2 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={[dashStyles.dot, { backgroundColor: count ? colors.pending : colors.positive }]} />
                  <Text style={[dashStyles.reviewLabel, { color: count ? colors.pending : colors.positive }]}>{count ? 'Pending your review' : 'All caught up'}</Text>
                </View>
                <Money value={review} size={24} display />
                <Text style={dashStyles.detail}>
                  {count} {count === 1 ? 'bill' : 'bills'}
                  {!ms && overLimit ? ` · ${overLimit} over ${formatCompact(threshold)}` : ''}
                </Text>
              </View>
              {count ? <Button label="Review" small onPress={() => nav.setTab('approvals')} style={{ minWidth: 104 }} /> : null}
            </View>


            <SectionTitle title="Recent transactions" />
            {ms && listing.sample ? (
              <SampleTxns txns={listing.sample.txns} />
            ) : (
              <View>
                {teamExpenses.slice(0, 5).map((e) => (
                  <ExpenseStatementRow key={e.id} expense={e} showPerson />
                ))}
                <ViewAllLink onPress={() => nav.push({ name: 'teamExpenses' })} />
              </View>
            )}

            <SectionTitle title="Department budgets" action="Request more" onAction={() => nav.push({ name: 'budgetRequest' })} />
            {ms ? (
              <Text style={dashStyles.detail}>You manage {ms.manage} on {listing.name}. Department detail appears once its first bills come in.</Text>
            ) : (
              <View style={{ gap: space.md }}>
                {depts.map((d) => (
                  <DepartmentCard key={d.id} dept={d} onPress={() => nav.push({ name: 'department', id: d.id })} />
                ))}
              </View>
            )}
          </>
        );
      }}
    </HomeShell>
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
  detail: { fontFamily: font.regular, fontSize: 13, color: colors.inkSoft },
  budget: { padding: 14, paddingHorizontal: 16, borderRadius: 18, borderWidth: 1, borderColor: '#EDEDED', backgroundColor: colors.surface, gap: 10 },
  budgetLine: { fontFamily: font.regular, fontSize: 14, color: colors.inkSoft },
  budgetSpent: { fontFamily: font.display, fontSize: 16, color: colors.ink },
  budgetPct: { fontFamily: font.bold, fontSize: 13, color: colors.ink },
  track: { height: 4, borderRadius: 2, backgroundColor: '#EDEDED', overflow: 'hidden' },
  fill: { height: 4, borderRadius: 2, backgroundColor: colors.ink },
  budgetLeft: { fontFamily: font.regular, fontSize: 12.5, color: colors.inkMuted },
  review: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg, borderRadius: radius.lg, backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.lineSoft },
  dot: { width: 7, height: 7, borderRadius: 4 },
  reviewLabel: { fontFamily: font.semibold, fontSize: 13 },
  mini: { flex: 1, gap: 2, padding: space.md, borderRadius: radius.md, backgroundColor: colors.surface, boxShadow: shadow.soft },
  miniLabel: { fontFamily: font.regular, fontSize: 12.5, color: colors.inkSoft },
  miniValue: { fontFamily: font.bold, fontSize: 16, color: colors.ink },
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
    <Screen
      title="approvals"
      footer={tab === 'review' && quick.length > 1 ? <Button label={`Approve all ${quick.length} under ${formatCompact(threshold)}`} icon="check-double" variant="outline" onPress={approveAll} /> : undefined}
    >
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

// Expenses tab: spend against budget, the latest bills, and spend by category and by department.
export function ManagerExpensesOverviewScreen() {
  const { state, currentUser, depts, teamExpenses } = useManagerData();
  const nav = useNav();
  if (!currentUser) return null;
  const totals = depts.reduce(
    (acc, d) => {
      const s = departmentSummary(state, d.id);
      return { budget: acc.budget + s.budget, spent: acc.spent + s.spent };
    },
    { budget: 0, spent: 0 },
  );
  const pct = totals.budget ? Math.round((totals.spent / totals.budget) * 100) : 0;
  const spentList = teamExpenses.filter(isSpent);

  return (
    <Screen title="Expenses" subtitle={`${state.project.name} · ${depts.map((d) => d.name).join(', ')}`}>
      <View style={expStyles.dark}>
        <Text style={expStyles.darkLabel}>Total spent</Text>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
          <Text style={expStyles.darkBig}>{formatCompact(totals.spent)}</Text>
          <Text style={expStyles.darkLabel}>of {formatCompact(totals.budget)}</Text>
        </View>
        <Text style={[expStyles.darkLabel, { marginTop: 10 }]}>Budget utilised</Text>
        <View style={expStyles.darkTrack}>
          <View style={[expStyles.darkFill, { width: `${Math.min(100, pct)}%` }]} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 12 }}>
          <View style={{ gap: 4 }}>
            <Text style={expStyles.darkSmall}>Spent</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={expStyles.darkValue}>{formatCompact(totals.spent)}</Text>
              <Text style={expStyles.pctPill}>{pct}%</Text>
            </View>
          </View>
          <View style={{ gap: 4, alignItems: 'flex-end' }}>
            <Text style={expStyles.darkSmall}>Remaining</Text>
            <Text style={expStyles.darkValue}>{formatCompact(totals.budget - totals.spent)}</Text>
          </View>
        </View>
      </View>

      <View style={expStyles.card}>
        <View style={expStyles.cardHead}>
          <Text style={expStyles.cardTitle}>Recent transactions</Text>
          <Text style={expStyles.cardNote}>
            {Math.min(5, teamExpenses.length)} of {teamExpenses.length}
          </Text>
        </View>
        <View>
          {teamExpenses.slice(0, 5).map((e) => (
            <ExpenseStatementRow key={e.id} expense={e} showPerson />
          ))}
        </View>
        <ViewAllLink onPress={() => nav.push({ name: 'teamExpenses' })} />
      </View>

      <SpendDonut expenses={spentList} />

      <TopSpenders expenses={spentList} />

      <TopMerchants expenses={spentList} onViewAll={() => nav.push({ name: 'teamExpenses' })} />
    </Screen>
  );
}

const SHADES = ['#141414', '#4A4A4A', '#8C8C8C', '#BDBDBD', '#E2E2E2'];

// Spending by category: a black-and-white donut with the total in the middle, the top category as a
// headline, and a legend with transaction counts.
function SpendDonut({ expenses }: { expenses: Expense[] }) {
  const total = sum(expenses);
  const all = categoryBreakdown(expenses);
  if (!total || !all.length) return null;
  const top = all.slice(0, 4);
  const rest = all.slice(4).reduce((a, c) => a + c.amount, 0);
  const slices = rest > 0 ? [...top, { category: 'Other', amount: rest }] : top;
  const count = (cat: string) => (cat === 'Other' ? expenses.filter((e) => !top.some((t) => t.category === e.category)).length : expenses.filter((e) => e.category === cat).length);
  const size = 200;
  const stroke = 30;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;
  const lead = slices[0];
  const leadPct = ((lead.amount / total) * 100).toFixed(1);

  return (
    <View style={expStyles.card}>
      <Text style={expStyles.kicker}>TOP SPEND CATEGORY</Text>
      <Text style={expStyles.headline}>
        {leadPct}% on {lead.category.toLowerCase()}
      </Text>
      <Text style={expStyles.cardNote}>Across your team's approved and paid bills this project.</Text>

      <View style={{ alignItems: 'center', paddingVertical: space.md }}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <G rotation={-90} origin={`${size / 2}, ${size / 2}`}>
            <Circle cx={size / 2} cy={size / 2} r={r} stroke="#F2F2F2" strokeWidth={stroke} fill="none" />
            {slices.map((sl, i) => {
              const len = (sl.amount / total) * c;
              const el = (
                <Circle
                  key={sl.category}
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  stroke={SHADES[i]}
                  strokeWidth={stroke}
                  fill="none"
                  strokeDasharray={`${Math.max(0, len - 2)} ${c}`}
                  strokeDashoffset={-offset}
                />
              );
              offset += len;
              return el;
            })}
          </G>
        </Svg>
        <View style={expStyles.donutCenter} pointerEvents="none">
          <Text style={expStyles.cardNote}>Total spent</Text>
          <Money value={total} size={17} display />
        </View>
      </View>

      {slices.map((sl, i) => {
        const n = count(sl.category);
        return (
          <View key={sl.category} style={[expStyles.legendRow, i > 0 && expStyles.legendDivider]}>
            <View style={[expStyles.swatch, { backgroundColor: SHADES[i] }]} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={expStyles.legendName}>{sl.category.toLowerCase()}</Text>
              <Text style={expStyles.cardNote}>
                {n} {n === 1 ? 'transaction' : 'transactions'}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 4 }}>
              <Money value={sl.amount} size={14.5} />
              <Text style={expStyles.cardNote}>{((sl.amount / total) * 100).toFixed(1)}%</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

// Where the team's money goes: the six biggest vendors as a grid of round icons, amount and name.
function TopMerchants({ expenses, onViewAll }: { expenses: Expense[]; onViewAll: () => void }) {
  const map = new Map<string, { amount: number; category: string }>();
  expenses.forEach((e) => {
    const name = e.vendor?.trim() || e.description.split(/[–-]/)[0].trim();
    const cur = map.get(name);
    map.set(name, { amount: (cur?.amount ?? 0) + e.amount, category: cur?.category ?? e.category });
  });
  const top = [...map.entries()].sort((a, b) => b[1].amount - a[1].amount).slice(0, 6);
  if (!top.length) return null;
  return (
    <View style={expStyles.card}>
      <Text style={expStyles.kicker}>TOP MERCHANTS</Text>
      <View style={expStyles.merchGrid}>
        {top.map(([name, m]) => (
          <View key={name} style={expStyles.merch}>
            <View style={expStyles.merchIcon}>
              <Icon name={categoryIcon[m.category] ?? 'receipt'} size={20} />
            </View>
            <Money value={m.amount} size={14.5} />
            <Text style={expStyles.merchName} numberOfLines={2}>
              {name}
            </Text>
          </View>
        ))}
      </View>
      <ViewAllLink label="View all merchants" onPress={onViewAll} />
    </View>
  );
}

// Who on the team spends the most: up to six people with their photo (initials for now), total and name.
function TopSpenders({ expenses }: { expenses: Expense[] }) {
  const { state } = useStore();
  const map = new Map<string, { amount: number; count: number }>();
  expenses.forEach((e) => {
    const cur = map.get(e.userId);
    map.set(e.userId, { amount: (cur?.amount ?? 0) + e.amount, count: (cur?.count ?? 0) + 1 });
  });
  const top = [...map.entries()].sort((a, b) => b[1].amount - a[1].amount).slice(0, 6);
  if (!top.length) return null;
  return (
    <View style={expStyles.card}>
      <Text style={expStyles.kicker}>TOP SPENDERS</Text>
      <View style={expStyles.merchGrid}>
        {top.map(([id, m]) => {
          const name = userName(state, id);
          return (
            <View key={id} style={expStyles.merch}>
              <View style={{ marginBottom: 4 }}>
                <Avatar name={name} size={52} />
              </View>
              <Money value={m.amount} size={14.5} />
              <Text style={expStyles.merchName} numberOfLines={2}>
                {name}
              </Text>
              <Text style={[expStyles.merchName, { marginTop: -4 }]}>
                {m.count} {m.count === 1 ? 'bill' : 'bills'}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function TertiaryLink({ label: text, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={8} style={expStyles.link} accessibilityRole="link">
      <Text style={expStyles.linkText}>{text}</Text>
      <Icon name="chevron-right" size={16} />
    </Pressable>
  );
}

const expStyles = StyleSheet.create({
  dark: { padding: 20, borderRadius: radius.lg, backgroundColor: '#141414', gap: 4 },
  darkLabel: { fontFamily: font.regular, fontSize: 14, color: '#A8A8A8' },
  darkBig: { fontFamily: font.bold, fontSize: 30, lineHeight: 36, color: colors.onInk, letterSpacing: -1.5 },
  darkTrack: { marginTop: 8, height: 8, borderRadius: 4, backgroundColor: '#3A3A3A', overflow: 'hidden' },
  darkFill: { height: 8, borderRadius: 4, backgroundColor: '#E6E6E6' },
  darkSmall: { fontFamily: font.regular, fontSize: 13, color: '#A8A8A8' },
  darkValue: { fontFamily: font.bold, fontSize: 15, color: colors.onInk },
  pctPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.pill, borderWidth: 1, borderColor: '#3A3A3A', backgroundColor: '#262626', fontFamily: font.semibold, fontSize: 12, color: '#CFCFCF', overflow: 'hidden' },
  card: { padding: space.lg, borderRadius: radius.lg, backgroundColor: colors.surface, boxShadow: shadow.soft, gap: 14 },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontFamily: font.bold, fontSize: 16, color: colors.ink },
  cardNote: { fontFamily: font.regular, fontSize: 13, color: colors.inkMuted },
  catIcon: { width: 30, height: 30, borderRadius: 10, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  catName: { flex: 1, fontFamily: font.semibold, fontSize: 14, color: colors.ink },
  catAmt: { fontFamily: font.bold, fontSize: 14, color: colors.ink },
  catPct: { width: 36, textAlign: 'right', fontFamily: font.regular, fontSize: 12.5, color: colors.inkMuted },
  catTrack: { height: 6, borderRadius: 3, backgroundColor: '#EFEFEF', overflow: 'hidden' },
  catFill: { height: 6, borderRadius: 3, backgroundColor: colors.ink },
  merchGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 22, marginTop: 6 },
  merch: { width: '33.33%', alignItems: 'center', gap: 6, paddingHorizontal: 4 },
  merchIcon: { width: 52, height: 52, borderRadius: 26, borderWidth: 1, borderColor: '#ECECEC', backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  merchName: { fontFamily: font.regular, fontSize: 13, lineHeight: 17, color: colors.inkMuted, textAlign: 'center' },
  kicker: { fontFamily: font.semibold, fontSize: 11.5, letterSpacing: 2, color: colors.inkMuted },
  headline: { fontFamily: font.display, fontSize: 24, color: colors.ink, letterSpacing: -0.6, marginTop: -6 },
  donutCenter: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, alignItems: 'center', justifyContent: 'center', gap: 2 },
  legendRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, paddingVertical: 12 },
  legendDivider: { borderTopWidth: 1, borderTopColor: '#EFEFEF', borderStyle: 'dashed' },
  swatch: { width: 12, height: 12, borderRadius: 3, marginTop: 3 },
  legendName: { fontFamily: font.medium, fontSize: 14.5, color: colors.ink },
  link: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 4, paddingTop: 4 },
  linkText: { fontFamily: font.bold, fontSize: 13.5, color: colors.ink, textDecorationLine: 'underline' },
});

export function ManagerExpensesScreen({ pushed }: { pushed?: boolean } = {}) {
  const { currentUser, depts, teamExpenses } = useManagerData();
  const nav = useNav();
  const [dept, setDept] = useState<string | 'all'>('all');
  const [status, setStatus] = useState<'all' | 'pending' | 'approved' | 'paid' | 'rejected'>('all');
  if (!currentUser) return null;

  const shown = teamExpenses.filter((e) => (dept === 'all' || e.departmentId === dept) && (status === 'all' || (status === 'pending' ? isPending(e) : e.status === status)));

  return (
    <Screen title="team expenses" subtitle={`${shown.length} bills · ${formatINR(sum(shown))}`} onBack={pushed ? nav.pop : undefined}>
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

export function ManagerBudgetsScreen({ pushed }: { pushed?: boolean } = {}) {
  const { state, currentUser, depts, deptIds } = useManagerData();
  const nav = useNav();
  if (!currentUser) return null;
  const requests = state.budgetRequests.filter((r) => deptIds.includes(r.departmentId));
  const budget = depts.reduce((a, d) => a + d.budget, 0);

  return (
    <Screen title="budgets" subtitle={`${depts.length} departments · ${formatCompact(budget)} allocated`} onBack={pushed ? nav.pop : undefined}>
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
