import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleProp, StyleSheet, TextInputProps, TextStyle, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNav } from '../navigation/Nav';
import { managedDepartmentIds } from '../store/selectors';
import { useStore } from '../store/Store';
import { colors, font, label, radius, shadow, space, statusMeta } from '../theme';
import { ExpenseStatus } from '../types';
import { formatINR, initials } from '../utils/format';
import { DashedLine, Icon, LongArrow } from './icons';
import { Text, TextInput } from './Text';

export { Icon } from './icons';

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

// Tab screens get the app header (project tag, search, alerts, profile); pushed screens get a long back arrow.
export function Screen({ title, subtitle, onBack, right, children, scroll = true, footer }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const heading = title ? (
    <View style={styles.titleBlock}>
      <Text style={styles.title}>{title}</Text>
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

function AppHeader() {
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
  const alertTab = currentUser.role === 'producer' ? 'inbox' : currentUser.role === 'manager' ? 'approvals' : 'payouts';
  return (
    <View style={styles.appHeader}>
      <View style={styles.projectPill}>
        <Icon name="clapperboard" size={17} color={colors.accentInk} strokeWidth={1.8} />
        <Text style={styles.projectPillText} numberOfLines={1}>
          {state.project.name.toLowerCase()}
        </Text>
      </View>
      <View style={{ flex: 1 }} />
      <Pressable onPress={() => nav.popToTab('expenses')} hitSlop={10} accessibilityLabel="Search expenses">
        <Icon name="search" size={25} strokeWidth={1.4} />
      </Pressable>
      <Pressable onPress={() => nav.popToTab(alertTab)} hitSlop={10} accessibilityLabel={`${alerts} alerts`}>
        <Icon name="bell" size={25} strokeWidth={1.4} />
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
export function Money({ value, size = 17, color = colors.ink, serif, signed }: { value: number; size?: number; color?: string; serif?: boolean; signed?: boolean }) {
  const text = formatINR(Math.abs(value), { decimals: !Number.isInteger(value) });
  const [whole, paise] = text.split('.');
  const base: TextStyle = { fontSize: size, color, fontFamily: serif ? font.serif : font.semibold, letterSpacing: serif ? -0.5 : 0 };
  return (
    <Text style={base} numberOfLines={1}>
      {signed ? (value < 0 ? '−' : '+') : value < 0 ? '−' : ''}
      {whole}
      {paise ? <Text style={[base, { fontFamily: serif ? font.serif : font.regular, opacity: serif ? 1 : 0.85 }]}>.{paise}</Text> : null}
    </Text>
  );
}

// Big centred serif statement with a small coloured eyebrow, the visual anchor of home screens.
export function Hero({ eyebrow, lines, amount, children }: { eyebrow?: string; lines: string[]; amount?: number; children?: React.ReactNode }) {
  return (
    <View style={styles.hero}>
      {eyebrow ? (
        <View style={styles.eyebrowRow}>
          <Icon name="sparkles" size={13} color={colors.accentInk} strokeWidth={2} />
          <Text style={styles.eyebrow}>{eyebrow}</Text>
        </View>
      ) : null}
      {lines.map((l) => (
        <Text key={l} style={styles.heroLine}>
          {l}
        </Text>
      ))}
      {amount !== undefined ? <Money value={amount} size={38} serif /> : null}
      {children}
    </View>
  );
}

export function StatusText({ status, style }: { status: ExpenseStatus; style?: StyleProp<TextStyle> }) {
  const m = statusMeta[status];
  return <Text style={[styles.statusText, { color: m.color }, style]}>{m.label}</Text>;
}

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && onAction ? (
        <Pressable onPress={onAction} hitSlop={8} style={styles.sectionActionRow}>
          <Text style={styles.sectionAction}>{action}</Text>
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

export function IconCircle({ name, size = 52, color = colors.ink, filled }: { name: string; size?: number; color?: string; filled?: boolean }) {
  return (
    <View
      style={[
        styles.iconCircle,
        { width: size, height: size, borderRadius: size / 2 },
        filled && { backgroundColor: colors.ink, borderColor: colors.ink },
      ]}
    >
      <Icon name={name} size={size * 0.44} color={filled ? colors.onInk : color} />
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
            <Icon name={t.icon} size={28} strokeWidth={1.4} />
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

// Dashed rule with a centred pill, used to group lists ("OCTOBER • 6 BILLS ₹48,250").
export function StatementDivider({ text, amount }: { text: string; amount?: number }) {
  return (
    <View style={styles.statementRow}>
      <DashedLine />
      <View style={styles.statementPill}>
        <View style={styles.statementInner}>
          <Text style={styles.statementText}>{text}</Text>
        </View>
        {amount !== undefined ? <Money value={amount} size={16} /> : null}
      </View>
      <DashedLine />
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
          <Text style={[styles.buttonLabel, small && { fontSize: 14.5 }, { color: fg }]}>{text}</Text>
        </>
      )}
    </Pressable>
  );
}

// Filter chip: outlined, uppercase and tracked; solid black when selected.
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
      contentContainerStyle={{ gap: space.md, paddingVertical: 6, paddingHorizontal: space.xl }}
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
  projectPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accentLine,
    flexShrink: 1,
  },
  projectPillText: { fontFamily: font.semibold, fontSize: 14, color: colors.ink, letterSpacing: 0.2, flexShrink: 1 },
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
  title: { fontFamily: font.semibold, fontSize: 30, color: colors.ink, letterSpacing: -0.4 },
  subtitle: { fontFamily: font.medium, fontSize: 15, color: colors.inkSoft },
  scrollBody: { paddingHorizontal: space.xl, paddingTop: space.md, paddingBottom: space.xxl * 1.5, gap: space.lg },
  footer: { paddingHorizontal: space.xl, paddingTop: space.md, backgroundColor: colors.bg, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  hero: { alignItems: 'center', gap: 4, paddingVertical: space.lg },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: space.sm },
  eyebrow: { ...label, fontSize: 12, letterSpacing: 1.6, color: colors.accentInk },
  heroLine: { fontFamily: font.serif, fontSize: 32, lineHeight: 38, color: colors.ink, textAlign: 'center', letterSpacing: -0.5 },
  statusText: { ...label, fontSize: 11, letterSpacing: 1.6 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: space.lg },
  sectionTitle: { ...label, fontSize: 13, letterSpacing: 2.6, color: colors.inkSoft },
  sectionActionRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  sectionAction: { fontFamily: font.medium, fontSize: 15, color: colors.inkSoft },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: space.lg + 2, boxShadow: shadow.soft },
  iconCircle: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.lineSoft, alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
  tileGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: space.lg },
  tile: { width: '25%', alignItems: 'center', gap: 10 },
  tileCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 6px 14px rgba(0,0,0,0.07), inset 0 1px 0 #FFFFFF',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  tileLabel: { fontFamily: font.medium, fontSize: 14.5, color: colors.ink, textAlign: 'center', lineHeight: 18 },
  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 16,
    paddingRight: 8,
    paddingVertical: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    boxShadow: shadow.soft,
  },
  infoPillLabel: { fontFamily: font.medium, fontSize: 15, color: colors.ink },
  infoPillValue: { fontFamily: font.semibold, fontSize: 15 },
  infoPillChevron: { width: 26, height: 26, borderRadius: 13, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  statementRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: -space.xl, marginVertical: space.sm },
  statementPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 6,
    paddingRight: 14,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    boxShadow: shadow.soft,
  },
  statementInner: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill, backgroundColor: colors.surfaceAlt },
  statementText: { ...label, fontSize: 10.5, letterSpacing: 1.6, color: colors.ink },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: space.lg, paddingVertical: space.sm },
  actionTitle: { fontFamily: font.semibold, fontSize: 17, color: colors.ink },
  actionSub: { fontFamily: font.regular, fontSize: 14.5, color: colors.inkSoft },
  button: { minHeight: 54, borderRadius: radius.md, paddingHorizontal: space.xl, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm },
  buttonSmall: { minHeight: 42, paddingHorizontal: space.lg, borderRadius: 12 },
  buttonPrimary: { backgroundColor: colors.button, boxShadow: shadow.button },
  buttonOutline: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.ink },
  buttonDanger: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.line },
  buttonLabel: { fontFamily: font.semibold, fontSize: 16.5, letterSpacing: 0.2 },
  chip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.dash, backgroundColor: colors.surface },
  chipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipText: { ...label, fontSize: 12, letterSpacing: 1.8, color: colors.inkSoft },
  segTrack: { flexDirection: 'row', backgroundColor: colors.sunken, borderRadius: radius.pill, padding: 4 },
  segItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 13, borderRadius: radius.pill },
  segActive: { backgroundColor: colors.surface, boxShadow: '0 3px 8px rgba(0,0,0,0.10)' },
  segText: { ...label, fontSize: 12.5, letterSpacing: 1.8, color: colors.inkMuted },
  track: { flexDirection: 'row', backgroundColor: colors.track, overflow: 'hidden' },
  stat: { flex: 1, gap: 3 },
  statLabel: { ...label, fontSize: 10.5, letterSpacing: 1.4, color: colors.inkMuted },
  statValue: { fontFamily: font.semibold, fontSize: 20, color: colors.ink },
  statHint: { fontFamily: font.regular, fontSize: 13, color: colors.inkMuted },
  fieldLabel: { ...label, fontSize: 11.5, letterSpacing: 1.8, color: colors.inkSoft },
  fieldHint: { fontFamily: font.regular, fontSize: 13, color: colors.inkMuted },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: space.lg,
    paddingVertical: 14,
    fontFamily: font.medium,
    fontSize: 16,
    color: colors.ink,
  },
  notice: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-start', padding: space.md + 2, borderRadius: radius.md, backgroundColor: colors.surfaceAlt },
  noticeText: { flex: 1, fontFamily: font.medium, fontSize: 14.5, lineHeight: 20 },
  empty: { alignItems: 'center', paddingVertical: 40, gap: space.md },
  emptyTitle: { fontFamily: font.semibold, fontSize: 17, color: colors.ink },
  emptyMsg: { fontFamily: font.regular, fontSize: 14.5, color: colors.inkSoft, textAlign: 'center', paddingHorizontal: space.xl, lineHeight: 20 },
  avatarRing: { borderWidth: 2.5, borderColor: '#F0643E', alignItems: 'center', justifyContent: 'center' },
  avatar: { backgroundColor: '#F3EDE6', alignItems: 'center', justifyContent: 'center' },
});
