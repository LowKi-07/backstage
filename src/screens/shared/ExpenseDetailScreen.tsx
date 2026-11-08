import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, LongArrow } from '../../components/icons';
import { ScallopEdge, TearLine } from '../../components/receipt';
import { Text } from '../../components/Text';
import { Button, Field, IconCircle, Notice, Screen, SectionTitle, sentence, StatementDivider, StatusText } from '../../components/ui';
import { useNav } from '../../navigation/Nav';
import { deptName, departmentSummary, userName } from '../../store/selectors';
import { useStore } from '../../store/Store';
import { colors, font, label, radius, space } from '../../theme';
import { AuditAction } from '../../types';
import { formatCompact, formatDate, formatDateTime, formatINR } from '../../utils/format';

const actionLabel: Record<AuditAction, string> = {
  submitted: 'submitted',
  approved: 'approved',
  escalated: 'sent to producer',
  rejected: 'rejected',
  paid: 'marked as paid',
};

const actionIcon: Record<AuditAction, string> = {
  submitted: 'send',
  approved: 'check',
  escalated: 'arrow-up-right',
  rejected: 'close',
  paid: 'banknote',
};

export function ExpenseDetailScreen({ id }: { id: string }) {
  const { state, currentUser, managerDecide, producerDecide, markPaid } = useStore();
  const nav = useNav();
  const insets = useSafeAreaInsets();
  const [note, setNote] = useState('');
  const [flash, setFlash] = useState<string | null>(null);
  const expense = state.expenses.find((e) => e.id === id);

  if (!expense || !currentUser) {
    return (
      <Screen onBack={nav.pop} title="expense not found">
        <Text>This expense may have been removed.</Text>
      </Screen>
    );
  }

  const dept = state.departments.find((d) => d.id === expense.departmentId);
  const summary = departmentSummary(state, expense.departmentId);
  const isManagerOfDept = currentUser.role === 'manager' && dept?.managerId === currentUser.id && expense.userId !== currentUser.id;
  const isProducer = currentUser.role === 'producer';

  const canManagerAct = isManagerOfDept && expense.status === 'submitted';
  const canProducerAct = isProducer && (expense.status === 'escalated' || expense.status === 'submitted');
  const canPay = isProducer && expense.status === 'approved';
  const deciding = canManagerAct || canProducerAct;
  const openStatus = expense.status === 'submitted' || expense.status === 'escalated';

  const approve = () => {
    if (canManagerAct) {
      const result = managerDecide(expense.id, 'approve', note);
      setFlash(result === 'escalated' ? 'Approved by you and sent to the producer for final sign-off (over the limit or over budget).' : 'Approved.');
    } else {
      producerDecide(expense.id, 'approve', note);
      setFlash('Approved. It’s now ready for payment.');
    }
    setNote('');
  };

  const reject = () => {
    if (!note.trim()) {
      setFlash('Add a short reason below so the crew member knows why it was rejected.');
      return;
    }
    if (canManagerAct) managerDecide(expense.id, 'reject', note);
    else producerDecide(expense.id, 'reject', note);
    setNote('');
    setFlash('Rejected.');
  };

  const escalate = () => {
    managerDecide(expense.id, 'escalate', note);
    setNote('');
    setFlash('Sent to the producer.');
  };

  const submittedAt = expense.history[0]?.at ?? expense.createdAt;
  const ref = expense.id.slice(-4).toUpperCase();
  const amountText = formatINR(expense.amount, { decimals: true });

  const head =
    deciding ? { icon: 'clock', text: 'Pending your approval' }
    : expense.status === 'submitted' ? { icon: 'clock', text: 'Waiting for manager' }
    : expense.status === 'escalated' ? { icon: 'clock', text: 'With the producer' }
    : expense.status === 'approved' ? { icon: 'check', text: 'Approved · awaiting payment' }
    : expense.status === 'paid' ? { icon: 'check', text: 'Paid' }
    : { icon: 'close', text: 'Rejected' };
  const [whole, paise] = amountText.split('.');

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + space.sm }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Pressable onPress={nav.pop} hitSlop={14} accessibilityLabel="Go back" accessibilityRole="button">
            <LongArrow color={colors.onInk} />
          </Pressable>
          <Text style={styles.topTitle}>{deciding ? 'Review a bill' : 'Expense'}</Text>
          <StatusText status={expense.status} />
        </View>

        {/* The bill as a ticket: a white top stub over a wider off-white details card. */}
        <View style={styles.ticket}>
          <View style={styles.stub}>
            <ScallopEdge edge="top" color="#FFFFFF" />
            <View style={styles.stubBody}>
              <View style={styles.headRow}>
                <View style={styles.headIcon}>
                  <Icon name={head.icon} size={13} color={colors.onInk} strokeWidth={2.6} />
                </View>
                <Text style={styles.headText}>{head.text}</Text>
              </View>
              <Text style={styles.vendor} numberOfLines={2}>
                {(expense.vendor ?? expense.description).toUpperCase()}
              </Text>
              <Text style={styles.refText}>Bill reference #{ref}</Text>
            </View>
          </View>
          <View style={styles.details}>
            <TearLine notch={BG} />
            <View style={styles.rows}>
              <Row label="Date & time" value={formatDateTime(submittedAt)} />
              <Row label="Submitted by" value={userName(state, expense.userId)} />
              <Row label="Department" value={deptName(state, expense.departmentId)} />
              <Row label="Category" value={expense.category} />
              <Row label="Item" value={expense.description} />
              <Row label="Date of spend" value={formatDate(expense.date)} />
              <Row label="Receipt photo" value={expense.receiptUri ? 'Attached' : 'Not attached'} />
              {expense.gstin ? <Row label="Vendor GSTIN" value={expense.gstin} /> : null}
              {(isManagerOfDept || isProducer) && dept ? (
                <Row label="Dept budget" value={`${formatCompact(summary.spent)} / ${formatCompact(summary.budget)} · ${Math.round(((summary.spent + (openStatus ? expense.amount : 0)) / summary.budget) * 100)}%`} />
              ) : null}
            </View>
            <TearLine notch={BG} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total amount</Text>
              <Text style={styles.total}>
                {whole}
                <Text style={[styles.total, { color: '#BDBDBD' }]}>.{paise}</Text>
              </Text>
            </View>
          </View>
          <ScallopEdge edge="bottom" color={DETAILS} />
        </View>

        <View style={[styles.panel, { paddingBottom: insets.bottom + space.xl }]}>
          {flash ? <Notice text={flash} /> : null}
          {deciding ? (
            <View style={{ gap: space.md }}>
              <Field label="" placeholder="Add a note (needed to reject)" value={note} onChangeText={setNote} multiline />
              <View style={{ flexDirection: 'row', gap: space.sm }}>
                <Button label="Reject" variant="outline" small onPress={reject} style={{ flex: 1 }} />
                {canManagerAct ? <Button label="Send to producer" variant="outline" small onPress={escalate} style={{ flex: 1.4 }} /> : null}
              </View>
              <Button label={`Approve ${formatINR(expense.amount)}`} onPress={approve} />
            </View>
          ) : null}
          {canPay ? (
            <Button
              label={`Mark ${formatINR(expense.amount)} as paid`}
              onPress={() => {
                markPaid([expense.id], 'Paid via bank transfer');
                setFlash('Marked as paid. The crew member sees it in their payouts.');
              }}
            />
          ) : null}
          {dept && (isManagerOfDept || isProducer) ? (
            <Button label={`Open ${dept.name} budget`} variant="outline" small onPress={() => nav.push({ name: 'department', id: dept.id })} />
          ) : null}

          {expense.receiptUri ? (
            <>
              <SectionTitle title="Receipt photo" />
              <View style={styles.receipt}>
                <Image source={{ uri: expense.receiptUri }} style={{ width: '100%', height: 320 }} resizeMode="cover" />
              </View>
            </>
          ) : null}

          <StatementDivider text="audit trail" />
          {expense.history.map((h, i) => (
            <View key={i} style={styles.auditRow}>
              <IconCircle name={actionIcon[h.action]} size={46} />
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={styles.auditTitle}>{sentence(actionLabel[h.action])}</Text>
                <Text style={styles.cardHint}>by {userName(state, h.byUserId)}</Text>
                {h.note ? <Text style={styles.auditNote}>“{h.note}”</Text> : null}
              </View>
              <Text style={styles.auditTime}>{formatDateTime(h.at)}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function Row({ label: text, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{text}</Text>
      <Text style={styles.rowValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const BG = '#0E0E0E';
const DETAILS = '#F2F1EE';

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.xl, minHeight: 44 },
  topTitle: { fontFamily: font.bold, fontSize: 16, color: colors.onInk },
  ticket: { marginHorizontal: space.lg, marginTop: space.lg, marginBottom: space.xl },
  stub: { zIndex: 2, marginHorizontal: 12, boxShadow: '0 8px 14px rgba(0,0,0,0.25)' },
  stubBody: { backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 22, alignItems: 'center', gap: 6 },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headIcon: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  headText: { fontFamily: font.bold, fontSize: 15, color: colors.ink },
  vendor: { marginTop: 10, fontFamily: font.display, fontSize: 22, color: colors.ink, letterSpacing: -0.4, textAlign: 'center' },
  refText: { fontFamily: font.regular, fontSize: 12.5, color: colors.inkMuted },
  details: { zIndex: 1, marginTop: -26, paddingTop: 32, backgroundColor: DETAILS, borderTopLeftRadius: 18, borderTopRightRadius: 18 },
  rows: { paddingHorizontal: 22, paddingVertical: 16, gap: 13 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  rowLabel: { fontFamily: font.regular, fontSize: 13, color: colors.inkMuted },
  rowValue: { flexShrink: 1, textAlign: 'right', fontFamily: font.bold, fontSize: 13, color: colors.ink },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingHorizontal: 22, paddingTop: 18, paddingBottom: 16 },
  totalLabel: { fontFamily: font.semibold, fontSize: 14, color: colors.ink },
  total: { fontFamily: font.display, fontSize: 30, color: colors.ink, letterSpacing: -1 },
  panel: { backgroundColor: colors.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: space.xl, paddingTop: space.xl, gap: space.md },
  cardHint: { fontFamily: font.regular, fontSize: 14, color: colors.inkMuted },
  receipt: { borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.line },
  auditRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space.lg, paddingVertical: space.sm },
  auditTitle: { fontFamily: font.medium, fontSize: 16.5, color: colors.ink },
  auditNote: { fontFamily: font.regular, fontSize: 14, color: colors.ink, fontStyle: 'italic', lineHeight: 19 },
  auditTime: { ...label, fontSize: 12, letterSpacing: 0.1, color: colors.inkMuted, marginTop: 4 },
});
