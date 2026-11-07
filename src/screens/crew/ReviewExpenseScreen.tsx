import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../../components/icons';
import { DashedRule, Receipt } from '../../components/receipt';
import { Text, TextInput } from '../../components/Text';
import { Avatar, Button } from '../../components/ui';
import { useNav } from '../../navigation/Nav';
import { useStore } from '../../store/Store';
import { colors, font, radius, space } from '../../theme';
import { CATEGORIES, ExpenseDraft } from '../../types';
import { toISODate } from '../../utils/format';

const PAPER = '#F8F7F3';
const CHIP = '#ECEAE4';

// Short names for the category chips; the stored category keeps its full name.
const SHORT: Record<string, string> = {
  'Food & Catering': 'Food',
  Accommodation: 'Stay',
  'Equipment Rental': 'Equipment',
  'Props & Materials': 'Props',
  'Costume & Fabric': 'Costume',
  'Makeup Supplies': 'Makeup',
  'Location Fees': 'Location',
  'Labour / Daily Wages': 'Daily wages',
  'Printing & Stationery': 'Printing',
  Miscellaneous: 'Other',
};

// "Does this look right?" — check what voice entry picked up, fix anything, choose the category, submit.
export function ReviewExpenseScreen({ draft }: { draft: ExpenseDraft }) {
  const { state, currentUser, submitExpense } = useStore();
  const nav = useNav();
  const insets = useSafeAreaInsets();
  const myDepts = state.departments.filter((d) => currentUser?.departmentIds.includes(d.id));
  const [description, setDescription] = useState(draft.description);
  const [amount, setAmount] = useState(draft.amount ? String(draft.amount) : '');
  const [vendor, setVendor] = useState(draft.vendor ?? '');
  const [category, setCategory] = useState<string | undefined>(draft.category);
  const [deptIndex, setDeptIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  if (!currentUser) return null;
  const dept = myDepts[deptIndex];

  const current = (): ExpenseDraft => ({ transcript: draft.transcript, description: description.trim(), amount: Number(amount) || undefined, category, vendor: vendor.trim() || undefined });

  const confirm = () => {
    const value = Number(amount);
    if (!value || value <= 0) return setError('Add the amount you spent.');
    if (description.trim().length < 3) return setError('Add a short description.');
    if (!category) return setError('Pick a category.');
    if (!dept) return setError('You aren’t in a department yet. Ask your manager to add you.');
    const exp = submitExpense({
      amount: Math.round(value * 100) / 100,
      category,
      departmentId: dept.id,
      description: description.trim(),
      vendor: vendor.trim() || undefined,
      date: toISODate(new Date()),
    });
    nav.popToTab('home');
    nav.push({ name: 'submitted', id: exp.id });
  };

  const noOutline = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null;

  return (
    <View style={[styles.root, { paddingTop: insets.top + space.sm }]}>
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.md }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Receipt torn="bottom" color={PAPER}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.title} accessibilityRole="header">
                Does this look right?
              </Text>
              <Text style={styles.sub}>Nothing is submitted until you confirm.</Text>
            </View>
            <Pressable onPress={nav.pop} style={styles.close} accessibilityLabel="Back to voice entry" accessibilityRole="button">
              <Icon name="close" size={17} strokeWidth={2} />
            </Pressable>
          </View>
          {draft.transcript ? <Text style={styles.quote}>“{draft.transcript}”</Text> : null}

          <DashedRule />
          <TextInput value={description} onChangeText={setDescription} placeholder="What was it for?" style={[styles.description, noOutline]} accessibilityLabel="Description" />
          <View style={styles.amountRow}>
            <View style={styles.currency}>
              <Text style={styles.chipText}>INR ₹</Text>
            </View>
            <TextInput
              value={amount}
              onChangeText={(t) => setAmount(t.replace(/[^0-9.]/g, ''))}
              keyboardType="decimal-pad"
              placeholder="0"
              style={[styles.amount, noOutline]}
              accessibilityLabel="Amount in rupees"
            />
          </View>

          <DashedRule />
          <Row label="Paid by">
            <View style={styles.pill}>
              <Avatar name={currentUser.name} size={24} />
              <Text style={styles.chipText}>You</Text>
            </View>
          </Row>
          <Row label="Department">
            <Pressable
              onPress={() => setDeptIndex((i) => (myDepts.length ? (i + 1) % myDepts.length : 0))}
              disabled={myDepts.length < 2}
              style={styles.pill}
              accessibilityRole="button"
              accessibilityLabel={`Department ${dept?.name ?? 'none'}${myDepts.length > 1 ? ', tap to change' : ''}`}
            >
              <Text style={styles.chipText}>{dept?.name ?? 'None'}</Text>
              {myDepts.length > 1 ? <Icon name="chevron-down" size={14} strokeWidth={2} /> : null}
            </Pressable>
          </Row>
          <Row label="Vendor">
            <TextInput value={vendor} onChangeText={setVendor} placeholder="Add vendor" style={[styles.vendor, noOutline]} accessibilityLabel="Vendor" />
          </Row>

          <DashedRule />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Text style={styles.rowLabel}>Category</Text>
            <Text style={styles.hint}>{category && category === draft.category ? 'Suggested from what you said' : category ? 'Changed by you' : 'Pick one'}</Text>
          </View>
          <View style={styles.chips} accessibilityRole="radiogroup">
            {CATEGORIES.map((c) => {
              const on = c === category;
              return (
                <Pressable key={c} onPress={() => setCategory(c)} style={[styles.catChip, on && styles.catChipOn]} accessibilityRole="radio" accessibilityState={{ checked: on }}>
                  <Text style={[styles.catChipText, on && { color: colors.onInk }]}>{SHORT[c] ?? c}</Text>
                </Pressable>
              );
            })}
          </View>
        </Receipt>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + space.md }]}>
        <Button label="Add receipt" icon="camera" variant="outline" onPress={() => nav.push({ name: 'newExpense', draft: current() })} />
        <Button label="Confirm & submit" onPress={confirm} />
      </View>
    </View>
  );
}

