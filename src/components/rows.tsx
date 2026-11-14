import React from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useNav } from '../navigation/Nav';
import { deptName, departmentSummary, userName } from '../store/selectors';
import { useStore } from '../store/Store';
import { colors, font, label, radius, shadow, space, statusMeta } from '../theme';
import { BudgetRequest, Department, Expense } from '../types';
import { formatCompact, formatINR, formatShortDate, relativeDay } from '../utils/format';
import { Composer } from './Composer';
import { Icon } from './icons';
import { Text, TextInput } from './Text';
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
      <IconCircle name={categoryIcon[expense.category] ?? 'receipt'} size={40} outline />
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={rowStyles.title} numberOfLines={1}>
          {expense.description}
        </Text>
        <Text style={rowStyles.meta} numberOfLines={1}>
          {meta}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 5 }}>
        <Money value={expense.amount} size={13.5} />
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

export type CardActions = {
  approve: () => void;
  decline: (reason?: string) => void;
  sendBack?: (reason?: string) => void;
  comment?: (text: string) => void;
};

// Bill card: icon, what and who, amount on the right. With actions, tapping the card opens a row of
// icon buttons (approve, decline, send back, comment) instead of putting the amount in a button.
export function ExpenseCard({
  expense,
  actions,
  note,
  noteColor,
  open,
  onToggle,
}: {
  expense: Expense;
  actions?: CardActions;
  note?: string;
  noteColor?: string;
  open?: boolean;
  onToggle?: () => void;
}) {
  const { state, currentUser } = useStore();
  const nav = useNav();
  const [commenting, setCommenting] = React.useState(false);
  const [text, setText] = React.useState('');
  const [confirm, setConfirm] = React.useState<'decline' | 'back' | null>(null);
  const [reason, setReason] = React.useState('');
  const who = expense.userId === currentUser?.id ? relativeDay(expense.date).toLowerCase() : userName(state, expense.userId);
  const status = note ? <Text style={[rowStyles.cardNote, { color: noteColor ?? colors.pending }]}>{note}</Text> : <StatusText status={expense.status} />;
  const expanded = !!actions && !!open;
  const first = userName(state, expense.userId).split(' ')[0];
  const buttons = actions
    ? [
        { key: 'approve', label: 'Approve', icon: 'check', solid: true, color: colors.onInk, onPress: actions.approve },
        { key: 'decline', label: 'Decline', icon: 'close', color: colors.negative, onPress: () => (setCommenting(false), setConfirm('decline')) },
        ...(actions.sendBack ? [{ key: 'back', label: 'Send back', icon: 'send-back', color: colors.ink, onPress: () => (setCommenting(false), setConfirm('back')) }] : []),
        ...(actions.comment ? [{ key: 'comment', label: 'Comment', icon: 'comment', color: colors.ink, onPress: () => (setConfirm(null), setCommenting((c) => !c)) }] : []),
      ]
    : [];
  return (
    <View style={[rowStyles.card, expanded && { borderColor: '#DCDCDC' }]}>
      <Pressable
        onPress={() => (actions && onToggle ? onToggle() : nav.push({ name: 'expense', id: expense.id }))}
        style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: space.md }, pressed && { opacity: 0.7 }]}
        accessibilityRole="button"
        accessibilityState={actions ? { expanded } : undefined}
      >
        <IconCircle name={categoryIcon[expense.category] ?? 'receipt'} size={40} outline />
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={rowStyles.expTitle} numberOfLines={1}>
            {expense.description}
          </Text>
          <Text style={rowStyles.meta} numberOfLines={1}>
            {who} · {deptName(state, expense.departmentId)}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <Money value={expense.amount} size={14} />
          {status}
        </View>
      </Pressable>
      {expanded ? (
        <View style={{ gap: 12 }}>
          <View style={rowStyles.dash} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            {buttons.map((b) => (
              <Pressable key={b.key} onPress={b.onPress} hitSlop={6} style={({ pressed }) => [{ alignItems: 'center', gap: 6, width: 64 }, pressed && { opacity: 0.7 }]} accessibilityRole="button" accessibilityLabel={`${b.label} ${formatINR(expense.amount)}`}>
                <View style={[rowStyles.actBtn, b.solid && { backgroundColor: colors.ink, borderColor: colors.ink }, b.key === 'comment' && commenting && { backgroundColor: '#F2F2F2' }]}>
                  <Icon name={b.icon} size={19} color={b.color} strokeWidth={2} />
                </View>
                <Text style={rowStyles.actLabel}>{b.label}</Text>
              </Pressable>
            ))}
          </View>
          {commenting && actions?.comment ? (
            <Composer
              compact
              value={text}
              onChange={setText}
              placeholder={`Add a comment for ${first}`}
              label={`Comment for ${first}`}
              onSend={() => {
                actions.comment!(text.trim());
                setText('');
                setCommenting(false);
              }}
            />
          ) : null}
          {confirm && actions ? (
            <View style={rowStyles.confirm} accessibilityRole="alert">
              <Text style={rowStyles.confirmTitle}>
                {confirm === 'decline' ? `Decline ${formatINR(expense.amount)} from ${first}?` : `Send this bill back to ${first}?`}
              </Text>
              <Text style={rowStyles.meta}>
                {confirm === 'decline' ? 'The bill is rejected and won’t be paid. ' : 'They can fix it and resubmit. '}
                {first} sees your reason.
              </Text>
              <TextInput
                value={reason}
                onChangeText={setReason}
                placeholder={confirm === 'decline' ? 'Reason (optional)' : 'What needs fixing? (optional)'}
                style={[rowStyles.reason, Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null]}
                accessibilityLabel="Reason"
              />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Pressable onPress={() => (setConfirm(null), setReason(''))} style={({ pressed }) => [rowStyles.cBtn, pressed && { opacity: 0.7 }]} accessibilityRole="button">
                  <Text style={rowStyles.cBtnText}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    const r = reason.trim() || undefined;
                    if (confirm === 'decline') actions.decline(r);
                    else actions.sendBack?.(r);
                    setConfirm(null);
                    setReason('');
                  }}
                  style={({ pressed }) => [rowStyles.cBtn, { flex: 1.4, backgroundColor: confirm === 'decline' ? colors.negative : colors.ink, borderColor: 'transparent' }, pressed && { opacity: 0.85 }]}
                  accessibilityRole="button"
                >
                  <Text style={[rowStyles.cBtnText, { color: colors.onInk }]}>{confirm === 'decline' ? 'Yes, decline' : 'Yes, send back'}</Text>
                </Pressable>
              </View>
            </View>
          ) : null}
          <ViewAllLink label="View bill" onPress={() => nav.push({ name: 'expense', id: expense.id })} />
        </View>
      ) : null}
    </View>
  );
}

