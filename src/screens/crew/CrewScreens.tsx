import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ExpenseList } from '../../components/rows';
import { Card, Chip, ChipRow, EmptyState, Icon, Screen, SectionTitle, Stat } from '../../components/ui';
import { useNav } from '../../navigation/Nav';
import { byNewest, deptName, isPending, sum } from '../../store/selectors';
import { useStore } from '../../store/Store';
import { colors, glass, radius, space } from '../../theme';
import { ExpenseStatus } from '../../types';
import { formatINR } from '../../utils/format';

function AddButton() {
  const nav = useNav();
  return (
    <Pressable onPress={() => nav.push({ name: 'newExpense' })} hitSlop={8} style={styles.headerAdd} accessibilityLabel="Log expense">
      <Icon name="add" size={22} color={colors.onInk} />
    </Pressable>
  );
}

export function CrewHomeScreen() {
  const { state, currentUser } = useStore();
  const nav = useNav();
  if (!currentUser) return null;
  const mine = state.expenses.filter((e) => e.userId === currentUser.id).sort(byNewest);
  const pending = mine.filter(isPending);
  const approved = mine.filter((e) => e.status === 'approved');
  const paid = mine.filter((e) => e.status === 'paid');
  const firstName = currentUser.name.split(' ')[0];

  return (
    <Screen title={`Hi, ${firstName}`} subtitle={`${currentUser.title} · ${deptName(state, currentUser.departmentIds[0])}`} right={<AddButton />}>
      <Pressable onPress={() => nav.push({ name: 'newExpense' })} style={({ pressed }) => [styles.cta, pressed && { opacity: 0.9 }]}>
        <View style={styles.ctaIcon}>
          <Icon name="camera" size={26} color={colors.onInk} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.ctaTitle}>Log an expense</Text>
          <Text style={styles.ctaSub}>Snap the bill, add a line, done.</Text>
        </View>
        <Icon name="arrow-forward" size={22} color={colors.onInk} />
      </Pressable>

      <Card>
        <View style={{ flexDirection: 'row', gap: space.md }}>
          <Stat label="Awaiting approval" value={formatINR(sum(pending))} hint={`${pending.length} bills`} tone={colors.warning} />
          <Stat label="To be paid" value={formatINR(sum(approved))} hint={`${approved.length} approved`} tone={colors.info} />
        </View>
        <View style={{ height: space.md }} />
        <View style={{ flexDirection: 'row', gap: space.md }}>
          <Stat label="Reimbursed" value={formatINR(sum(paid))} hint={`${paid.length} paid`} tone={colors.success} />
          <Stat label="Total logged" value={formatINR(sum(mine))} hint={`${mine.length} bills`} />
        </View>
      </Card>

      <SectionTitle title="Recent" action={mine.length > 5 ? 'See all' : undefined} onAction={() => nav.setTab('expenses')} />
      <ExpenseList
        expenses={mine.slice(0, 5)}
        showPerson={false}
        empty={<EmptyState icon="receipt-outline" title="Nothing logged yet" message="Your submitted expenses and their status will appear here." />}
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
  const { state, currentUser } = useStore();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['key']>('all');
  if (!currentUser) return null;
  const mine = state.expenses.filter((e) => e.userId === currentUser.id).sort(byNewest);
  const match = (k: (typeof FILTERS)[number]['key']) => (e: (typeof mine)[number]) =>
    k === 'all' ? true : k === 'pending' ? isPending(e) : e.status === k;
  const shown = mine.filter(match(filter));

  return (
    <Screen title="My expenses" subtitle={`${mine.length} submitted · ${formatINR(sum(mine))}`} right={<AddButton />}>
      <ChipRow>
        {FILTERS.map((f) => (
          <Chip key={f.key} label={f.label} count={mine.filter(match(f.key)).length} active={filter === f.key} onPress={() => setFilter(f.key)} />
        ))}
      </ChipRow>
      <ExpenseList expenses={shown} showPerson={false} empty={<EmptyState icon="file-tray-outline" title="Nothing here" />} />
    </Screen>
  );
}

export const styles = StyleSheet.create({
  headerAdd: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    ...glass(),
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderColor: colors.ink,
    borderRadius: radius.lg,
    padding: space.lg,
    boxShadow: '0 8px 32px rgba(255,255,255,0.12)',
  },
  ctaIcon: { width: 52, height: 52, borderRadius: radius.md, backgroundColor: 'rgba(0,0,0,0.08)', alignItems: 'center', justifyContent: 'center' },
  ctaTitle: { fontSize: 18, fontWeight: '800', color: colors.onInk, letterSpacing: -0.3 },
  ctaSub: { fontSize: 13.5, color: colors.onInkSoft, marginTop: 2 },
});
