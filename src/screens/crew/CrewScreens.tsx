import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Icon } from '../../components/icons';
import { HomeCard, PosterHome } from '../../components/PosterHome';
import { categoryIcon, ExpenseList, StatementRow, ViewAllLink } from '../../components/rows';
import { Text } from '../../components/Text';
import { Chip, ChipRow, EmptyState, Hero, Money, Screen, Segmented } from '../../components/ui';
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
      stats={(listing) =>
        listing.sample
          ? { pending: listing.sample.pending, pendingHint: plural(listing.sample.pendingCount), received: listing.sample.received, receivedHint: 'This project', onPending: () => nav.setTab('expenses'), onReceived: () => nav.push({ name: 'payouts' }) }
          : { pending: sum(pending), pendingHint: plural(pending.length), received: sum(paid), receivedHint: 'This project', onPending: () => nav.setTab('expenses'), onReceived: () => nav.push({ name: 'payouts' }) }
      }
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
            <HomeCard title="Recent transactions" action="View all" onAction={() => nav.push({ name: 'allTransactions' })}>
              {txns.length ? (
                <>
                  {txns.map(({ key, ...t }) => (
                    <HomeTxnRow key={key} {...t} />
                  ))}
                  <ViewAllLink label="View transactions" onPress={() => nav.push({ name: 'allTransactions' })} />
                </>
              ) : (
                <EmptyState icon="receipt" title="Nothing logged yet" message="Tap the + button below to log your first expense." />
              )}
            </HomeCard>

            <HomeCard title="Tasks" action="View all" onAction={() => nav.setTab('project')}>
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

// A transaction on the home card: bare category icon, title, "category · when", signed amount.
function HomeTxnRow({ icon, title, sub, when, amount, onPress }: { icon: string; title: string; sub: string; when: string; amount: number; onPress?: () => void }) {
  const credit = amount > 0;
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 14 }, pressed && { opacity: 0.6 }]} accessibilityRole="button">
      <View style={{ width: 28, alignItems: 'center' }}>
        <Icon name={icon} size={20} color={colors.ink} strokeWidth={1.6} />
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
        <Text style={{ fontFamily: font.bold, fontSize: 14, color: colors.ink }} numberOfLines={1}>
          {title}
        </Text>
        <Text style={{ fontFamily: font.regular, fontSize: 12.5, color: colors.inkMuted }} numberOfLines={1}>
          {sub} · {when}
        </Text>
      </View>
      <Money value={amount} size={14.5} color={credit ? colors.positive : colors.ink} signed display />
    </Pressable>
  );
}

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
