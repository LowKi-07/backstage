import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNav } from '../navigation/Nav';
import { deptName, departmentSummary, userName } from '../store/selectors';
import { useStore } from '../store/Store';
import { colors, glass, radius, space } from '../theme';
import { Department, Expense } from '../types';
import { formatCompact, formatINR, relativeDay } from '../utils/format';
import { Icon, ProgressBar, StatusBadge } from './ui';

export const categoryIcon: Record<string, string> = {
  Fuel: 'flame-outline',
  Transport: 'car-outline',
  'Food & Catering': 'restaurant-outline',
  Accommodation: 'bed-outline',
  'Equipment Rental': 'videocam-outline',
  'Props & Materials': 'cube-outline',
  'Costume & Fabric': 'shirt-outline',
  'Makeup Supplies': 'brush-outline',
  'Location Fees': 'location-outline',
  'Labour / Daily Wages': 'hammer-outline',
  'Printing & Stationery': 'print-outline',
  Miscellaneous: 'ellipsis-horizontal-circle-outline',
};

export function ExpenseRow({ expense, showPerson = true, right }: { expense: Expense; showPerson?: boolean; right?: React.ReactNode }) {
  const { state } = useStore();
  const nav = useNav();
  const meta = [showPerson ? userName(state, expense.userId) : null, deptName(state, expense.departmentId), relativeDay(expense.date)]
    .filter(Boolean)
    .join(' · ');
  return (
    <Pressable onPress={() => nav.push({ name: 'expense', id: expense.id })} style={({ pressed }) => [rowStyles.row, pressed && { opacity: 0.7 }]}>
      <View style={rowStyles.iconWrap}>
        <Icon name={categoryIcon[expense.category] ?? 'receipt-outline'} size={20} color={colors.ink} />
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={rowStyles.title} numberOfLines={1}>
          {expense.description}
        </Text>
        <Text style={rowStyles.meta} numberOfLines={1}>
          {meta}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        <Text style={rowStyles.amount}>{formatINR(expense.amount)}</Text>
        {right ?? <StatusBadge status={expense.status} />}
      </View>
    </Pressable>
  );
}

export function ExpenseList({ expenses, showPerson, empty }: { expenses: Expense[]; showPerson?: boolean; empty?: React.ReactNode }) {
  if (expenses.length === 0) return <>{empty}</>;
  return (
    <View style={rowStyles.listCard}>
      {expenses.map((e, i) => (
        <View key={e.id}>
          {i > 0 ? <View style={rowStyles.sep} /> : null}
          <ExpenseRow expense={e} showPerson={showPerson} />
        </View>
      ))}
    </View>
  );
}

export function DepartmentBudgetRow({ dept, onPress }: { dept: Department; onPress?: () => void }) {
  const { state } = useStore();
  const s = departmentSummary(state, dept.id);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [rowStyles.deptRow, pressed && onPress && { opacity: 0.7 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
        <View style={rowStyles.iconWrap}>
          <Icon name={dept.icon} size={20} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={rowStyles.title}>{dept.name}</Text>
          <Text style={rowStyles.meta}>
            {formatCompact(s.spent)} of {formatCompact(s.budget)}
            {s.pending > 0 ? ` · ${formatCompact(s.pending)} pending` : ''}
          </Text>
        </View>
        <Text style={[rowStyles.pct, s.pct < 0.8 ? { color: colors.inkSoft } : null]}>
          {Math.round(s.pct * 100)}%
        </Text>
        {onPress ? <Icon name="chevron-forward" size={18} color={colors.inkMuted} /> : null}
      </View>
      <View style={{ marginTop: space.sm }}>
        <ProgressBar value={s.pct} pending={s.budget ? s.pending / s.budget : 0} />
      </View>
    </Pressable>
  );
}

export const rowStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md, paddingHorizontal: space.lg },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 15, fontWeight: '600', color: colors.ink },
  meta: { fontSize: 12.5, color: colors.inkSoft },
  amount: { fontSize: 15, fontWeight: '700', color: colors.ink },
  pct: { fontSize: 15, fontWeight: '700', color: colors.ink, minWidth: 40, textAlign: 'right' },
  listCard: {
    ...glass(),
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: colors.line, marginLeft: 68 },
  deptRow: { paddingVertical: space.md, paddingHorizontal: space.lg },
});