function Row({ label: text, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <Text style={styles.rowLabel}>{text}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#EFEFEC' },
  title: { fontFamily: font.display, fontSize: 24, color: colors.ink, letterSpacing: -0.6 },
  sub: { fontFamily: font.regular, fontSize: 13.5, color: colors.inkSoft },
  close: { width: 38, height: 38, borderRadius: 19, backgroundColor: CHIP, alignItems: 'center', justifyContent: 'center' },
  quote: { fontFamily: font.regular, fontStyle: 'italic', fontSize: 13.5, lineHeight: 19, color: colors.inkSoft },
  description: { fontFamily: font.bold, fontSize: 17, color: colors.ink, paddingVertical: 2 },
  amountRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  currency: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.pill, backgroundColor: CHIP },
  amount: { flexGrow: 1, flexShrink: 1, width: 0, minWidth: 0, textAlign: 'right', fontFamily: font.display, fontSize: 44, color: colors.ink, letterSpacing: -1.5, paddingVertical: 0 },
  rowLabel: { fontFamily: font.regular, fontSize: 14.5, color: colors.inkSoft },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 6, paddingRight: 12, paddingVertical: 5, borderRadius: radius.pill, backgroundColor: CHIP },
  chipText: { fontFamily: font.semibold, fontSize: 14.5, color: colors.ink },
  vendor: { flex: 1, maxWidth: 200, textAlign: 'right', fontFamily: font.semibold, fontSize: 14.5, color: colors.ink, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: CHIP },
  hint: { fontFamily: font.semibold, fontSize: 12, color: colors.accentInk },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  catChip: { paddingHorizontal: 13, paddingVertical: 7, borderRadius: radius.pill, borderWidth: 1, borderColor: '#E2DFD8', backgroundColor: colors.surface },
  catChipOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  catChipText: { fontFamily: font.semibold, fontSize: 13, color: colors.inkSoft },
  error: { fontFamily: font.medium, fontSize: 14, color: colors.negative, paddingHorizontal: 4 },
  footer: { paddingHorizontal: space.lg, paddingTop: space.md, gap: 10, backgroundColor: '#EFEFEC' },
});
