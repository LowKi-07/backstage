import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useNav } from '../navigation/Nav';
import { deptName, departmentSummary, userName } from '../store/selectors';
import { useStore } from '../store/Store';
import { colors, font, label, radius, shadow, space } from '../theme';
import { BudgetRequest, Department, Expense } from '../types';
import { formatCompact, formatShortDate, relativeDay } from '../utils/format';
import { Text } from './Text';
import { Button, IconCircle, Money, ProgressBar, StatementDivider, StatusText } from './ui';

export const categoryIcon: Record<string, string> = {
  Fuel: 'fuel',
  Transport: 'car',
  'Food & Catering': 'utensils',
  Accommodation: 'bed',
  'Equipment Rental': 'video',
  'Props & Materials': 'package',
  'Costume & Fabric': 'shirt',
  'Makeup Supplies': 'brush',
  'Location Fees': 'map-pin',
  'Labour / Daily Wages': 'hammer',
  'Printing & Stationery': 'printer',
  Miscellaneous: 'ellipsis',
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// Transaction-style row: round icon, description, who/where, amount over status.
export function ExpenseRow({ expense, showPerson = true }: { expense: Expense; showPerson?: boolean }) {
  const { state } = useStore();
  const nav = useNav();
  const meta = [showPerson ? userName(state, expense.userId) : expense.category.toLowerCase(), formatShortDate(expense.date)].join(' · ');
  return (
    <Pressable onPress={() => nav.push({ name: 'expense', id: expense.id })} style={({ pressed }) => [rowStyles.row, pressed && { opacity: 0.6 }]} accessibilityRole="button">
      <IconCircle name={categoryIcon[expense.category] ?? 'receipt'} size={50} />
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={rowStyles.title} numberOfLines={1}>
          {expense.description}
        </Text>
        <Text style={rowStyles.meta} numberOfLines={1}>
          {meta}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 5 }}>
        <Money value={expense.amount} />
        <StatusText status={expense.status} />
      </View>
    </Pressable>
  );
}

// Rows grouped by month under a dashed statement divider.
export function ExpenseList({ expenses, showPerson, empty, grouped = true }: { expenses: Expense[]; showPerson?: boolean; empty?: React.ReactNode; grouped?: boolean }) {
  if (expenses.length === 0) return <>{empty}</>;
  if (!grouped) {
    return (
      <View style={{ gap: space.xs }}>
        {expenses.map((e) => (
          <ExpenseRow key={e.id} expense={e} showPerson={showPerson} />
        ))}
      </View>
    );
  }
  const groups: { key: string; title: string; items: Expense[] }[] = [];
  for (const e of expenses) {
    const d = new Date(e.date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    let g = groups.find((x) => x.key === key);
    if (!g) {
      g = { key, title: MONTHS[d.getMonth()], items: [] };
      groups.push(g);
    }
    g.items.push(e);
  }
  return (
    <View style={{ gap: space.xs }}>
      {groups.map((g) => (
        <View key={g.key} style={{ gap: space.xs }}>
          <StatementDivider text={`${g.title} · ${g.items.length} ${g.items.length === 1 ? 'bill' : 'bills'}`} amount={g.items.reduce((a, e) => a + e.amount, 0)} />
          {g.items.map((e) => (
            <ExpenseRow key={e.id} expense={e} showPerson={showPerson} />
          ))}
        </View>
      ))}
    </View>
  );
}

// Bill-style card with a solid action button and a status line beneath it.
export function ExpenseCard({
  expense,
  actionLabel,
  onAction,
  note,
  noteColor,
}: {
  expense: Expense;
  actionLabel?: string;
  onAction?: () => void;
  note?: string;
  noteColor?: string;
}) {
  const { state, currentUser } = useStore();
  const nav = useNav();
  const who = expense.userId === currentUser?.id ? relativeDay(expense.date).toLowerCase() : userName(state, expense.userId);
  const status = note ? <Text style={[rowStyles.cardNote, { color: noteColor ?? colors.pending }]}>{note}</Text> : <StatusText status={expense.status} />;
  const hasAction = !!(actionLabel && onAction);
  // The details row opens the bill; the action row sits outside it so buttons never nest.
  return (
    <View style={rowStyles.card}>
      <Pressable
        onPress={() => nav.push({ name: 'expense', id: expense.id })}
        style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: space.md }, pressed && { opacity: 0.7 }]}
        accessibilityRole="button"
      >
        <IconCircle name={categoryIcon[expense.category] ?? 'receipt'} size={54} />
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={rowStyles.cardTitle} numberOfLines={1}>
            {expense.description}
          </Text>
          <Text style={rowStyles.meta} numberOfLines={1}>
            {who} · {deptName(state, expense.departmentId)}
          </Text>
        </View>
        {!hasAction ? (
          <View style={{ alignItems: 'flex-end', gap: 6 }}>
            <Money value={expense.amount} size={18} />
            {status}
          </View>
        ) : null}
      </Pressable>
      {hasAction ? (
        <View style={rowStyles.cardActions}>
          {status}
          <Button label={actionLabel!} small onPress={onAction!} style={{ minWidth: 150 }} />
        </View>
      ) : null}
    </View>
  );
}