// Home-screen money tile: label with a status dot, a large amount and a short hint.
export function SummaryTile({ label: title, dot, amount, hint, onPress }: { label: string; dot: string; amount: number; hint: string; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [rowStyles.summary, pressed && { opacity: 0.8 }]} accessibilityRole="button">
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: dot }} />
        <Text style={rowStyles.summaryLabel}>{title}</Text>
      </View>
      <Money value={amount} size={21} display />
      <Text style={rowStyles.meta}>{hint}</Text>
    </Pressable>
  );
}

// Transaction line: money paid back to you shows as +green, everything you spent as −.
export function TransactionRow({ expense }: { expense: Expense }) {
  const nav = useNav();
  const received = expense.status === 'paid';
  const status = expense.status === 'paid' ? 'Reimbursed' : expense.status === 'approved' ? 'Approved' : expense.status === 'rejected' ? 'Rejected' : expense.status === 'escalated' ? 'With producer' : 'Pending';
  return (
    <Pressable onPress={() => nav.push({ name: 'expense', id: expense.id })} style={({ pressed }) => [rowStyles.txn, pressed && { opacity: 0.6 }]} accessibilityRole="button">
      <IconCircle name={categoryIcon[expense.category] ?? 'receipt'} size={38} outline />
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text style={rowStyles.title} numberOfLines={1}>
          {expense.description}
        </Text>
        <Text style={rowStyles.meta} numberOfLines={1}>
          {relativeDay(expense.date)} · {status}
        </Text>
      </View>
      <Money value={received ? expense.amount : -expense.amount} size={13.5} color={received ? colors.positive : colors.ink} signed={received} />
    </Pressable>
  );
}

