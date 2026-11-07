import React, { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { DashedRule, Receipt, ReceiptRow, receiptType } from '../../components/receipt';
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

  return (
    <Screen onBack={nav.pop} right={<StatusText status={expense.status} />}>
      {/* The bill as a printed till receipt. */}
      <View style={styles.tray}>
        <Receipt>
          <View style={{ alignItems: 'center', gap: 2 }}>
            <Text style={receiptType.heading} numberOfLines={2}>
              {(expense.vendor ?? expense.description).toUpperCase()}
            </Text>
            <Text style={receiptType.sub}>
              {expense.category.toUpperCase()} · {deptName(state, expense.departmentId).toUpperCase()}
            </Text>
            <Text style={receiptType.sub}>
              {formatDateTime(submittedAt)} · Ref {ref}
            </Text>
          </View>
          <DashedRule />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={receiptType.small}>ITEM</Text>
            <Text style={receiptType.small}>AMOUNT</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
            <Text style={[receiptType.body, { flex: 1 }]}>{expense.description}</Text>
            <Text style={[receiptType.body, { fontFamily: font.monoBold }]}>{amountText.replace('₹', '')}</Text>
          </View>
          <DashedRule />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Text style={[receiptType.body, { fontFamily: font.monoBold, letterSpacing: 1 }]}>TOTAL</Text>
            <Text style={receiptType.total}>{amountText}</Text>
          </View>
          <DashedRule />
          <ReceiptRow label="Submitted by" value={userName(state, expense.userId)} />
          <ReceiptRow label="Date of spend" value={formatDate(expense.date)} />
          <ReceiptRow label="Receipt photo" value={expense.receiptUri ? 'Attached' : 'Not attached'} valueColor={expense.receiptUri ? colors.positive : colors.negative} />
          {expense.gstin ? <ReceiptRow label="Vendor GSTIN" value={expense.gstin} /> : null}
          {(isManagerOfDept || isProducer) && dept ? (
            <ReceiptRow
              label="Dept budget"
              value={`${formatCompact(summary.spent)} / ${formatCompact(summary.budget)} · ${Math.round(((summary.spent + (openStatus ? expense.amount : 0)) / summary.budget) * 100)}%`}
              valueColor={openStatus && summary.spent + expense.amount > summary.budget ? colors.negative : undefined}
            />
          ) : null}
        </Receipt>
      </View>

      {flash ? <Notice text={flash} /> : null}

      {deciding ? (
        <View style={{ gap: space.md }}>
          <Field label="Note (needed to reject)" placeholder="e.g. Please attach the GST bill" value={note} onChangeText={setNote} multiline />
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            <Button label="Reject" variant="danger" small onPress={reject} style={{ flex: 1 }} />
            {canManagerAct ? <Button label="Send to producer" variant="outline" small onPress={escalate} style={{ flex: 1.6 }} /> : null}
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  tray: { backgroundColor: '#EFEFEC', borderRadius: radius.lg, paddingHorizontal: 14, paddingVertical: 16 },
  cardHint: { fontFamily: font.regular, fontSize: 14, color: colors.inkMuted },
  receipt: { borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.line },
  auditRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space.lg, paddingVertical: space.sm },
  auditTitle: { fontFamily: font.medium, fontSize: 16.5, color: colors.ink },
  auditNote: { fontFamily: font.regular, fontSize: 14, color: colors.ink, fontStyle: 'italic', lineHeight: 19 },
  auditTime: { ...label, fontSize: 12, letterSpacing: 0.1, color: colors.inkMuted, marginTop: 4 },
});
