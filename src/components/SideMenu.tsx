import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNav } from '../navigation/Nav';
import { useStore } from '../store/Store';
import { colors, font, roleMeta, space } from '../theme';
import { Icon } from './icons';
import { Text } from './Text';
import { Avatar } from './ui';

type Item = { icon: string; label: string; onPress?: () => void; badge?: number; soon?: boolean };

// Left-hand drawer behind the header's menu button: profile first, a few shortcuts, then switch user and log out.
export function SideMenu({ open, onClose, alerts, onAlerts }: { open: boolean; onClose: () => void; alerts: number; onAlerts: () => void }) {
  const { currentUser, logout } = useStore();
  const nav = useNav();
  const insets = useSafeAreaInsets();
  if (!currentUser) return null;
  const go = (fn: () => void) => () => {
    onClose();
    fn();
  };
  const role = currentUser.role;
  const items: Item[] = [
    role === 'crew'
      ? { icon: 'wallet', label: 'My payouts', onPress: go(() => nav.push({ name: 'payouts' })) }
      : { icon: 'layers', label: 'Budgets', onPress: go(() => nav.push({ name: 'budgets' })) },
    { icon: 'bell', label: 'Notifications', badge: alerts, onPress: go(onAlerts) },
    { icon: 'shield', label: 'Privacy & security', soon: true },
    { icon: 'settings', label: 'Settings', soon: true },
    { icon: 'help', label: 'Help & support', soon: true },
  ];

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.root}>
        <View style={[styles.panel, { paddingTop: insets.top + space.lg, paddingBottom: insets.bottom + space.lg }]}>
          <View style={styles.top}>
            <Text style={styles.kicker}>MENU</Text>
            <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close menu">
              <Icon name="close" size={24} />
            </Pressable>
          </View>

          <Pressable onPress={go(() => nav.push({ name: 'profile' }))} style={({ pressed }) => [styles.profile, pressed && { opacity: 0.7 }]} accessibilityRole="button" accessibilityLabel={`Profile, ${currentUser.name}`}>
            <Avatar name={currentUser.name} size={52} ring />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.name} numberOfLines={1}>
                {currentUser.name}
              </Text>
              <Text style={styles.sub} numberOfLines={1}>
                View profile
              </Text>
            </View>
            <Icon name="chevron-right" size={20} color={colors.inkMuted} />
          </Pressable>

          <View style={{ marginTop: space.sm }}>
            {items.map((it) => (
              <Row key={it.label} {...it} />
            ))}
          </View>

          <View style={{ flex: 1 }} />
          <View style={styles.rule} />
          <Row icon="reset" label="Switch user" onPress={go(logout)} />
          <Row icon="logout" label="Log out" onPress={go(logout)} tone={colors.negative} />
        </View>
        <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel="Close menu" />
      </View>
    </Modal>
  );
}

function Row({ icon, label, onPress, badge, soon, tone }: Item & { tone?: string }) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]} accessibilityRole="button" accessibilityState={{ disabled: !onPress }}>
      <Icon name={icon} size={22} color={tone ?? (soon ? colors.inkMuted : colors.ink)} strokeWidth={1.6} />
      <Text style={[styles.rowText, tone ? { color: tone } : null, soon ? { color: colors.inkMuted } : null]}>{label}</Text>
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge > 9 ? '9+' : badge}</Text>
        </View>
      ) : null}
      {soon ? <Text style={styles.soon}>Soon</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.55)' },
  panel: { width: '82%', maxWidth: 340, backgroundColor: colors.surface, borderTopRightRadius: 28, borderBottomRightRadius: 28, paddingHorizontal: space.xl },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.lg },
  kicker: { fontFamily: font.semibold, fontSize: 12.5, letterSpacing: 1.4, color: '#7A7A7A' },
  profile: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 22, borderWidth: 1, borderColor: '#EDEDED' },
  name: { fontFamily: font.display, fontSize: 17, letterSpacing: -0.3, color: colors.ink },
  sub: { fontFamily: font.regular, fontSize: 12.5, color: colors.inkMuted },
  row: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 15, paddingHorizontal: 4 },
  rowText: { flex: 1, fontFamily: font.semibold, fontSize: 15, color: colors.ink },
  badge: { minWidth: 22, height: 22, paddingHorizontal: 6, borderRadius: 11, backgroundColor: colors.badge, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontFamily: font.bold, fontSize: 11, color: colors.onInk },
  soon: { fontFamily: font.semibold, fontSize: 11, color: colors.inkMuted, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99, backgroundColor: colors.surfaceAlt, overflow: 'hidden' },
  rule: { height: 1, backgroundColor: '#F0F0F0', marginBottom: 4 },
});
