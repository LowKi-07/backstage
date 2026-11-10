import React, { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, Share, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../../components/icons';
import { categoryIcon } from '../../components/rows';
import { Text, TextInput } from '../../components/Text';
import { Money } from '../../components/ui';
import { useNav } from '../../navigation/Nav';
import { byNewest, managedDepartmentIds, sum, userName } from '../../store/selectors';
import { useStore } from '../../store/Store';
import { colors, font, radius, space, statusMeta } from '../../theme';
import { Expense } from '../../types';
import { formatINR, formatShortDate } from '../../utils/format';

type Filter = 'all' | 'pending' | 'approved' | 'paid' | 'rejected';
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'paid', label: 'Paid' },
  { key: 'rejected', label: 'Rejected' },
];
const MONTHS = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
const matches = (f: Filter, e: Expense) => f === 'all' || (f === 'pending' ? e.status === 'submitted' || e.status === 'escalated' : e.status === f);

// Full-height sheet with every team transaction: search, status filters, month groups and CSV download.
export function AllTransactionsSheet() {
  const { state, currentUser } = useStore();
  const nav = useNav();
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [note, setNote] = useState<string | null>(null);

  const all = useMemo(() => {
    if (currentUser?.role === 'crew') return state.expenses.filter((e) => e.userId === currentUser.id).sort(byNewest);
    const ids = managedDepartmentIds(state, currentUser);
    return state.expenses.filter((e) => ids.includes(e.departmentId)).sort(byNewest);
  }, [state, currentUser]);

  const crew = currentUser?.role === 'crew';
  const ql = q.trim().toLowerCase();
  const shown = all.filter((e) => matches(filter, e) && (!ql || [e.description, e.vendor ?? '', e.category, userName(state, e.userId)].join(' ').toLowerCase().includes(ql)));

  const groups: { key: string; title: string; items: Expense[] }[] = [];
  shown.forEach((e) => {
    const d = new Date(e.date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    let g = groups[groups.length - 1];
    if (!g || g.key !== key) {
      g = { key, title: MONTHS[d.getMonth()], items: [] };
      groups.push(g);
    }
    g.items.push(e);
  });

  const download = async () => {
    const cell = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const rows = shown.map((e) => [e.date, e.description, userName(state, e.userId), e.category, e.vendor ?? '', e.amount, statusMeta[e.status].label].map(cell).join(','));
    const csv = ['Date,Item,Submitted by,Category,Vendor,Amount (INR),Status', ...rows].join('\n');
    try {
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = `backstage-${crew ? 'my' : 'team'}-expenses-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } else {
        await Share.share({ title: 'Team expenses (CSV)', message: csv });
      }
      setNote(`Downloaded ${shown.length} ${shown.length === 1 ? 'transaction' : 'transactions'}.`);
    } catch {
      setNote('Couldn’t create the file on this device.');
    }
  };

  return (
    <View style={styles.backdrop}>
      <Pressable style={{ height: insets.top + 44 }} onPress={nav.pop} accessibilityLabel="Close" />
      <View style={styles.sheet} accessibilityViewIsModal>
        <View style={styles.handle} />
        <View style={styles.head}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.title} accessibilityRole="header">
              All transactions
            </Text>
            <Text style={styles.muted}>
              {shown.length} of {all.length} · {formatINR(sum(shown))}
            </Text>
          </View>
          <Pressable onPress={download} style={styles.iconBtn} accessibilityLabel="Download transactions as CSV" accessibilityRole="button">
            <Icon name="download" size={18} />
          </Pressable>
          <Pressable onPress={nav.pop} style={[styles.iconBtn, styles.closeBtn]} accessibilityLabel="Close" accessibilityRole="button">
            <Icon name="close" size={18} strokeWidth={2} />
          </Pressable>
        </View>

        <View style={styles.search}>
          <Icon name="search" size={18} color={colors.inkMuted} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder={crew ? 'Search by item, category or vendor' : 'Search by item, person or vendor'}
            style={[styles.searchInput, Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null]}
            accessibilityLabel="Search transactions"
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} style={{ flexGrow: 0 }}>
          {FILTERS.map((f) => {
            const on = f.key === filter;
            const n = all.filter((e) => matches(f.key, e)).length;
            return (
              <Pressable key={f.key} onPress={() => setFilter(f.key)} style={[styles.chip, on && styles.chipOn]} accessibilityRole="button" accessibilityState={{ selected: on }}>
                <Text style={[styles.chipText, on && { color: colors.onInk }]}>
                  {f.label} {n}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: space.xl, paddingBottom: space.lg }} keyboardShouldPersistTaps="handled">
          {groups.map((g) => (
            <View key={g.key}>
              <View style={styles.monthRow}>
                <Text style={styles.month}>{g.title}</Text>
                <Money value={sum(g.items)} size={12} />
              </View>
              {g.items.map((e) => {
                const meta = statusMeta[e.status];
                return (
                  <Pressable key={e.id} onPress={() => nav.push({ name: 'expense', id: e.id })} style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]} accessibilityRole="button">
                    <View style={styles.rowIcon}>
                      <Icon name={categoryIcon[e.category] ?? 'receipt'} size={16} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
                      <Text style={styles.rowTitle} numberOfLines={1}>
                        {e.description}
                      </Text>
                      <Text style={[styles.muted, { fontSize: 12 }]} numberOfLines={1}>
                        {crew ? `${e.category.toLowerCase()} · ${formatShortDate(e.date)}` : `${userName(state, e.userId)} · ${formatShortDate(e.date)}`}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                      <Money value={e.amount} size={13.5} />
                      <Text style={styles.rowMeta}>{meta.label}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ))}
          {shown.length === 0 ? <Text style={[styles.muted, { textAlign: 'center', paddingVertical: 48 }]}>No transactions match. Try another search or filter.</Text> : null}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + space.md }]}>
          {note ? <Text style={[styles.muted, { textAlign: 'center' }]}>{note}</Text> : null}
          <Pressable onPress={download} style={({ pressed }) => [styles.dl, pressed && { opacity: 0.85 }]} accessibilityRole="button">
            <Text style={styles.dlText}>Download {shown.length === all.length ? 'all' : `${shown.length} shown`} (CSV)</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: { flex: 1, backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden' },
  handle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: '#E2E2E2', marginTop: 10 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: space.xl, paddingTop: space.md },
  title: { fontFamily: font.display, fontSize: 20, color: colors.ink, letterSpacing: -0.4 },
  muted: { fontFamily: font.regular, fontSize: 13, color: colors.inkMuted },
  iconBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  closeBtn: { borderWidth: 0, backgroundColor: '#F2F2F2' },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 46, marginHorizontal: space.xl, marginTop: space.md, paddingHorizontal: 14, borderRadius: 14, backgroundColor: '#F5F5F5' },
  searchInput: { flex: 1, fontFamily: font.regular, fontSize: 14, color: colors.ink, paddingVertical: 0 },
  chips: { gap: 8, paddingHorizontal: space.xl, paddingVertical: space.md },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line },
  chipOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipText: { fontFamily: font.medium, fontSize: 12, color: colors.inkSoft },
  monthRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: '#EAEAEA', borderStyle: 'dashed' },
  month: { fontFamily: font.semibold, fontSize: 10.5, letterSpacing: 2, color: colors.inkMuted },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12 },
  rowIcon: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: '#ECECEC', alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontFamily: font.medium, fontSize: 13.5, color: colors.ink },
  rowMeta: { fontFamily: font.regular, fontSize: 11.5, color: colors.inkMuted },
  footer: { paddingHorizontal: space.xl, paddingTop: space.md, gap: 8, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  dl: { height: 52, borderRadius: radius.pill, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  dlText: { fontFamily: font.bold, fontSize: 14.5, color: colors.onInk },
});
