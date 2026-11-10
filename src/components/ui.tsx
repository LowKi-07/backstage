import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleProp, StyleSheet, TextInputProps, TextStyle, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNav } from '../navigation/Nav';
import { managedDepartmentIds } from '../store/selectors';
import { useStore } from '../store/Store';
import { colors, font, label, radius, shadow, space, statusMeta } from '../theme';
import { ExpenseStatus } from '../types';
import { formatINR, initials } from '../utils/format';
import { Icon, LongArrow } from './icons';
import { Text, TextInput } from './Text';

export { Icon } from './icons';

// Capitalise the first letter only, so lowercase copy reads as sentence case.
export function sentence(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

// Low-alpha version of a #RRGGBB colour, for soft status and icon backgrounds.
export function tint(hex: string, alpha = 0.12) {
  return `${hex}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`;
}

/* ---------- Screen shells ---------- */

interface ScreenProps {
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
  children: React.ReactNode;
  scroll?: boolean;
  footer?: React.ReactNode;
}

// Tab screens get the app header (menu, search, alerts, profile); pushed screens get a long back arrow.
export function Screen({ title, subtitle, onBack, right, children, scroll = true, footer }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const heading = title ? (
    <View style={styles.titleBlock}>
      <Text style={styles.title}>{sentence(title)}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  ) : null;
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingTop: insets.top + space.sm }}>
        {onBack ? (
          <View style={styles.backBar}>
            <Pressable onPress={onBack} hitSlop={14} accessibilityLabel="Go back" accessibilityRole="button">
              <LongArrow />
            </Pressable>
            {right ?? null}
          </View>
        ) : (
          <AppHeader />
        )}
      </View>
      {scroll ? (
        <ScrollView contentContainerStyle={styles.scrollBody} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {heading}
          {children}
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>
          {heading ? <View style={{ paddingHorizontal: space.xl, paddingTop: space.md }}>{heading}</View> : null}
          {children}
        </View>
      )}
      {footer ? <View style={[styles.footer, { paddingBottom: (onBack ? insets.bottom : 0) + space.md }]}>{footer}</View> : null}
    </View>
  );
}

export function AppHeader({ dark, search = true }: { dark?: boolean; search?: boolean } = {}) {
  const { state, currentUser } = useStore();
  const nav = useNav();
  if (!currentUser) return null;
  const ids = managedDepartmentIds(state, currentUser);
  const alerts =
    currentUser.role === 'producer'
      ? state.expenses.filter((e) => e.status === 'escalated').length + state.budgetRequests.filter((r) => r.status === 'pending').length
      : currentUser.role === 'manager'
        ? state.expenses.filter((e) => ids.includes(e.departmentId) && e.status === 'submitted' && e.userId !== currentUser.id).length
        : state.expenses.filter((e) => e.userId === currentUser.id && e.status === 'approved').length;
  const openAlerts = () =>
    currentUser.role === 'crew' ? nav.push({ name: 'payouts' }) : nav.popToTab(currentUser.role === 'producer' ? 'inbox' : 'approvals');
  return (
    <View style={styles.appHeader}>
      <Pressable onPress={() => nav.push({ name: 'projects' })} hitSlop={10} accessibilityLabel="Menu: switch project">
        <Icon name="menu" size={26} strokeWidth={1.5} color={dark ? colors.onInk : colors.ink} />
      </Pressable>
      <View style={{ flex: 1 }} />
      {search ? (
        <Pressable onPress={() => nav.popToTab('expenses')} hitSlop={10} accessibilityLabel="Search expenses">
          <Icon name="search" size={25} strokeWidth={1.4} color={dark ? colors.onInk : colors.ink} />
        </Pressable>
      ) : null}
      <Pressable onPress={openAlerts} hitSlop={10} accessibilityLabel={`${alerts} alerts`}>
        <Icon name="bell" size={25} strokeWidth={1.4} color={dark ? colors.onInk : colors.ink} />
        {alerts > 0 ? (
          <View style={styles.bellBadge}>
            <Text style={styles.bellBadgeText}>{alerts > 9 ? '9+' : alerts}</Text>
          </View>
        ) : null}
      </Pressable>
      <Avatar name={currentUser.name} size={42} ring onPress={() => nav.push({ name: 'profile' })} />
    </View>
  );
}

