import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ProjectCard } from '../../components/project';
import { ExpenseList, SummaryTile, TransactionRow } from '../../components/rows';
import { Text } from '../../components/Text';
import { Chip, ChipRow, EmptyState, Hero, Screen, SectionTitle, Segmented } from '../../components/ui';
import { projectListing } from '../../data/projects';
import { useNav } from '../../navigation/Nav';
import { byNewest, isPending, sum } from '../../store/selectors';
import { useStore } from '../../store/Store';
import { colors, font, space } from '../../theme';
import { ExpenseStatus } from '../../types';
import { formatINR } from '../../utils/format';

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
  const paid = mine.filter((e) => e.status === 'paid');
  const listing = projectListing(state.selectedProjectId);

  return (
    <Screen>
      <Text style={homeStyles.greeting}>
        {greeting()}, {currentUser.name.split(' ')[0]}
      </Text>
      <ProjectCard
        listing={listing}
        onPress={() => nav.setTab('project')}
        detail={
          <>
            <Text style={homeStyles.detail}>
              Call time · <Text style={homeStyles.detailStrong}>{state.project.callTime}</Text>
            </Text>
            <Text style={homeStyles.detail} numberOfLines={1}>
              {state.project.location}
            </Text>
          </>
        }
      />

      <SectionTitle title="My expenses" action="View all" onAction={() => nav.setTab('expenses')} />
      <View style={{ flexDirection: 'row', gap: space.md }}>
        <SummaryTile label="Pending" dot={colors.pending} amount={sum(pending)} hint={`${pending.length} ${pending.length === 1 ? 'expense' : 'expenses'}`} onPress={() => nav.setTab('expenses')} />
        <SummaryTile label="Received" dot={colors.positive} amount={sum(paid)} hint="This project" onPress={() => nav.push({ name: 'payouts' })} />
      </View>

      <SectionTitle title="Recent transactions" action={mine.length > 5 ? 'View all' : undefined} onAction={() => nav.setTab('expenses')} />
      {mine.length ? (
        <View>
          {mine.slice(0, 5).map((e) => (
            <TransactionRow key={e.id} expense={e} />
          ))}
        </View>
      ) : (
        <EmptyState icon="receipt" title="Nothing logged yet" message="Tap the + button below to log your first expense." />
      )}
    </Screen>
  );
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

const homeStyles = StyleSheet.create({
  greeting: { fontFamily: font.display, fontSize: 22, color: colors.ink, letterSpacing: -0.5 },
  detail: { fontFamily: font.regular, fontSize: 13, color: colors.inkSoft },
  detailStrong: { fontFamily: font.bold, fontSize: 13, color: colors.ink },
});

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
