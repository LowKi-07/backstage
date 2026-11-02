import React, { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Icon } from '../../components/icons';
import { categoryIcon } from '../../components/rows';
import { Text } from '../../components/Text';
import { Button, Card, Field, IconCircle, Money, Notice, ProgressBar, Screen, SectionTitle, StatementDivider, StatusText } from '../../components/ui';
import { useNav } from '../../navigation/Nav';
import { deptName, departmentSummary, userName } from '../../store/selectors';
import { useStore } from '../../store/Store';
import { colors, font, label, radius, space } from '../../theme';
import { AuditAction } from '../../types';
import { formatCompact, formatDate, formatDateTime } from '../../utils/format';

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

  return (
    <Screen onBack={nav.pop}>
      <View style={styles.top}>
        <View style={{ flex: 1, gap: 6 }}>
          <StatusText status={expense.status} style={{ fontSize: 13 }} />
          <Money value={expense.amount} size={42} display />
        </View>
        {deciding ? <Button label="Approve" onPress={approve} style={styles.topButton} /> : null}
        {canPay ? (
          <Button
            label="Mark paid"
            onPress={() => {
              markPaid([expense.id], 'Paid via bank transfer');
              setFlash('Marked as paid. The crew member sees it in their payouts.');
            }}
            style={styles.topButton}
          />
        ) : null}
      </View>

      {flash ? <Notice text={flash} /> : null}

      {/* Indigo "bill card": the expense at a glance. */}
      <View style={styles.billCard}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ gap: 4, flex: 1 }}>
            <Text style={styles.billDept}>{deptName(state, expense.departmentId).toLowerCase()}</Text>
            <Text style={styles.billCategory}>{expense.category.toLowerCase()}</Text>
          </View>
          <View style={styles.billIcon}>
            <Icon name={categoryIcon[expense.category] ?? 'receipt'} size={22} color={colors.onInk} />
          </View>
        </View>
        <Text style={styles.billDesc}>{expense.description}</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <Text style={styles.billRef}>•• {expense.id.slice(-4).toUpperCase()}</Text>
          <Text style={styles.billDate}>{formatDate(expense.date)}</Text>
        </View>
      </View>

      {deciding ? (
        <View style={{ gap: space.md }}>
          <Field label="Note (needed to reject)" placeholder="e.g. Please attach the GST bill" value={note} onChangeText={setNote} multiline />
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            <Button label="Reject" variant="danger" small onPress={reject} style={{ flex: 1 }} />
            {canManagerAct ? <Button label="Send to producer" variant="outline" small onPress={escalate} style={{ flex: 1.6 }} /> : null}
          </View>
        </View>
      ) : null}

      {(isManagerOfDept || isProducer) && dept ? (
        <Card onPress={() => nav.push({ name: 'department', id: dept.id })} style={{ gap: space.md }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={styles.cardLabel}>{dept.name} budget</Text>
            <Text style={styles.cardValue}>
              {formatCompact(summary.spent)} / {formatCompact(summary.budget)}
            </Text>
          </View>
          <ProgressBar value={summary.pct} pending={openStatus && summary.budget ? expense.amount / summary.budget : 0} />
          {openStatus ? (
            <Text style={[styles.cardHint, summary.spent + expense.amount > summary.budget && { color: colors.negative }]}>
              {Math.round(((summary.spent + expense.amount) / summary.budget) * 100)}% used if this is approved
            </Text>
          ) : null}
        </Card>
      ) : null}

      <SectionTitle title="details" />
      <View style={{ gap: 2 }}>
        <Detail label="submitted by" value={userName(state, expense.userId)} />
        {expense.vendor ? <Detail label="vendor" value={expense.vendor} /> : null}
        {expense.gstin ? <Detail label="vendor GSTIN" value={expense.gstin} /> : null}
        <Detail label="reference" value={expense.id.toUpperCase()} />
      </View>

      <SectionTitle title="receipt" />
      {expense.receiptUri ? (
        <View style={styles.receipt}>
          <Image source={{ uri: expense.receiptUri }} style={{ width: '100%', height: 320 }} resizeMode="cover" />
        </View>
      ) : (
        <View style={styles.noReceipt}>
          <IconCircle name="file" size={44} color={colors.inkMuted} />
          <Text style={styles.cardHint}>No receipt attached</Text>
        </View>
      )}

      <StatementDivider text="audit trail" />
      {expense.history.map((h, i) => (
        <View key={i} style={styles.auditRow}>
          <IconCircle name={actionIcon[h.action]} size={46} />
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={styles.auditTitle}>{actionLabel[h.action]}</Text>
            <Text style={styles.cardHint}>by {userName(state, h.byUserId)}</Text>
            {h.note ? <Text style={styles.auditNote}>“{h.note}”</Text> : null}
          </View>
          <Text style={styles.auditTime}>{formatDateTime(h.at)}</Text>
        </View>
      ))}
    </Screen>
  );
}

function Detail({ label: l, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{l}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: space.lg, marginTop: space.sm },
  topButton: { minWidth: 140, minHeight: 58 },
  billCard: { backgroundColor: colors.accent, borderRadius: radius.lg, padding: space.xl, gap: space.lg, overflow: 'hidden', boxShadow: '0 12px 26px rgba(74,58,255,0.28)' },
  billDept: { fontFamily: font.bold, fontSize: 22, color: colors.onInk, letterSpacing: -0.4 },
  billCategory: { fontFamily: font.medium, fontSize: 14, color: 'rgba(255,255,255,0.72)' },
  billIcon: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  billDesc: { fontFamily: font.medium, fontSize: 16, color: 'rgba(255,255,255,0.92)', lineHeight: 22 },
  billRef: { fontFamily: font.semibold, fontSize: 15, color: colors.onInk, letterSpacing: 1.5 },
  billDate: { fontFamily: font.medium, fontSize: 13, color: 'rgba(255,255,255,0.72)' },
  cardLabel: { fontFamily: font.medium, fontSize: 15.5, color: colors.ink },
  cardValue: { fontFamily: font.semibold, fontSize: 15.5, color: colors.ink },
  cardHint: { fontFamily: font.regular, fontSize: 14, color: colors.inkMuted },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, gap: space.lg, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  detailLabel: { fontFamily: font.regular, fontSize: 15, color: colors.inkSoft },
  detailValue: { fontFamily: font.semibold, fontSize: 15, color: colors.ink, flexShrink: 1, textAlign: 'right' },
  receipt: { borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.line },
  noReceipt: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  auditRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space.lg, paddingVertical: space.sm },
  auditTitle: { fontFamily: font.medium, fontSize: 16.5, color: colors.ink },
  auditNote: { fontFamily: font.regular, fontSize: 14, color: colors.ink, fontStyle: 'italic', lineHeight: 19 },
  auditTime: { ...label, fontSize: 12, letterSpacing: 0.1, color: colors.inkMuted, marginTop: 4 },
});
