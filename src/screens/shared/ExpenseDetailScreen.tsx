import React, { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { categoryIcon } from '../../components/rows';
import { Button, Card, Divider, Field, Icon, Screen, SectionTitle, StatusBadge } from '../../components/ui';
import { useNav } from '../../navigation/Nav';
import { deptName, departmentSummary, userName } from '../../store/selectors';
import { useStore } from '../../store/Store';
import { colors, space, statusMeta } from '../../theme';
import { AuditAction } from '../../types';
import { formatCompact, formatDate, formatDateTime, formatINR } from '../../utils/format';

const actionLabel: Record<AuditAction, string> = {
  submitted: 'Submitted',
  approved: 'Approved',
  escalated: 'Escalated to producer',
  rejected: 'Rejected',
  paid: 'Marked as paid',
};

const actionColor: Record<AuditAction, string> = {
  submitted: colors.warning,
  approved: colors.info,
  escalated: colors.purple,
  rejected: colors.danger,
  paid: colors.success,
};

export function ExpenseDetailScreen({ id }: { id: string }) {
  const { state, currentUser, managerDecide, producerDecide, markPaid } = useStore();
  const nav = useNav();
  const [note, setNote] = useState('');
  const [flash, setFlash] = useState<string | null>(null);
  const expense = state.expenses.find((e) => e.id === id);

  if (!expense || !currentUser) {
    return (
      <Screen title="Expense" onBack={nav.pop}>
        <Text>Expense not found.</Text>
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
  const needsNote = canManagerAct || canProducerAct;

  const doManager = (d: 'approve' | 'reject' | 'escalate') => {
    if (d === 'reject' && !note.trim()) {
      setFlash('Add a short reason so the crew member knows why it was rejected.');
      return;
    }
    const result = managerDecide(expense.id, d, note);
    setNote('');
    if (result === 'escalated' && d === 'approve') {
      setFlash('Approved by you and sent to the producer for final sign-off (over threshold or budget).');
    } else if (result) {
      setFlash(`Expense ${statusMeta[result].label.toLowerCase()}.`);
    }
  };

  const doProducer = (d: 'approve' | 'reject') => {
    if (d === 'reject' && !note.trim()) {
      setFlash('Add a short reason before rejecting.');
      return;
    }
    producerDecide(expense.id, d, note);
    setNote('');
    setFlash(d === 'approve' ? 'Approved. It’s now ready for payment.' : 'Rejected.');
  };

  const footer =
    canManagerAct ? (
      <View style={{ gap: space.sm }}>
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <Button label="Reject" variant="danger" icon="close" onPress={() => doManager('reject')} style={{ flex: 1 }} />
          <Button label="Approve" variant="success" icon="checkmark" onPress={() => doManager('approve')} style={{ flex: 2 }} />
        </View>
        <Button label="Escalate to producer" variant="ghost" icon="arrow-up-circle-outline" small onPress={() => doManager('escalate')} />
      </View>
    ) : canProducerAct ? (
      <View style={{ flexDirection: 'row', gap: space.sm }}>
        <Button label="Reject" variant="danger" icon="close" onPress={() => doProducer('reject')} style={{ flex: 1 }} />
        <Button label="Approve" variant="success" icon="checkmark" onPress={() => doProducer('approve')} style={{ flex: 2 }} />
      </View>
    ) : canPay ? (
      <Button
        label={`Mark ${formatINR(expense.amount)} as paid`}
        icon="cash-outline"
        onPress={() => {
          markPaid([expense.id], 'Paid via bank transfer');
          setFlash('Marked as paid. The crew member will see it in their history.');
        }}
      />
    ) : undefined;

  return (
    <Screen title={formatINR(expense.amount)} subtitle={expense.category} onBack={nav.pop} footer={footer}>
      {flash ? (
        <View style={styles.flash}>
          <Icon name="information-circle-outline" size={18} color={colors.info} />
          <Text style={styles.flashText}>{flash}</Text>
        </View>
      ) : null}

      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: space.md }}>
          <View style={styles.bigIcon}>
            <Icon name={categoryIcon[expense.category] ?? 'receipt-outline'} size={24} />
          </View>
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={styles.desc}>{expense.description}</Text>
            <StatusBadge status={expense.status} />
          </View>
        </View>
        <Divider />
        <Detail label="Submitted by" value={userName(state, expense.userId)} />
        <Detail label="Department" value={deptName(state, expense.departmentId)} />
        <Detail label="Expense date" value={formatDate(expense.date)} />
        {expense.vendor ? <Detail label="Vendor" value={expense.vendor} /> : null}
        {expense.gstin ? <Detail label="Vendor GSTIN" value={expense.gstin} /> : null}
        <Detail label="Reference" value={expense.id.toUpperCase()} />
      </Card>

      {expense.receiptUri ? (
        <>
          <SectionTitle title="Receipt" />
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <Image source={{ uri: expense.receiptUri }} style={{ width: '100%', height: 320 }} resizeMode="cover" />
          </Card>
        </>
      ) : (
        <View style={styles.noReceipt}>
          <Icon name="document-outline" size={16} color={colors.inkMuted} />
          <Text style={{ color: colors.inkSoft, fontSize: 13 }}>No receipt attached</Text>
        </View>
      )}

      {(isManagerOfDept || isProducer) && dept ? (
        <>
          <SectionTitle title="Department budget" />
          <Card onPress={() => nav.push({ name: 'department', id: dept.id })}>
            <Text style={{ color: colors.inkSoft, fontSize: 13 }}>
              {dept.name}: {formatCompact(summary.spent)} spent of {formatCompact(summary.budget)} · {formatCompact(summary.remaining)} left
            </Text>
            {expense.status === 'submitted' || expense.status === 'escalated' ? (
              <Text style={{ marginTop: 6, fontSize: 13, color: summary.spent + expense.amount > summary.budget ? colors.danger : colors.inkSoft }}>
                After this expense: {Math.round(((summary.spent + expense.amount) / summary.budget) * 100)}% used
              </Text>
            ) : null}
          </Card>
        </>
      ) : null}

      {needsNote ? (
        <Field label="Note (required to reject)" placeholder="e.g. Please attach the GST bill" value={note} onChangeText={setNote} multiline />
      ) : null}

      <SectionTitle title="Audit trail" />
      <Card>
        {expense.history.map((h, i) => (
          <View key={i} style={styles.timelineRow}>
            <View style={{ alignItems: 'center' }}>
              <View style={[styles.dot, { backgroundColor: actionColor[h.action] }]} />
              {i < expense.history.length - 1 ? <View style={styles.line} /> : null}
            </View>
            <View style={{ flex: 1, paddingBottom: i < expense.history.length - 1 ? space.lg : 0 }}>
              <Text style={styles.timelineTitle}>{actionLabel[h.action]}</Text>
              <Text style={styles.timelineMeta}>
                {userName(state, h.byUserId)} · {formatDateTime(h.at)}
              </Text>
              {h.note ? <Text style={styles.timelineNote}>“{h.note}”</Text> : null}
            </View>
          </View>
        ))}
      </Card>
    </Screen>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bigIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' },
  desc: { fontSize: 17, fontWeight: '600', color: colors.ink, lineHeight: 23 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, gap: space.lg },
  detailLabel: { color: colors.inkSoft, fontSize: 14 },
  detailValue: { color: colors.ink, fontSize: 14, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  noReceipt: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 4 },
  timelineRow: { flexDirection: 'row', gap: space.md },
  dot: { width: 12, height: 12, borderRadius: 6, marginTop: 4 },
  line: { width: 2, flex: 1, backgroundColor: colors.line, marginTop: 4 },
  timelineTitle: { fontSize: 14, fontWeight: '600', color: colors.ink },
  timelineMeta: { fontSize: 12.5, color: colors.inkSoft, marginTop: 2 },
  timelineNote: { fontSize: 13, color: colors.ink, marginTop: 4, fontStyle: 'italic' },
  flash: { flexDirection: 'row', gap: space.sm, backgroundColor: colors.infoSoft, padding: space.md, borderRadius: 12, alignItems: 'flex-start' },
  flashText: { flex: 1, color: colors.info, fontSize: 14, lineHeight: 19 },
});
