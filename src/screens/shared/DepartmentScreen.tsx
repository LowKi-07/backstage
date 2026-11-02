import React from 'react';
import { StyleSheet, View } from 'react-native';
import { BudgetRequestRow, ExpenseList } from '../../components/rows';
import { Text } from '../../components/Text';
import { Button, Card, EmptyState, Hero, ProgressBar, Screen, SectionTitle, Stat } from '../../components/ui';
import { useNav } from '../../navigation/Nav';
import { byNewest, categoryBreakdown, departmentSummary, userName } from '../../store/selectors';
import { useStore } from '../../store/Store';
import { colors, font, space } from '../../theme';
import { formatCompact, formatINR } from '../../utils/format';

export function DepartmentScreen({ id }: { id: string }) {
  const { state, currentUser } = useStore();
  const nav = useNav();
  const dept = state.departments.find((d) => d.id === id);
  if (!dept || !currentUser) return null;

  const s = departmentSummary(state, id);
  const expenses = state.expenses.filter((e) => e.departmentId === id).sort(byNewest);
  const cats = categoryBreakdown(expenses);
  const requests = state.budgetRequests.filter((r) => r.departmentId === id);
  const isManager = dept.managerId === currentUser.id;
  const maxCat = cats[0]?.amount ?? 1;

  return (
    <Screen onBack={nav.pop}>
      <Hero eyebrow={`managed by ${userName(state, dept.managerId)}`} lines={[dept.name.toLowerCase(), 'has spent']} amount={s.spent}>
        <Text style={styles.heroSub}>
          of {formatCompact(s.budget)} · {Math.round(s.pct * 100)}% used
        </Text>
      </Hero>

      <Card style={{ gap: space.lg }}>
        <ProgressBar value={s.pct} pending={s.budget ? s.pending / s.budget : 0} height={5} />
        <View style={{ flexDirection: 'row' }}>
          <Stat label="left" value={formatCompact(s.remaining)} tone={s.remaining < 0 ? colors.negative : colors.positive} />
          <Stat label="pending" value={formatCompact(s.pending)} tone={colors.pending} />
          <Stat label="bills" value={`${s.count}`} />
        </View>
        {s.pending > 0 ? <Text style={styles.meta}>{formatINR(s.pending)} is waiting for approval.</Text> : null}
      </Card>

      {isManager ? <Button label="Request more budget" icon="plus" variant="outline" onPress={() => nav.push({ name: 'budgetRequest', departmentId: id })} /> : null}

      {cats.length > 0 ? (
        <>
          <SectionTitle title="by category" />
          <Card style={{ gap: space.lg }}>
            {cats.map((c) => (
              <View key={c.category} style={{ gap: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={styles.catName}>{c.category.toLowerCase()}</Text>
                  <Text style={styles.catAmt}>{formatINR(c.amount)}</Text>
                </View>
                <View style={styles.catTrack}>
                  <View style={[styles.catBar, { width: `${(c.amount / maxCat) * 100}%` }]} />
                </View>
              </View>
            ))}
          </Card>
        </>
      ) : null}

      {requests.length > 0 ? (
        <>
          <SectionTitle title="budget requests" />
          {requests.map((r) => (
            <BudgetRequestRow key={r.id} request={r} />
          ))}
        </>
      ) : null}

      <SectionTitle title={`expenses (${expenses.length})`} />
      <ExpenseList expenses={expenses} empty={<EmptyState icon="receipt" title="no expenses yet" />} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroSub: { fontFamily: font.medium, fontSize: 15, color: colors.inkSoft, marginTop: 2 },
  meta: { fontFamily: font.regular, fontSize: 14, color: colors.inkMuted },
  catName: { fontFamily: font.medium, fontSize: 15, color: colors.ink },
  catAmt: { fontFamily: font.semibold, fontSize: 15, color: colors.ink },
  catTrack: { height: 4, backgroundColor: colors.track, borderRadius: 2, overflow: 'hidden' },
  catBar: { height: 4, backgroundColor: colors.ink, borderRadius: 2 },
});