// Statement-style transaction line (as in a card statement): outlined round icon, title over a muted
// category, amount over the date, with generous spacing. Money paid back shows as +green.
export function StatementRow({ icon, title, sub, amount, date, credit, onPress }: { icon: string; title: string; sub: string; amount: number; date: string; credit?: boolean; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [rowStyles.stmt, pressed && { opacity: 0.6 }]} accessibilityRole="button">
      <View style={rowStyles.stmtIcon}>
        <Icon name={icon} size={16} color={colors.ink} strokeWidth={1.6} />
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
        <Text style={rowStyles.stmtTitle} numberOfLines={1}>
          {title}
        </Text>
        <Text style={rowStyles.stmtSub} numberOfLines={1}>
          {sub}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        <Money value={amount} size={13.5} color={credit ? colors.positive : colors.ink} signed={credit} />
        <Text style={rowStyles.stmtSub}>{date}</Text>
      </View>
    </Pressable>
  );
}

// A team or personal expense as a statement row.
export function ExpenseStatementRow({ expense, showPerson }: { expense: Expense; showPerson?: boolean }) {
  const { state } = useStore();
  const nav = useNav();
  const credit = !showPerson && expense.status === 'paid';
  const sub = showPerson ? `${userName(state, expense.userId)} · ${statusMeta[expense.status].label}` : credit ? 'reimbursed' : expense.category.toLowerCase();
  return (
    <StatementRow
      icon={categoryIcon[expense.category] ?? 'receipt'}
      title={expense.description}
      sub={sub}
      amount={expense.amount}
      date={formatShortDate(expense.date)}
      credit={credit}
      onPress={() => nav.push({ name: 'expense', id: expense.id })}
    />
  );
}

// Centred underlined link under a list, e.g. "View all transactions".
export function ViewAllLink({ label: text = 'View all transactions', onPress }: { label?: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={10} style={rowStyles.viewAll} accessibilityRole="link">
      <Text style={rowStyles.viewAllText}>{text}</Text>
    </Pressable>
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
  summary: { flex: 1, gap: 4, padding: space.lg, borderRadius: radius.lg, backgroundColor: colors.surface, boxShadow: shadow.soft },
  summaryLabel: { fontFamily: font.semibold, fontSize: 13.5, color: colors.inkSoft },
  txn: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 8 },
  stmt: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12 },
  stmtIcon: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: '#ECECEC', backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  stmtTitle: { fontFamily: font.medium, fontSize: 13.5, color: colors.ink },
  stmtSub: { fontFamily: font.regular, fontSize: 12, color: colors.inkMuted },
  viewAll: { alignSelf: 'center', paddingVertical: 6, marginTop: 10 },
  viewAllText: { fontFamily: font.medium, fontSize: 13, color: colors.ink, textDecorationLine: 'underline' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 10 },
  title: { fontFamily: font.medium, fontSize: 13.5, color: colors.ink },
  meta: { fontFamily: font.regular, fontSize: 12, color: colors.inkMuted },
  card: {
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    paddingVertical: 14,
    paddingHorizontal: 14,
    boxShadow: shadow.soft,
  },
  cardTitle: { fontFamily: font.medium, fontSize: 17.5, color: colors.ink },
  expTitle: { fontFamily: font.medium, fontSize: 14, color: colors.ink },
  dash: { borderTopWidth: 1, borderTopColor: '#E6E6E6', borderStyle: 'dashed' },
  actBtn: { width: 46, height: 46, borderRadius: 23, borderWidth: 1, borderColor: '#E6E6E6', backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  actLabel: { fontFamily: font.semibold, fontSize: 11.5, color: colors.inkSoft },
  confirm: { gap: 8, padding: 12, borderRadius: 14, backgroundColor: '#F7F7F7' },
  confirmTitle: { fontFamily: font.semibold, fontSize: 14, color: colors.ink },
  reason: { borderRadius: 12, borderWidth: 1, borderColor: '#E2E2E2', backgroundColor: colors.surface, paddingHorizontal: 12, paddingVertical: 9, fontFamily: font.regular, fontSize: 13, color: colors.ink },
  cBtn: { flex: 1, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#DADADA', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  cBtnText: { fontFamily: font.semibold, fontSize: 13, color: colors.ink },
  commentBox: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 14, paddingRight: 5, paddingVertical: 5, borderRadius: radius.pill, borderWidth: 1, borderColor: '#E6E6E6' },
  commentInput: { flex: 1, fontFamily: font.regular, fontSize: 13, color: colors.ink, paddingVertical: 4 },
  commentSend: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  cardNote: { ...label, fontSize: 11.5, letterSpacing: 0.1 },
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
  pct: { fontFamily: font.semibold, fontSize: 16 },
});
