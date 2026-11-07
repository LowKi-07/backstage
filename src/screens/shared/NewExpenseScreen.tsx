import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { Image, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Icon } from '../../components/icons';
import { categoryIcon } from '../../components/rows';
import { Text, TextInput } from '../../components/Text';
import { Button, Chip, ChipRow, Field, Hero, Screen, SectionTitle } from '../../components/ui';
import { useNav } from '../../navigation/Nav';
import { useStore } from '../../store/Store';
import { colors, font, radius, shadow, space } from '../../theme';
import { CATEGORIES, Expense, ExpenseDraft } from '../../types';
import { isValidGSTIN, toISODate } from '../../utils/format';

const DAY = 86400000;

// Short tile captions; the stored category keeps its full name.
const tileLabel: Record<string, string> = {
  'Food & Catering': 'food',
  Accommodation: 'stay',
  'Equipment Rental': 'equipment',
  'Props & Materials': 'props',
  'Costume & Fabric': 'costume',
  'Makeup Supplies': 'makeup',
  'Location Fees': 'location',
  'Labour / Daily Wages': 'daily wages',
  'Printing & Stationery': 'printing',
  Miscellaneous: 'other',
};
const dateOptions = [0, 1, 2, 3].map((n) => {
  const d = new Date(Date.now() - n * DAY);
  return { label: n === 0 ? 'Today' : n === 1 ? 'Yesterday' : `${n} days ago`, value: toISODate(d) };
});

