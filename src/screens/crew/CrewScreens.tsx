import React, { useState } from 'react';
import { View } from 'react-native';
import { HomeCard, HomeTxnRow, PosterHome } from '../../components/PosterHome';
import { categoryIcon, ExpenseList, ViewAllLink } from '../../components/rows';
import { Text } from '../../components/Text';
import { Chip, ChipRow, EmptyState, Hero, Screen, Segmented } from '../../components/ui';
import { TaskRow } from '../../components/projectPlan';
import { useNav } from '../../navigation/Nav';
import { SpendDonut, TopMerchants } from '../manager/ManagerScreens';
import { byNewest, isPending, sum } from '../../store/selectors';
import { useStore } from '../../store/Store';
import { colors, font } from '../../theme';
import { ExpenseStatus } from '../../types';
import { formatINR, formatShortDate, toISODate } from '../../utils/format';

function useMine() {
  const { state, currentUser } = useStore();
  const mine = currentUser ? state.expenses.filter((e) => e.userId === currentUser.id).sort(byNewest) : [];
  return { state, currentUser, mine };
}

// Crew home: tall poster carousel with pending/received tiles, then recent transactions and today's tasks in white cards.
export function CrewHomeScreen() {
  const { state, currentUser, mine } = useMine();
  const { toggleTask } = useStore();
  const nav = useNav();
  if (!currentUser) return null;
  const pending = mine.filter(isPending);
  const paid = mine.filter((e) => e.status === 'paid');
  const plural = (n: number) => `${n} ${n === 1 ? 'expense' : 'expenses'}`;

  return (
    <PosterHome
      tiles={(listing) => {
        const p = listing.sample ? { pending: listing.sample.pending, count: listing.sample.pendingCount, received: listing.sample.received } : { pending: sum(pending), count: pending.length, received: sum(paid) };
        return [
          { label: 'Pending', dot: colors.pending, value: formatINR(p.pending), hint: plural(p.count), onPress: () => nav.setTab('expenses') },
          { label: 'Received', dot: colors.positive, value: formatINR(p.received), hint: 'This project', onPress: () => nav.push({ name: 'payouts' }) },
        ];
      }}
    >
      {(listing) => {
        const sample = listing.sample;
        const today = toISODate(new Date());
        const todays = state.tasks
          .filter((t) => t.projectId === listing.id && t.assigneeId === currentUser.id && (t.due === today || (t.due < today && t.status === 'todo')))
          .sort((a, b) => a.due.localeCompare(b.due));
        const txns = sample
          ? sample.txns.slice(0, 3).map((t) => ({ key: t.title, icon: t.icon, title: t.title, sub: t.amount > 0 ? 'reimbursed' : SAMPLE_CAT[t.icon] ?? 'others', when: t.when, amount: t.amount }))
          : mine.slice(0, 3).map((e) => ({
              key: e.id,
              icon: categoryIcon[e.category] ?? 'receipt',
              title: e.description,
              sub: e.status === 'paid' ? 'reimbursed' : e.category.toLowerCase(),
              when: formatShortDate(e.date),
              amount: e.status === 'paid' ? e.amount : -e.amount,
              onPress: () => nav.push({ name: 'expense', id: e.id }),
            }));
        return (
          <>
            <HomeCard title="Recent transactions">
              {txns.length ? (
                <>
                  {txns.map(({ key, when, sub, ...t }) => (
                    <HomeTxnRow key={key} {...t} sub={`${sub} · ${when}`} signed />
                  ))}
                  <ViewAllLink label="View transactions" onPress={() => nav.push({ name: 'allTransactions' })} />
                </>
              ) : (
                <EmptyState icon="receipt" title="Nothing logged yet" message="Tap the + button below to log your first expense." />
              )}
            </HomeCard>

            <HomeCard title="Tasks">
              {todays.map((t, i) => (
                <View key={t.id} style={i > 0 ? { borderTopWidth: 1, borderTopColor: '#F0F0F0' } : null}>
                  <TaskRow task={t} onToggle={() => toggleTask(t.id)} />
                </View>
              ))}
              {todays.length === 0 ? <Text style={{ fontFamily: font.regular, fontSize: 13, color: colors.inkMuted, paddingVertical: 8 }}>Nothing assigned for today.</Text> : null}
              <ViewAllLink label="Open project" onPress={() => nav.setTab('project')} />
            </HomeCard>
          </>
        );
      }}
    </PosterHome>
  );
}

// Transaction rows for sample projects that have no expense data behind them.
const SAMPLE_CAT: Record<string, string> = { fuel: 'fuel', package: 'props & materials', utensils: 'food & catering', shirt: 'costume & fabric' };



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
