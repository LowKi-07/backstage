import React, { useState } from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../../components/icons';
import { categoryIcon } from '../../components/rows';
import { DashedRule, Receipt } from '../../components/receipt';
import { Text, TextInput } from '../../components/Text';
import { Button } from '../../components/ui';
import { useNav } from '../../navigation/Nav';
import { useStore } from '../../store/Store';
import { colors, font, radius, space } from '../../theme';
import { CATEGORIES, ExpenseDraft } from '../../types';
import { toISODate } from '../../utils/format';
import { pickImage } from '../../utils/pickImage';

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
  const [receiptUri, setReceiptUri] = useState<string | undefined>(draft.receiptUri);
  const [listOpen, setListOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!currentUser) return null;
  const dept = myDepts[deptIndex];

  const addReceipt = async () => {
    setError(null);
    try {
      const uri = await pickImage('camera');
      if (uri) setReceiptUri(uri);
    } catch (e) {
      setError((e as Error).message);
    }
  };

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
      receiptUri,
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
                {draft.transcript || draft.receiptUri ? 'Does this look right?' : 'New expense'}
              </Text>
              <Text style={styles.sub}>Nothing is submitted until you confirm.</Text>
            </View>
            <Pressable onPress={nav.pop} style={styles.close} accessibilityLabel="Close" accessibilityRole="button">
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
            <View style={[styles.pill, { paddingLeft: 14, paddingVertical: 8 }]}>
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
          <Row label="Category">
            <Pressable onPress={() => setListOpen(true)} style={styles.pill} accessibilityRole="button" accessibilityLabel={`Category: ${category ?? 'none'}. Change`}>
              <View style={styles.catBadge}>
                <Icon name={category ? categoryIcon[category] ?? 'receipt' : 'plus'} size={15} color={colors.onInk} strokeWidth={1.8} />
              </View>
              <Text style={styles.chipText}>{category ? SHORT[category] ?? category : 'Choose'}</Text>
              <Icon name="chevron-down" size={14} strokeWidth={2} />
            </Pressable>
          </Row>
          <Text style={styles.hint}>{!draft.category ? ' ' : category === draft.category ? 'Suggested from what you said' : 'Changed by you'}</Text>
          {receiptUri ? (
            <Row label="Receipt">
              <View style={styles.pill}>
                <Image source={{ uri: receiptUri }} style={styles.thumb} />
                <Text style={styles.chipText}>Attached</Text>
                <Pressable onPress={() => setReceiptUri(undefined)} hitSlop={8} accessibilityLabel="Remove receipt" accessibilityRole="button">
                  <Icon name="close" size={14} strokeWidth={2} />
                </Pressable>
              </View>
            </Row>
          ) : null}
        </Receipt>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>

      {listOpen ? (
        <View style={[styles.list, { paddingTop: insets.top + space.sm }]} accessibilityViewIsModal>
          <View style={styles.listHead}>
            <Pressable onPress={() => setListOpen(false)} style={styles.back} accessibilityLabel="Back" accessibilityRole="button">
              <Icon name="chevron-right" size={18} strokeWidth={2} />
            </Pressable>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.listTitle} accessibilityRole="header">
                Choose category
              </Text>
              {draft.category ? <Text style={styles.sub}>Suggested: {SHORT[draft.category] ?? draft.category}, from what you said</Text> : null}
            </View>
          </View>
          <ScrollView contentContainerStyle={{ paddingHorizontal: space.md, paddingBottom: insets.bottom + space.lg }} showsVerticalScrollIndicator={false}>
            {CATEGORIES.map((c) => {
              const on = c === category;
              return (
                <Pressable
                  key={c}
                  onPress={() => {
                    setCategory(c);
                    setListOpen(false);
                  }}
                  style={({ pressed }) => [styles.listRow, (on || pressed) && { backgroundColor: '#F2F2F2' }]}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
                >
                  <View style={[styles.listIcon, on && { backgroundColor: colors.ink }]}>
                    <Icon name={categoryIcon[c] ?? 'receipt'} size={20} color={on ? colors.onInk : colors.ink} />
                  </View>
                  <Text style={[styles.listText, on && { fontFamily: font.bold }]}>{c}</Text>
                  {on ? <Icon name="check" size={20} strokeWidth={2.2} /> : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      {listOpen ? null : (
        <View style={[styles.footer, { paddingBottom: insets.bottom + space.md }]}>
          {receiptUri ? null : <Button label="Add receipt" icon="camera" variant="outline" onPress={addReceipt} />}
          <Button label="Confirm & submit" onPress={confirm} />
        </View>
      )}
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
  title: { fontFamily: font.display, fontSize: 21, color: colors.ink, letterSpacing: -0.6 },
  sub: { fontFamily: font.regular, fontSize: 13.5, color: colors.inkSoft },
  close: { width: 38, height: 38, borderRadius: 19, backgroundColor: CHIP, alignItems: 'center', justifyContent: 'center' },
  quote: { fontFamily: font.regular, fontStyle: 'italic', fontSize: 13.5, lineHeight: 19, color: colors.inkSoft },
  description: { fontFamily: font.bold, fontSize: 16, color: colors.ink, paddingVertical: 2 },
  amountRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  currency: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.pill, backgroundColor: CHIP },
  amount: { flexGrow: 1, flexShrink: 1, width: 0, minWidth: 0, textAlign: 'right', fontFamily: font.display, fontSize: 36, color: colors.ink, letterSpacing: -1.5, paddingVertical: 0 },
  rowLabel: { fontFamily: font.regular, fontSize: 13.5, color: colors.inkSoft },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 6, paddingRight: 12, paddingVertical: 5, borderRadius: radius.pill, backgroundColor: CHIP },
  chipText: { fontFamily: font.semibold, fontSize: 13.5, color: colors.ink },
  vendor: { flex: 1, maxWidth: 200, textAlign: 'right', fontFamily: font.semibold, fontSize: 13.5, color: colors.ink, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: CHIP },
  hint: { fontFamily: font.semibold, fontSize: 12, color: colors.accentInk, alignSelf: 'flex-end', marginTop: -4 },
  catBadge: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  thumb: { width: 26, height: 26, borderRadius: 8 },
  list: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: colors.surface, gap: space.md },
  listHead: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: space.lg },
  back: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#F2F2F2', alignItems: 'center', justifyContent: 'center', transform: [{ scaleX: -1 }] },
  listTitle: { fontFamily: font.display, fontSize: 19, color: colors.ink, letterSpacing: -0.4 },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 8, paddingVertical: 9, borderRadius: 16 },
  listIcon: { width: 44, height: 44, borderRadius: 15, backgroundColor: colors.surface, boxShadow: '0 4px 14px rgba(0,0,0,0.08)', alignItems: 'center', justifyContent: 'center' },
  listText: { flex: 1, fontFamily: font.medium, fontSize: 14.5, color: colors.ink },
  error: { fontFamily: font.medium, fontSize: 14, color: colors.negative, paddingHorizontal: 4 },
  footer: { paddingHorizontal: space.lg, paddingTop: space.md, gap: 10, backgroundColor: '#EFEFEC' },
});