/* ---------- Type & money ---------- */

// Amount with the paise part set lighter, e.g. ₹20,779.41
export function Money({ value, size = 16, color = colors.ink, display, signed }: { value: number; size?: number; color?: string; display?: boolean; signed?: boolean }) {
  const text = formatINR(Math.abs(value), { decimals: !Number.isInteger(value) });
  const [whole, paise] = text.split('.');
  const base: TextStyle = { fontSize: size, color, fontFamily: display ? font.display : font.semibold, letterSpacing: display ? -0.5 : 0 };
  return (
    <Text style={base} numberOfLines={1}>
      {signed ? (value < 0 ? '−' : '+') : value < 0 ? '−' : ''}
      {whole}
      {paise ? <Text style={[base, { fontFamily: display ? font.bold : font.regular, opacity: display ? 0.45 : 0.85 }]}>.{paise}</Text> : null}
    </Text>
  );
}

// Left-aligned summary card on a soft grey fill, the visual anchor of home screens.
export function Hero({ eyebrow, lines, amount, children }: { eyebrow?: string; lines: string[]; amount?: number; children?: React.ReactNode }) {
  return (
    <View style={styles.hero}>
      {eyebrow ? (
        <View style={styles.eyebrowRow}>
          <View style={styles.eyebrowDot} />
          <Text style={styles.eyebrow} numberOfLines={1}>
            {sentence(eyebrow)}
          </Text>
        </View>
      ) : null}
      {lines.map((l, i) => (
        <Text key={l} style={styles.heroLine}>
          {i === 0 ? sentence(l) : l}
        </Text>
      ))}
      {amount !== undefined ? <Money value={amount} size={30} display /> : null}
      {children}
    </View>
  );
}

export function StatusText({ status, style }: { status: ExpenseStatus; style?: StyleProp<TextStyle> }) {
  const m = statusMeta[status];
  return (
    <View style={[styles.statusPill, { backgroundColor: tint(m.color) }]}>
      <View style={[styles.statusDot, { backgroundColor: m.color }]} />
      <Text style={[styles.statusText, { color: m.color }, style]}>{m.label}</Text>
    </View>
  );
}

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle}>{sentence(title)}</Text>
      {action && onAction ? (
        <Pressable onPress={onAction} hitSlop={8} style={styles.sectionActionRow}>
          <Text style={styles.sectionAction}>{sentence(action)}</Text>
          <Icon name="chevron-right" size={18} color={colors.inkSoft} />
        </Pressable>
      ) : null}
    </View>
  );
}

/* ---------- Surfaces ---------- */

export function Card({ children, style, onPress }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void }) {
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.8 }, style]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

export function IconCircle({ name, size = 52, color = colors.ink, filled, outline }: { name: string; size?: number; color?: string; filled?: boolean; outline?: boolean }) {
  return (
    <View
      style={[
        styles.iconCircle,
        { width: size, height: size, borderRadius: Math.round(size * 0.32) },
        filled && { backgroundColor: colors.ink },
        outline && { borderRadius: size / 2, borderWidth: 1, borderColor: '#ECECEC', backgroundColor: colors.surface },
      ]}
    >
      <Icon name={name} size={outline ? size * 0.42 : size * 0.44} color={filled ? colors.onInk : color} />
    </View>
  );
}

