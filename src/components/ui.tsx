import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, space, statusMeta } from '../theme';
import { ExpenseStatus } from '../types';
import { initials } from '../utils/format';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export function Icon({ name, size = 20, color = colors.ink }: { name: string; size?: number; color?: string }) {
  return <Ionicons name={name as IconName} size={size} color={color} />;
}

interface ScreenProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
  children: React.ReactNode;
  scroll?: boolean;
  footer?: React.ReactNode;
}

export function Screen({ title, subtitle, onBack, right, children, scroll = true, footer }: ScreenProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={[styles.header, { paddingTop: insets.top + space.md }]}>
        {onBack ? (
          <Pressable onPress={onBack} hitSlop={12} style={styles.backBtn} accessibilityLabel="Go back">
            <Icon name="chevron-back" size={24} color={colors.white} />
          </Pressable>
        ) : null}
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {right}
      </View>
      {scroll ? (
        <ScrollView contentContainerStyle={styles.scrollBody} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>{children}</View>
      )}
      {footer ? <View style={[styles.footer, { paddingBottom: insets.bottom + space.md }]}>{footer}</View> : null}
    </View>
  );
}

export function Card({ children, style, onPress }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void }) {
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }, style]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';

export function Button({
  label,
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
  const palette: Record<ButtonVariant, { bg: string; fg: string; border?: string }> = {
    primary: { bg: colors.ink, fg: colors.white },
    secondary: { bg: colors.surface, fg: colors.ink, border: colors.line },
    danger: { bg: colors.dangerSoft, fg: colors.danger },
    success: { bg: colors.success, fg: colors.white },
    ghost: { bg: 'transparent', fg: colors.ink },
  };
  const p = palette[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        small && styles.buttonSmall,
        { backgroundColor: p.bg, borderColor: p.border ?? p.bg, opacity: disabled ? 0.45 : pressed ? 0.8 : 1 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={p.fg} />
      ) : (
        <>
          {icon ? <Icon name={icon} size={small ? 16 : 18} color={p.fg} /> : null}
          <Text style={[styles.buttonLabel, small && { fontSize: 13 }, { color: p.fg }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

export function StatusBadge({ status }: { status: ExpenseStatus }) {
  const m = statusMeta[status];
  return <Pill label={m.label} fg={m.fg} bg={m.bg} />;
}

export function Pill({ label, fg, bg }: { label: string; fg: string; bg: string }) {
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Text style={[styles.pillText, { color: fg }]}>{label}</Text>
    </View>
  );
}

export function ProgressBar({ value, pending = 0, height = 8 }: { value: number; pending?: number; height?: number }) {
  const v = Math.max(0, Math.min(1, value));
  const p = Math.max(0, Math.min(1 - v, pending));
  const color = value >= 1 ? colors.danger : value >= 0.8 ? colors.warning : colors.success;
  return (
    <View style={[styles.track, { height }]}>
      <View style={{ width: `${v * 100}%`, backgroundColor: color }} />
      {p > 0 ? <View style={{ width: `${p * 100}%`, backgroundColor: color, opacity: 0.3 }} /> : null}
    </View>
  );
}

export function Stat({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, tone ? { color: tone } : null]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      {hint ? <Text style={styles.statHint}>{hint}</Text> : null}
    </View>
  );
}

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && onAction ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={styles.sectionAction}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Chip({ label, active, onPress, count }: { label: string; active?: boolean; onPress: () => void; count?: number }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && { color: colors.white }]}>
        {label}
        {count !== undefined ? ` · ${count}` : ''}
      </Text>
    </Pressable>
  );
}

export function ChipRow({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm, paddingVertical: 2 }}>
      {children}
    </ScrollView>
  );
}

export function EmptyState({ icon, title, message }: { icon: string; title: string; message?: string }) {
  return (
    <View style={styles.empty}>
      <Icon name={icon} size={36} color={colors.inkMuted} />
      <Text style={styles.emptyTitle}>{title}</Text>
      {message ? <Text style={styles.emptyMsg}>{message}</Text> : null}
    </View>
  );
}

export function Field({ label, hint, error, style, ...props }: TextInputProps & { label: string; hint?: string; error?: string }) {
  return (
    <View style={{ gap: 6 }}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <TextInput placeholderTextColor={colors.inkMuted} style={[styles.input, error ? { borderColor: colors.danger } : null, style]} {...props} />
      {error ? <Text style={[styles.fieldHint, { color: colors.danger }]}>{error}</Text> : hint ? <Text style={styles.fieldHint}>{hint}</Text> : null}
    </View>
  );
}

export function Avatar({ name, size = 36, onPress, dark }: { name: string; size?: number; onPress?: () => void; dark?: boolean }) {
  const content = (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: dark ? colors.brand : colors.brandSoft,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontWeight: '700', color: colors.ink, fontSize: size * 0.38 }}>{initials(name)}</Text>
    </View>
  );
  return onPress ? (
    <Pressable onPress={onPress} hitSlop={8} accessibilityLabel="Profile">
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
  header: {
    backgroundColor: colors.header,
    paddingHorizontal: space.lg,
    paddingBottom: space.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  backBtn: { marginLeft: -6 },
  headerTitle: { color: colors.white, fontSize: 22, fontWeight: '700' },
  headerSubtitle: { color: '#BDB7AC', fontSize: 13, marginTop: 2 },
  scrollBody: { padding: space.lg, gap: space.md, paddingBottom: 120 },
  footer: {
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  button: {
    minHeight: 48,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    borderWidth: 1,
  },
  buttonSmall: { minHeight: 36, paddingHorizontal: space.md },
  buttonLabel: { fontSize: 15, fontWeight: '600' },
  pill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.pill, alignSelf: 'flex-start' },
  pillText: { fontSize: 12, fontWeight: '600' },
  track: { flexDirection: 'row', backgroundColor: '#EEEAE3', borderRadius: radius.pill, overflow: 'hidden' },
  stat: { flex: 1, gap: 2 },
  statLabel: { fontSize: 12, color: colors.inkSoft, fontWeight: '500' },
  statValue: { fontSize: 20, fontWeight: '700', color: colors.ink },
  statHint: { fontSize: 12, color: colors.inkMuted },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: space.sm },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.inkSoft, textTransform: 'uppercase', letterSpacing: 0.6 },
  sectionAction: { fontSize: 14, fontWeight: '600', color: colors.info },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  chipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.ink },
  empty: { alignItems: 'center', paddingVertical: 48, gap: space.sm },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: colors.ink },
  emptyMsg: { fontSize: 14, color: colors.inkSoft, textAlign: 'center', paddingHorizontal: space.xl },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.inkSoft },
  fieldHint: { fontSize: 12, color: colors.inkMuted },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.ink,
  },
});
