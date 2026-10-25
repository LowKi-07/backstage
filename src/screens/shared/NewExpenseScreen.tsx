import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { categoryIcon } from '../../components/rows';
import { Button, Card, Chip, ChipRow, Field, Icon, Screen, SectionTitle } from '../../components/ui';
import { useNav } from '../../navigation/Nav';
import { useStore } from '../../store/Store';
import { colors, glass, radius, space } from '../../theme';
import { CATEGORIES, Expense } from '../../types';
import { formatINR, isValidGSTIN, toISODate } from '../../utils/format';

const DAY = 86400000;
const dateOptions = [0, 1, 2, 3].map((n) => {
  const d = new Date(Date.now() - n * DAY);
  return { label: n === 0 ? 'Today' : n === 1 ? 'Yesterday' : `${n} days ago`, value: toISODate(d) };
});

export function NewExpenseScreen() {
  const { state, currentUser, submitExpense } = useStore();
  const nav = useNav();
  const myDepts = state.departments.filter((d) => currentUser?.departmentIds.includes(d.id));

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [departmentId, setDepartmentId] = useState<string | null>(myDepts.length === 1 ? myDepts[0].id : null);
  const [description, setDescription] = useState('');
  const [vendor, setVendor] = useState('');
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

  if (submitted) {
    const toProducer = submitted.status === 'escalated';
    return (
      <Screen title="Submitted" onBack={nav.pop}>
        <Card style={{ alignItems: 'center', paddingVertical: 36, gap: space.md }}>
          <View style={styles.successIcon}>
            <Icon name="checkmark" size={36} color={colors.onInk} />
          </View>
          <Text style={styles.successAmount}>{formatINR(submitted.amount)}</Text>
          <Text style={styles.successText}>
            {toProducer
              ? 'Sent to the producer for approval. You’ll see updates in your expenses.'
              : 'Sent to your team manager for approval. You’ll see updates in your expenses.'}
          </Text>
        </Card>
        <Button label="Log another expense" icon="add" onPress={reset} />
        <Button label="View expense" variant="secondary" onPress={() => { nav.pop(); nav.push({ name: 'expense', id: submitted.id }); }} />
      </Screen>
    );
  }

  return (
    <Screen
      title="Log expense"
      subtitle={state.project.name}
      onBack={nav.pop}
      footer={<Button label="Submit for approval" icon="paper-plane-outline" onPress={submit} />}
    >
      <Card style={{ gap: space.sm }}>
        <Text style={styles.amountLabel}>Amount spent</Text>
        <View style={styles.amountRow}>
          <Text style={styles.rupee}>₹</Text>
          <TextInput
            value={amount}
            onChangeText={(t) => setAmount(t.replace(/[^0-9.]/g, ''))}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={colors.inkMuted}
            style={styles.amountInput}
            autoFocus={Platform.OS !== 'web'}
            accessibilityLabel="Amount spent"
          />
        </View>
        {errors.amount ? <Text style={styles.err}>{errors.amount}</Text> : null}
      </Card>

      <SectionTitle title="Receipt" />
      {receiptUri ? (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <Image source={{ uri: receiptUri }} style={{ width: '100%', height: 220 }} resizeMode="cover" />
          <Pressable onPress={() => setReceiptUri(undefined)} style={styles.removeReceipt}>
            <Icon name="trash-outline" size={16} color={colors.danger} />
            <Text style={{ color: colors.danger, fontWeight: '600' }}>Remove receipt</Text>
          </Pressable>
        </Card>
      ) : (
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <Button label="Take photo" icon="camera-outline" variant="secondary" onPress={() => pick('camera')} style={{ flex: 1 }} />
          <Button label="Upload" icon="image-outline" variant="secondary" onPress={() => pick('library')} style={{ flex: 1 }} />
        </View>
      )}
      {pickerError ? <Text style={styles.err}>{pickerError}</Text> : null}

      <SectionTitle title="Category" />
      <View style={styles.grid}>
        {CATEGORIES.map((c) => {
          const active = category === c;
          return (
            <Pressable key={c} onPress={() => setCategory(c)} style={[styles.catTile, active && styles.catTileActive]}>
              <Icon name={categoryIcon[c]} size={20} color={active ? colors.onInk : colors.ink} />
              <Text style={[styles.catText, active && { color: colors.onInk }]} numberOfLines={2}>
                {c}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {errors.category ? <Text style={styles.err}>{errors.category}</Text> : null}

      {myDepts.length > 1 ? (
        <>
          <SectionTitle title="Department" />
          <ChipRow>
            {myDepts.map((d) => (
              <Chip key={d.id} label={d.name} active={departmentId === d.id} onPress={() => setDepartmentId(d.id)} />
            ))}
          </ChipRow>
          {errors.department ? <Text style={styles.err}>{errors.department}</Text> : null}
        </>
      ) : null}

      <SectionTitle title="Details" />
      <Field
        label="What was it for?"
        placeholder="e.g. Diesel for generator van"
        value={description}
        onChangeText={setDescription}
        error={errors.description}
        multiline
      />
      <Field label="Vendor / shop (optional)" placeholder="e.g. IndianOil Aluva" value={vendor} onChangeText={setVendor} />
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

      <SectionTitle title="Date" />
      <ChipRow>
        {dateOptions.map((o) => (
          <Chip key={o.value} label={o.label} active={date === o.value} onPress={() => setDate(o.value)} />
        ))}
      </ChipRow>
      <Field label="Or enter a date" value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" error={errors.date} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  amountLabel: { fontSize: 13, fontWeight: '600', color: colors.inkSoft },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rupee: { fontSize: 34, fontWeight: '700', color: colors.ink, marginTop: -4 },
  amountInput: { flex: 1, minWidth: 0, fontSize: 34, fontWeight: '700', color: colors.ink, paddingVertical: 4 },
  err: { color: colors.danger, fontSize: 12.5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  catTile: {
    width: '31.5%',
    minHeight: 76,
    ...glass(16),
    borderRadius: radius.md,
    paddingVertical: space.sm,
    paddingHorizontal: 4,
    gap: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  catTileActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  catText: { fontSize: 11.5, fontWeight: '600', color: colors.ink, textAlign: 'center' },
  removeReceipt: { flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', padding: space.md },
  successIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.ink, boxShadow: '0 0 40px rgba(255,255,255,0.35)', alignItems: 'center', justifyContent: 'center' },
  successAmount: { fontSize: 30, fontWeight: '800', color: colors.ink },
  successText: { fontSize: 15, color: colors.inkSoft, textAlign: 'center', lineHeight: 21, paddingHorizontal: space.lg },
});