// Round tiles with a lowercase caption underneath, in rows of four.
export function TileGrid({ items }: { items: { icon: string; label: string; onPress: () => void; badge?: number }[] }) {
  return (
    <View style={styles.tileGrid}>
      {items.map((t) => (
        <Pressable key={t.label} onPress={t.onPress} style={({ pressed }) => [styles.tile, pressed && { opacity: 0.7 }]} accessibilityRole="button">
          <View style={styles.tileCircle}>
            <Icon name={t.icon} size={26} strokeWidth={1.5} />
            {t.badge ? (
              <View style={[styles.bellBadge, { top: 2, right: 2 }]}>
                <Text style={styles.bellBadgeText}>{t.badge}</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.tileLabel} numberOfLines={2}>
            {t.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

// Outlined pill with an icon, a label and a value, e.g. "to be paid ₹8,900 ›".
export function InfoPill({ icon, label: text, value, valueColor = colors.positive, onPress }: { icon: string; label: string; value: string; valueColor?: string; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [styles.infoPill, pressed && { opacity: 0.75 }]}>
      <Icon name={icon} size={19} color={colors.pending} strokeWidth={1.7} />
      <Text style={styles.infoPillLabel}>{text}</Text>
      <Text style={[styles.infoPillValue, { color: valueColor }]}>{value}</Text>
      {onPress ? (
        <View style={styles.infoPillChevron}>
          <Icon name="chevron-right" size={15} strokeWidth={2} />
        </View>
      ) : null}
    </Pressable>
  );
}

// Month header for grouped lists: label on the left, total on the right.
export function StatementDivider({ text, amount }: { text: string; amount?: number }) {
  return (
    <View style={styles.statementRow}>
      <Text style={styles.statementText}>{sentence(text)}</Text>
      {amount !== undefined ? <Money value={amount} size={12.5} color={colors.inkSoft} /> : null}
    </View>
  );
}

// Row with a circle icon, two lines of text and a long arrow, for quick actions.
export function ActionRow({ icon, title, subtitle, onPress, tone }: { icon: string; title: string; subtitle?: string; onPress: () => void; tone?: string }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.actionRow, pressed && { opacity: 0.7 }]} accessibilityRole="button">
      <IconCircle name={icon} size={52} color={tone ?? colors.ink} />
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={[styles.actionTitle, tone ? { color: tone } : null]}>{title}</Text>
        {subtitle ? <Text style={styles.actionSub}>{subtitle}</Text> : null}
      </View>
      <LongArrow direction="right" color={tone ?? colors.ink} />
    </Pressable>
  );
}

/* ---------- Controls ---------- */

type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'danger';

export function Button({
  label: text,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  loading,
  style,
  small,
}: {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: string;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  small?: boolean;
}) {
  const fg = variant === 'primary' ? colors.onInk : variant === 'danger' ? colors.negative : colors.ink;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        small && styles.buttonSmall,
        variant === 'primary' && styles.buttonPrimary,
        variant === 'outline' && styles.buttonOutline,
        variant === 'danger' && styles.buttonDanger,
        { opacity: disabled ? 0.4 : pressed ? 0.8 : 1 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon ? <Icon name={icon} size={small ? 16 : 19} color={fg} strokeWidth={1.8} /> : null}
          <Text style={[styles.buttonLabel, small && { fontSize: 13 }, { color: fg }]}>{text}</Text>
        </>
      )}
    </Pressable>
  );
}

// Filter chip: outlined pill; solid black when selected.
export function Chip({ label: text, active, onPress, count }: { label: string; active?: boolean; onPress: () => void; count?: number }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]} accessibilityState={{ selected: active }}>
      <Text style={[styles.chipText, active && { color: colors.onInk }]}>
        {text}
        {count !== undefined ? ` ${count}` : ''}
      </Text>
    </Pressable>
  );
}

export function ChipRow({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginHorizontal: -space.xl, flexGrow: 0 }}
      contentContainerStyle={{ gap: 8, paddingVertical: 4, paddingHorizontal: space.xl }}
    >
      {children}
    </ScrollView>
  );
}

