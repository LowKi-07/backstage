import React, { useState } from 'react';
import { View } from 'react-native';
import { ExpenseCard, ExpenseList } from '../../components/rows';
import { Chip, ChipRow, EmptyState, Hero, InfoPill, Screen, SectionTitle, Segmented, TileGrid } from '../../components/ui';
import { useNav } from '../../navigation/Nav';
import { byNewest, deptName, isPending, sum } from '../../store/selectors';
import { useStore } from '../../store/Store';
import { colors, space } from '../../theme';
import { ExpenseStatus } from '../../types';
import { formatCompact, formatINR } from '../../utils/format';

function useMine() {
  const { state, currentUser } = useStore();
  const mine = currentUser ? state.expenses.filter((e) => e.userId === currentUser.id).sort(byNewest) : [];
  return { state, currentUser, mine };
}

export function CrewHomeScreen() {
  const { state, currentUser, mine } = useMine();
  const nav = useNav();
  if (!currentUser) return null;
  const pending = mine.filter(isPending);
  const approved = mine.filter((e) => e.status === 'approved');
  const paid = mine.filter((e) => e.status === 'paid');

  return (
    <Screen>
      <Hero
        eyebrow={`${deptName(state, currentUser.departmentIds[0])} · reimbursed ${formatCompact(sum(paid))}`}
        lines={pending.length ? [`you've ${pending.length} ${pending.length === 1 ? 'bill' : 'bills'} awaiting`, 'approval worth'] : ['all caught up.', 'nothing pending.']}
        amount={pending.length ? sum(pending) : undefined}
      />

      <SectionTitle title="money matters" />
      <ChipRow>
        <InfoPill icon="wallet" label="to be paid" value={formatINR(sum(approved))} onPress={() => nav.setTab('payouts')} />
        <InfoPill icon="banknote" label="reimbursed" value={formatINR(sum(paid))} onPress={() => nav.setTab('payouts')} />
        <InfoPill icon="receipt" label="logged" value={formatINR(sum(mine))} valueColor={colors.ink} onPress={() => nav.setTab('expenses')} />
      </ChipRow>

      {pending.length ? (
        <>
          <SectionTitle title={`awaiting approval (${pending.length})`} action="view all" onAction={() => nav.setTab('expenses')} />
          <View style={{ gap: space.md }}>
            {pending.slice(0, 3).map((e) => (
              <ExpenseCard key={e.id} expense={e} />
            ))}
          </View>
        </>
      ) : null}

      <SectionTitle title="for you" />
      <TileGrid
        items={[
          { icon: 'camera', label: 'add expense', onPress: () => nav.push({ name: 'newExpense' }) },
          { icon: 'receipt', label: 'my expenses', onPress: () => nav.setTab('expenses') },
          { icon: 'wallet', label: 'payouts', onPress: () => nav.setTab('payouts'), badge: approved.length || undefined },
          { icon: 'sparkles', label: 'ask ai', onPress: () => nav.setTab('ai') },
        ]}
      />

      <SectionTitle title="recent" action={mine.length > 5 ? 'view all' : undefined} onAction={() => nav.setTab('expenses')} />
      <ExpenseList
        expenses={mine.slice(0, 5)}
        showPerson={false}
        empty={<EmptyState icon="receipt" title="nothing logged yet" message="Tap the + button below to log your first expense." />}
      />
    </Screen>
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

  return (
    <Screen title="my expenses" subtitle={`${mine.length} bills · ${formatINR(sum(mine))}`}>
      <ChipRow>
        {FILTERS.map((f) => (
          <Chip key={f.key} label={f.label} count={mine.filter(match(f.key)).length} active={filter === f.key} onPress={() => setFilter(f.key)} />
        ))}
      </ChipRow>
      <ExpenseList expenses={shown} showPerson={false} empty={<EmptyState icon="inbox" title="nothing here" message="No expenses match this filter." />} />
    </Screen>
  );
}

export function CrewPayoutsScreen() {
  const { currentUser, mine } = useMine();
  const [tab, setTab] = useState<'due' | 'paid'>('due');
  if (!currentUser) return null;
  const due = mine.filter((e) => e.status === 'approved');
  const paid = mine.filter((e) => e.status === 'paid');
  const list = tab === 'due' ? due : paid;

  return (
    <Screen title="payouts">
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