export function DepartmentCard({ dept, onPress }: { dept: Department; onPress?: () => void }) {
  const { state } = useStore();
  const s = departmentSummary(state, dept.id);
  const pctColor = s.pct >= 1 ? colors.negative : s.pct >= 0.8 ? colors.pending : colors.positive;
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [rowStyles.deptCard, pressed && { opacity: 0.85 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
        <IconCircle name={dept.icon} size={50} />
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={rowStyles.cardTitle}>{dept.name}</Text>
          <Text style={rowStyles.meta}>
            {formatCompact(s.spent)} of {formatCompact(s.budget)}
            {s.pending > 0 ? ` · ${formatCompact(s.pending)} pending` : ''}
          </Text>
        </View>
        <Text style={[rowStyles.pct, { color: pctColor }]}>{Math.round(s.pct * 100)}%</Text>
      </View>
      <ProgressBar value={s.pct} pending={s.budget ? s.pending / s.budget : 0} />
    </Pressable>
  );
}

const requestStatus: Record<BudgetRequest['status'], { label: string; color: string }> = {
  pending: { label: 'Pending', color: colors.pending },
  approved: { label: 'Approved', color: colors.positive },
  rejected: { label: 'Declined', color: colors.negative },
};

export function BudgetRequestRow({ request }: { request: BudgetRequest }) {
  const { state } = useStore();
  const s = requestStatus[request.status];
  return (
    <View style={rowStyles.row}>
      <IconCircle name="trending" size={50} />
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={rowStyles.title} numberOfLines={1}>
          {deptName(state, request.departmentId)}
        </Text>
        <Text style={rowStyles.meta} numberOfLines={2}>
          {request.reason}
        </Text>
        {request.note ? <Text style={[rowStyles.meta, { fontStyle: 'italic' }]}>“{request.note}”</Text> : null}
      </View>
      <View style={{ alignItems: 'flex-end', gap: 5 }}>
        <Money value={request.amount} signed />
        <Text style={[rowStyles.cardNote, { color: s.color }]}>{s.label}</Text>
      </View>
    </View>
  );
}

export const rowStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.lg, paddingVertical: space.md },
  title: { fontFamily: font.medium, fontSize: 17, color: colors.ink },
  meta: { fontFamily: font.regular, fontSize: 14.5, color: colors.inkMuted },
  card: {
    gap: space.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg + 4,
    borderWidth: 1,
    borderColor: colors.line,
    paddingVertical: space.lg,
    paddingHorizontal: space.lg,
    boxShadow: shadow.soft,
  },
  cardTitle: { fontFamily: font.medium, fontSize: 17.5, color: colors.ink },
  cardNote: { ...label, fontSize: 12.5, letterSpacing: 0.1 },
  cardActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md, paddingLeft: 4 },
  deptCard: {
    gap: space.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg + 4,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space.lg,
    boxShadow: shadow.soft,
  },
  pct: { fontFamily: font.semibold, fontSize: 17 },
});
