import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ExpenseList } from '../../components/rows';
import { Button, Card, EmptyState, Pill, ProgressBar, Screen, SectionTitle, Stat } from '../../components/ui';
import { useNav } from '../../navigation/Nav';
import { byNewest, categoryBreakdown, departmentSummary, userName } from '../../store/selectors';
import { useStore } from '../../store/Store';
import { colors, space } from '../../theme';
import { formatCompact, formatINR, relativeDay } from '../../utils/format';

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
    <Screen title={dept.name} subtitle={`Managed by ${userName(state, dept.managerId)}`} onBack={nav.pop}>
      <Card style={{ gap: space.md }}>
        <View style={{ flexDirection: 'row' }}>
          <Stat label="Spent" value={formatCompact(s.spent)} />
          <Stat label="Budget" value={formatCompact(s.budget)} />
          <Stat label="Left" value={formatCompact(s.remaining)} tone={s.remaining < 0 ? colors.danger : colors.success} />
        </View>
        <ProgressBar value={s.pct} pending={s.budget ? s.pending / s.budget : 0} height={10} />
        <Text style={{ color: colors.inkSoft, fontSize: 13 }}>
          {Math.round(s.pct * 100)}% used{s.pending > 0 ? ` · ${formatINR(s.pending)} awaiting approval` : ''}
        </Text>
      </Card>

      {isManager ? (
        <Button label="Request more budget" icon="add-circle-outline" variant="secondary" onPress={() => nav.push({ name: 'budgetRequest', departmentId: id })} />
      ) : null}

      {cats.length > 0 ? (
        <>
          <SectionTitle title="By category" />
          <Card style={{ gap: space.md }}>
            {cats.map((c) => (
              <View key={c.category} style={{ gap: 4 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={styles.catName}>{c.category}</Text>
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
          <SectionTitle title="Budget requests" />
          <Card style={{ gap: space.md }}>
            {requests.map((r) => (
              <View key={r.id} style={{ gap: 4 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.catAmt}>+{formatINR(r.amount)}</Text>
                  <Pill
                    label={r.status === 'pending' ? 'Pending' : r.status === 'approved' ? 'Approved' : 'Rejected'}
                    fg={r.status === 'pending' ? colors.warning : r.status === 'approved' ? colors.success : colors.danger}
                    bg={r.status === 'pending' ? colors.warningSoft : r.status === 'approved' ? colors.successSoft : colors.dangerSoft}
                  />
                </View>
                <Text style={{ color: colors.ink, fontSize: 14 }}>{r.reason}</Text>
                <Text style={{ color: colors.inkMuted, fontSize: 12 }}>
                  {userName(state, r.requestedBy)} · {relativeDay(r.createdAt)}
                  {r.note ? ` · “${r.note}”` : ''}
                </Text>
              </View>
            ))}
          </Card>
        </>
      ) : null}

      <SectionTitle title={`Expenses (${expenses.length})`} />
      <ExpenseList expenses={expenses} empty={<EmptyState icon="receipt-outline" title="No expenses yet" />} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  catName: { fontSize: 14, color: colors.ink },
  catAmt: { fontSize: 14, fontWeight: '700', color: colors.ink },
  catTrack: { height: 6, backgroundColor: colors.track, borderRadius: 3, overflow: 'hidden' },
  catBar: { height: 6, backgroundColor: colors.brand, borderRadius: 3 },
});
