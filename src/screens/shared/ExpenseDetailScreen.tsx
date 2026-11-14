import React, { useState } from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, LongArrow } from '../../components/icons';
import { DashedRule } from '../../components/receipt';
import { Composer } from '../../components/Composer';
import { Text, TextInput } from '../../components/Text';
import { Avatar, Button, IconCircle, Notice, Screen, SectionTitle, sentence, StatementDivider, StatusText } from '../../components/ui';
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
  const { state, currentUser, managerDecide, producerDecide, markPaid, addComment } = useStore();
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

  const comments = expense.comments ?? [];
  const post = () => {
    if (!note.trim()) return;
    addComment(expense.id, note);
    setNote('');
    setFlash(null);
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + space.sm, flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Pressable onPress={nav.pop} hitSlop={14} accessibilityLabel="Go back" accessibilityRole="button">
            <LongArrow color={colors.onInk} width={28} />
          </Pressable>
          <Text style={styles.topTitle}>{deciding ? 'Review a bill' : expense.userId === currentUser.id ? 'My expense' : 'Expense'}</Text>
          <View style={styles.info} accessibilityLabel={`Status: ${head.text}`}>
            <Text style={styles.infoText}>!</Text>
          </View>
        </View>

        {/* The bill as one narrow ticket: perforated edges and side cut-outs, over an off-white panel. */}
        <View style={styles.stub}>
          <Perforation color={BG} edge="top" />
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
          <View style={styles.dashWrap}>
            <DashedRule />
          </View>
        </View>

        <View style={styles.panel}>
          <View style={styles.ticketLower}>
            <View style={styles.rows}>
              <Row label="Date & time" value={formatDateTime(submittedAt)} />
              <Row label="Submitted by" value={userName(state, expense.userId)} />
              <Row label="Department" value={deptName(state, expense.departmentId)} />
              <Row label="Category" value={expense.category} />
              <Row label="Item" value={expense.description} />
              <Row label="Receipt photo" value={expense.receiptUri ? 'Attached' : 'Not attached'} />
              {expense.gstin ? <Row label="Vendor GSTIN" value={expense.gstin} /> : null}
              {(isManagerOfDept || isProducer) && dept ? (
                <Row label="Dept budget" value={`${formatCompact(summary.spent)} of ${formatCompact(summary.budget)} · ${Math.round(((summary.spent + (openStatus ? expense.amount : 0)) / summary.budget) * 100)}%`} />
              ) : null}
            </View>
            <View style={styles.notchRow}>
              <View style={[styles.notch, { left: -12 }]} />
              <View style={styles.dashWrap}>
                <DashedRule />
              </View>
              <View style={[styles.notch, { right: -12 }]} />
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total amount</Text>
              <Text style={styles.total}>
                {whole}
                <Text style={[styles.total, { color: '#C4C4C4' }]}>.{paise}</Text>
              </Text>
            </View>
            <Perforation color={PANEL} edge="bottom" />
          </View>

          <View style={styles.below}>
            {flash ? <Notice text={flash} /> : null}

            {comments.length ? (
              <View style={{ gap: space.sm }}>
                {comments.map((c, i) => (
                  <View key={i} style={styles.comment}>
                    <Avatar name={userName(state, c.byUserId)} size={28} />
                    <View style={{ flex: 1, gap: 1 }}>
                      <Text style={styles.commentMeta}>
                        {userName(state, c.byUserId).split(' ')[0]} · {formatDateTime(c.at)}
                      </Text>
                      <Text style={styles.commentText}>{c.text}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : null}

            <Composer value={note} onChange={setNote} onSend={post} placeholder={deciding ? 'Add a comment about this bill' : 'Add a comment'} label="Comment on this bill" />

            {deciding ? (
              <View style={{ gap: space.lg }}>
                {canManagerAct ? (
                  <Pressable onPress={escalate} style={styles.linkHit} accessibilityRole="button">
                    <Text style={styles.link}>Send to producer</Text>
                  </Pressable>
                ) : null}
                <View style={{ flexDirection: 'row', gap: space.md }}>
                  <Button label="Reject" icon="close" variant="outline" onPress={reject} style={{ flex: 1, backgroundColor: colors.surface, borderColor: colors.surface }} />
                  <Button label={`Approve ${formatINR(expense.amount)}`} onPress={approve} style={{ flex: 1.3 }} />
                </View>
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
              <Pressable onPress={() => nav.push({ name: 'department', id: dept.id })} style={styles.linkHit} accessibilityRole="link">
                <Text style={styles.link}>Open {dept.name} budget</Text>
              </Pressable>
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
            <View style={{ height: insets.bottom + space.lg }} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// Perforated ticket edge: a row of small round bites in the colour behind the ticket.
function Perforation({ color, edge }: { color: string; edge: 'top' | 'bottom' }) {
  return (
    <View style={[styles.perf, edge === 'top' ? { alignItems: 'flex-start' } : { alignItems: 'flex-end' }]}>
      {Array.from({ length: 24 }, (_, i) => (
        <View key={i} style={[styles.bite, { backgroundColor: color }, edge === 'top' ? { marginTop: -6 } : { marginBottom: -6 }]} />
      ))}
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

const BG = '#0D0D0F';
const PANEL = '#F4F2EE';

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: space.xl, minHeight: 44 },
  topTitle: { flex: 1, fontFamily: font.display, fontSize: 19, color: colors.onInk, letterSpacing: -0.4 },
  info: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.onInk, alignItems: 'center', justifyContent: 'center' },
  infoText: { fontFamily: font.display, fontSize: 16, color: BG },
  stub: { zIndex: 2, marginHorizontal: 34, marginTop: space.xl, backgroundColor: '#FFFFFF' },
  stubBody: { paddingHorizontal: 22, paddingTop: 18, paddingBottom: 24, alignItems: 'center', gap: 8 },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  headIcon: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  headText: { fontFamily: font.bold, fontSize: 15, color: colors.ink },
  vendor: { marginTop: 14, fontFamily: font.display, fontSize: 20, lineHeight: 25, color: colors.ink, letterSpacing: -0.3, textAlign: 'center' },
  refText: { fontFamily: font.regular, fontSize: 12.5, color: colors.inkMuted },
  dashWrap: { flex: 1, paddingHorizontal: 18 },
  panel: { flexGrow: 1, zIndex: 1, marginHorizontal: 14, marginTop: -30, paddingTop: 30, backgroundColor: PANEL, borderTopLeftRadius: 26, borderTopRightRadius: 26 },
  ticketLower: { marginHorizontal: 20, backgroundColor: '#FFFFFF', boxShadow: '0 10px 18px rgba(0,0,0,0.10)' },
  rows: { paddingHorizontal: 22, paddingTop: 20, paddingBottom: 14, gap: 15 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  rowLabel: { fontFamily: font.regular, fontSize: 13, color: colors.inkMuted },
  rowValue: { flexShrink: 1, textAlign: 'right', fontFamily: font.bold, fontSize: 13, color: colors.ink },
  notchRow: { height: 24, flexDirection: 'row', alignItems: 'center' },
  notch: { position: 'absolute', top: 0, width: 24, height: 24, borderRadius: 12, backgroundColor: PANEL },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 22, paddingTop: 10, paddingBottom: 20 },
  totalLabel: { fontFamily: font.bold, fontSize: 14, color: colors.ink },
  total: { fontFamily: font.display, fontSize: 26, color: colors.ink, letterSpacing: -1 },
  perf: { height: 10, flexDirection: 'row', justifyContent: 'space-between', overflow: 'hidden', paddingHorizontal: 3, backgroundColor: '#FFFFFF' },
  bite: { width: 12, height: 12, borderRadius: 6 },
  below: { paddingHorizontal: 16, paddingTop: space.xl, gap: space.md },
  comment: { flexDirection: 'row', gap: 10, padding: 12, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: '#E6E3DD' },
  commentMeta: { fontFamily: font.regular, fontSize: 12, color: colors.inkMuted },
  commentText: { fontFamily: font.regular, fontSize: 14, lineHeight: 19, color: colors.ink },
  commentBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingLeft: 14, paddingRight: 8, paddingVertical: 10, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: '#E6E3DD' },
  commentInput: { flex: 1, minHeight: 40, fontFamily: font.regular, fontSize: 14, lineHeight: 19, color: colors.ink, paddingVertical: 2, textAlignVertical: 'top' },
  linkHit: { alignSelf: 'center', minHeight: 44, paddingHorizontal: 16, justifyContent: 'center' },
  send: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  link: { fontFamily: font.bold, fontSize: 14, color: colors.ink, textDecorationLine: 'underline' },
  cardHint: { fontFamily: font.regular, fontSize: 14, color: colors.inkMuted },
  receipt: { borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.line },
  auditRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space.lg, paddingVertical: space.sm },
  auditTitle: { fontFamily: font.medium, fontSize: 15.5, color: colors.ink },
  auditNote: { fontFamily: font.regular, fontSize: 14, color: colors.ink, fontStyle: 'italic', lineHeight: 19 },
  auditTime: { ...label, fontSize: 12, letterSpacing: 0.1, color: colors.inkMuted, marginTop: 4 },
});