// Typed entry. Voice entry hands over a `draft` so the form opens already filled in.
export function NewExpenseScreen({ draft }: { draft?: ExpenseDraft }) {
  const { state, currentUser, submitExpense } = useStore();
  const nav = useNav();
  const myDepts = state.departments.filter((d) => currentUser?.departmentIds.includes(d.id));

  const [amount, setAmount] = useState(draft?.amount ? String(draft.amount) : '');
  const [category, setCategory] = useState<string | null>(draft?.category ?? null);
  const [departmentId, setDepartmentId] = useState<string | null>(myDepts.length === 1 ? myDepts[0].id : null);
  const [description, setDescription] = useState(draft?.description ?? '');
  const [vendor, setVendor] = useState(draft?.vendor ?? '');
  const [gstin, setGstin] = useState('');
  const [date, setDate] = useState(dateOptions[0].value);
  const [receiptUri, setReceiptUri] = useState<string | undefined>();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState<Expense | null>(null);
  const [pickerError, setPickerError] = useState<string | null>(null);

  const pick = async (source: 'camera' | 'library') => {
    setPickerError(null);
    try {
      if (source === 'camera' && Platform.OS !== 'web') {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          setPickerError('Camera permission is needed to photograph receipts.');
          return;
        }
      }
      const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.5 };
      const res = source === 'camera' && Platform.OS !== 'web' ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
      if (!res.canceled && res.assets[0]) setReceiptUri(res.assets[0].uri);
    } catch {
      setPickerError('Couldn’t open the camera or gallery on this device.');
    }
  };

  const submit = () => {
    const e: Record<string, string> = {};
    const value = Number(amount.replace(/,/g, ''));
    if (!amount || isNaN(value) || value <= 0) e.amount = 'Enter the amount spent';
    if (!category) e.category = 'Pick a category';
    if (!departmentId) e.department = 'Pick a department';
    if (description.trim().length < 3) e.description = 'Add a short description';
    if (gstin.trim() && !isValidGSTIN(gstin)) e.gstin = 'This doesn’t look like a valid 15-character GSTIN';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) e.date = 'Use YYYY-MM-DD';
    setErrors(e);
    if (Object.keys(e).length) return;
    const exp = submitExpense({
      amount: Math.round(value * 100) / 100,
      category: category!,
      departmentId: departmentId!,
      description: description.trim(),
      vendor: vendor.trim() || undefined,
      gstin: gstin.trim().toUpperCase() || undefined,
      date,
      receiptUri,
    });
    setSubmitted(exp);
  };

  const reset = () => {
    setAmount('');
    setCategory(null);
    setDescription('');
    setVendor('');
    setGstin('');
    setReceiptUri(undefined);
    setDate(dateOptions[0].value);
    setErrors({});
    setSubmitted(null);
  };

  if (submitted) return <SubmittedView expense={submitted} onAnother={reset} />;

  return (
    <Screen title="add expense" subtitle={state.project.name.toLowerCase()} onBack={nav.pop} footer={<Button label="Submit for approval" icon="send" onPress={submit} />}>
      <View style={styles.amountBox}>
        <Text style={styles.amountLabel}>amount spent</Text>
        <View style={styles.amountRow}>
          <Text style={styles.rupee}>₹</Text>
          <TextInput
            value={amount}
            onChangeText={(t) => setAmount(t.replace(/[^0-9.]/g, ''))}
            keyboardType="decimal-pad"
            placeholder="0"
            style={[styles.amountInput, { width: Math.max(1, amount.length) * 30 + 24 }, Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null]}
            autoFocus={Platform.OS !== 'web'}
            accessibilityLabel="Amount spent"
          />
        </View>
        {errors.amount ? <Text style={styles.err}>{errors.amount}</Text> : null}
      </View>

      <SectionTitle title="receipt" />
      {receiptUri ? (
        <View style={styles.receipt}>
          <Image source={{ uri: receiptUri }} style={{ width: '100%', height: 220 }} resizeMode="cover" />
          <Pressable onPress={() => setReceiptUri(undefined)} style={styles.removeReceipt}>
            <Icon name="trash" size={17} color={colors.negative} />
            <Text style={{ fontFamily: font.semibold, color: colors.negative }}>remove receipt</Text>
          </Pressable>
        </View>
      ) : (
        <View style={{ flexDirection: 'row', gap: space.md }}>
          <Button label="Camera" icon="camera" variant="outline" onPress={() => pick('camera')} style={{ flex: 1 }} />
          <Button label="Upload" icon="image" variant="outline" onPress={() => pick('library')} style={{ flex: 1 }} />
        </View>
      )}
      {pickerError ? <Text style={styles.err}>{pickerError}</Text> : null}

      <SectionTitle title="category" />
      <View style={styles.grid}>
        {CATEGORIES.map((c) => {
          const active = category === c;
          return (
            <Pressable key={c} onPress={() => setCategory(c)} style={styles.catTile} accessibilityRole="radio" accessibilityState={{ selected: active }}>
              <View style={[styles.catCircle, active && styles.catCircleActive]}>
                <Icon name={categoryIcon[c]} size={26} color={active ? colors.onInk : colors.ink} strokeWidth={1.4} />
              </View>
              <Text style={[styles.catText, active && { fontFamily: font.bold }]} numberOfLines={2}>
                {tileLabel[c] ?? c.toLowerCase()}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {errors.category ? <Text style={styles.err}>{errors.category}</Text> : null}

      {myDepts.length > 1 ? (
        <>
          <SectionTitle title="department" />
          <ChipRow>
            {myDepts.map((d) => (
              <Chip key={d.id} label={d.name} active={departmentId === d.id} onPress={() => setDepartmentId(d.id)} />
            ))}
          </ChipRow>
          {errors.department ? <Text style={styles.err}>{errors.department}</Text> : null}
        </>
      ) : null}

      <SectionTitle title="details" />
      <Field label="What was it for?" placeholder="e.g. Diesel for generator van" value={description} onChangeText={setDescription} error={errors.description} multiline />
      <Field label="Vendor or shop (optional)" placeholder="e.g. IndianOil Aluva" value={vendor} onChangeText={setVendor} />
      <Field
        label="Vendor GSTIN (optional)"
        placeholder="e.g. 32ABCDE1234F1Z5"
        value={gstin}
        onChangeText={(t) => setGstin(t.toUpperCase())}
        autoCapitalize="characters"
        maxLength={15}
        error={errors.gstin}
        hint="Needed for GST input credit on bills above ₹5,000"
      />

      <SectionTitle title="date" />
      <ChipRow>
        {dateOptions.map((o) => (
          <Chip key={o.value} label={o.label} active={date === o.value} onPress={() => setDate(o.value)} />
        ))}
      </ChipRow>
      <Field label="Or enter a date" value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" error={errors.date} />
    </Screen>
  );
}

export function SubmittedScreen({ id }: { id: string }) {
  const { state } = useStore();
  const nav = useNav();
  const expense = state.expenses.find((e) => e.id === id);
  if (!expense) return null;
  return (
    <SubmittedView
      expense={expense}
      onAnother={() => {
        nav.pop();
        nav.push({ name: 'newExpense' });
      }}
    />
  );
}

function SubmittedView({ expense, onAnother }: { expense: Expense; onAnother: () => void }) {
  const nav = useNav();
  const toProducer = expense.status === 'escalated';
  return (
    <Screen onBack={nav.pop}>
      <View style={styles.success}>
        <View style={styles.successIcon}>
          <Icon name="check" size={38} color={colors.onInk} strokeWidth={2} />
        </View>
        <Hero eyebrow={toProducer ? 'sent to the producer' : 'sent to your manager'} lines={['submitted']} amount={expense.amount} />
        <Text style={styles.successText}>You’ll see every update in your expenses, and the payout once it’s approved.</Text>
      </View>
      <Button label="Log another expense" icon="plus" onPress={onAnother} />
      <Button
        label="View expense"
        variant="outline"
        onPress={() => {
          nav.pop();
          nav.push({ name: 'expense', id: expense.id });
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  amountBox: { alignItems: 'center', gap: 6, paddingVertical: space.lg, borderRadius: radius.lg, backgroundColor: colors.surfaceAlt },
  amountLabel: { fontFamily: font.semibold, fontSize: 12, letterSpacing: 0.1, color: colors.inkSoft },
  amountRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingHorizontal: space.lg },
  rupee: { fontFamily: font.display, fontSize: 46, color: colors.ink },
  amountInput: { fontFamily: font.display, fontSize: 52, color: colors.ink, maxWidth: 270, paddingVertical: 2, textAlign: 'left' },
  err: { fontFamily: font.medium, color: colors.negative, fontSize: 13.5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: space.lg },
  catTile: { width: '25%', alignItems: 'center', gap: 8 },
  catCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: shadow.soft,
  },
  catCircleActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  catText: { fontFamily: font.medium, fontSize: 12, color: colors.ink, textAlign: 'center', lineHeight: 15 },
  receipt: { borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.line },
  removeReceipt: { flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', padding: space.md },
  success: { alignItems: 'center', paddingTop: space.xl, gap: space.sm },
  successIcon: { width: 76, height: 76, borderRadius: 38, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 24px rgba(0,0,0,0.2)' },
  successText: { fontFamily: font.regular, fontSize: 15, color: colors.inkSoft, textAlign: 'center', lineHeight: 21, paddingHorizontal: space.lg, marginBottom: space.lg },
});