// Grey track with a raised white thumb, e.g. UNPAID | PAID.
export function Segmented<T extends string>({ options, value, onChange }: { options: { key: T; label: string }[]; value: T; onChange: (k: T) => void }) {
  return (
    <View style={styles.segTrack}>
      {options.map((o) => {
        const active = o.key === value;
        return (
          <Pressable key={o.key} onPress={() => onChange(o.key)} style={[styles.segItem, active && styles.segActive]} accessibilityRole="tab" accessibilityState={{ selected: active }}>
            <Text style={[styles.segText, active && { color: colors.ink }]} numberOfLines={1}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function ProgressBar({ value, pending = 0, height = 4 }: { value: number; pending?: number; height?: number }) {
  const v = Math.max(0, Math.min(1, value));
  const p = Math.max(0, Math.min(1 - v, pending));
  const color = value >= 1 ? colors.negative : value >= 0.8 ? colors.pending : colors.positive;
  return (
    <View style={[styles.track, { height, borderRadius: height }]}>
      <View style={{ width: `${v * 100}%`, backgroundColor: color }} />
      {p > 0 ? <View style={{ width: `${p * 100}%`, backgroundColor: color, opacity: 0.3 }} /> : null}
    </View>
  );
}

export function Stat({ label: text, value, hint, tone }: { label: string; value: string; hint?: string; tone?: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{text}</Text>
      <Text style={[styles.statValue, tone ? { color: tone } : null]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      {hint ? <Text style={styles.statHint}>{hint}</Text> : null}
    </View>
  );
}

export function Field({ label: text, hint, error, style, ...props }: TextInputProps & { label: string; hint?: string; error?: string }) {
  return (
    <View style={{ gap: 8 }}>
      {text ? <Text style={styles.fieldLabel}>{text}</Text> : null}
      <TextInput style={[styles.input, error ? { borderColor: colors.negative } : null, style]} {...props} />
      {error ? <Text style={[styles.fieldHint, { color: colors.negative }]}>{error}</Text> : hint ? <Text style={styles.fieldHint}>{hint}</Text> : null}
    </View>
  );
}

export function Notice({ text, tone = colors.ink }: { text: string; tone?: string }) {
  return (
    <View style={styles.notice}>
      <Icon name="info" size={18} color={tone} />
      <Text style={[styles.noticeText, { color: tone }]}>{text}</Text>
    </View>
  );
}

export function EmptyState({ icon, title, message }: { icon: string; title: string; message?: string }) {
  return (
    <View style={styles.empty}>
      <IconCircle name={icon} size={64} color={colors.inkMuted} />
      <Text style={styles.emptyTitle}>{title}</Text>
      {message ? <Text style={styles.emptyMsg}>{message}</Text> : null}
    </View>
  );
}

export function Avatar({ name, size = 36, onPress, ring }: { name: string; size?: number; onPress?: () => void; ring?: boolean }) {
  const inner = ring ? size - 7 : size;
  const content = (
    <View style={ring ? [styles.avatarRing, { width: size, height: size, borderRadius: size / 2 }] : null}>
      <View style={[styles.avatar, { width: inner, height: inner, borderRadius: inner / 2 }]}>
        <Text style={{ fontFamily: font.bold, color: colors.ink, fontSize: inner * 0.36 }}>{initials(name)}</Text>
      </View>
    </View>
  );
  return onPress ? (
    <Pressable onPress={onPress} hitSlop={8} accessibilityLabel="Profile" accessibilityRole="button">
      {content}
    </Pressable>
  ) : (
    content
  );
}

export function Divider() {
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.line, marginVertical: space.sm }} />;
}

export const styles = StyleSheet.create({
  backBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.xl, paddingVertical: space.md, minHeight: 52 },
  appHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: space.xl, paddingVertical: space.sm },
  bellBadge: {
    position: 'absolute',
    top: -6,
    right: -7,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: colors.badge,
    borderWidth: 1.5,
    borderColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBadgeText: { fontFamily: font.bold, fontSize: 10, color: colors.onInk },
  titleBlock: { gap: 6, marginBottom: space.sm },
  title: { fontFamily: font.display, fontSize: 24, color: colors.ink, letterSpacing: -0.6 },
  subtitle: { fontFamily: font.medium, fontSize: 14, color: colors.inkSoft },
  scrollBody: { paddingHorizontal: space.xl, paddingTop: space.md, paddingBottom: space.xxl * 1.5, gap: space.lg },
  footer: { paddingHorizontal: space.xl, paddingTop: space.md, backgroundColor: colors.bg, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  hero: { alignItems: 'flex-start', gap: 2, padding: space.xl, borderRadius: radius.lg, backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.lineSoft, marginTop: space.sm },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: space.sm, alignSelf: 'stretch' },
  eyebrowDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.accentInk },
  eyebrow: { ...label, fontSize: 13, color: colors.accentInk, flexShrink: 1 },
  heroLine: { fontFamily: font.bold, fontSize: 20, lineHeight: 26, color: colors.ink, letterSpacing: -0.4 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 2, borderRadius: radius.pill, alignSelf: 'flex-start' },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  statusText: { fontFamily: font.semibold, fontSize: 10.5 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: space.lg },
  sectionTitle: { fontFamily: font.bold, fontSize: 16, color: colors.ink, letterSpacing: -0.2 },
  sectionActionRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  sectionAction: { fontFamily: font.semibold, fontSize: 13.5, color: colors.inkSoft },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: space.lg + 2, boxShadow: shadow.soft },
  iconCircle: { backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  tileGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: space.lg },
  tile: { width: '25%', alignItems: 'center', gap: 10 },
  tileCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: shadow.soft,
  },
  tileLabel: { fontFamily: font.medium, fontSize: 13.5, color: colors.ink, textAlign: 'center', lineHeight: 18 },
  infoPill: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingLeft: 16, paddingRight: 8, paddingVertical: 10, borderRadius: radius.md, backgroundColor: colors.surface, boxShadow: shadow.soft },
  infoPillLabel: { fontFamily: font.medium, fontSize: 14, color: colors.ink },
  infoPillValue: { fontFamily: font.semibold, fontSize: 14 },
  infoPillChevron: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  statementRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space.md, marginBottom: 2 },
  statementText: { fontFamily: font.semibold, fontSize: 12, color: colors.inkMuted },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: space.lg, paddingVertical: space.sm },
  actionTitle: { fontFamily: font.semibold, fontSize: 16, color: colors.ink },
  actionSub: { fontFamily: font.regular, fontSize: 13.5, color: colors.inkSoft },
  button: { minHeight: 54, borderRadius: radius.pill, paddingHorizontal: space.xl, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm },
  buttonSmall: { minHeight: 42, paddingHorizontal: space.lg, borderRadius: radius.pill },
  buttonPrimary: { backgroundColor: colors.button, boxShadow: shadow.button },
  buttonOutline: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.ink },
  buttonDanger: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.line },
  buttonLabel: { fontFamily: font.bold, fontSize: 15, letterSpacing: 0 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface },
  chipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipText: { fontFamily: font.medium, fontSize: 12, color: colors.inkSoft },
  segTrack: { flexDirection: 'row', backgroundColor: colors.sunken, borderRadius: radius.pill, padding: 4 },
  segItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 13, borderRadius: radius.pill },
  segActive: { backgroundColor: colors.surface, boxShadow: '0 2px 6px rgba(0,0,0,0.10)' },
  segText: { fontFamily: font.semibold, fontSize: 14, color: colors.inkMuted },
  track: { flexDirection: 'row', backgroundColor: colors.track, overflow: 'hidden' },
  stat: { flex: 1, gap: 3 },
  statLabel: { fontFamily: font.medium, fontSize: 12.5, color: colors.inkMuted },
  statValue: { fontFamily: font.bold, fontSize: 19, color: colors.ink, letterSpacing: -0.3 },
  statHint: { fontFamily: font.regular, fontSize: 13, color: colors.inkMuted },
  fieldLabel: { fontFamily: font.semibold, fontSize: 14, color: colors.inkSoft },
  fieldHint: { fontFamily: font.regular, fontSize: 13, color: colors.inkMuted },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: space.lg,
    paddingVertical: 14,
    fontFamily: font.medium,
    fontSize: 15,
    color: colors.ink,
  },
  notice: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-start', padding: space.md + 2, borderRadius: radius.md, backgroundColor: colors.surfaceAlt },
  noticeText: { flex: 1, fontFamily: font.medium, fontSize: 13.5, lineHeight: 20 },
  empty: { alignItems: 'center', paddingVertical: 40, gap: space.md },
  emptyTitle: { fontFamily: font.semibold, fontSize: 16, color: colors.ink },
  emptyMsg: { fontFamily: font.regular, fontSize: 13.5, color: colors.inkSoft, textAlign: 'center', paddingHorizontal: space.xl, lineHeight: 20 },
  avatarRing: { borderWidth: 2.5, borderColor: '#F0643E', alignItems: 'center', justifyContent: 'center' },
  avatar: { backgroundColor: '#F3EDE6', alignItems: 'center', justifyContent: 'center' },
});
