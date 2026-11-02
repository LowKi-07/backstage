import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Logo, LongArrow } from '../components/icons';
import { Text } from '../components/Text';
import { Avatar, IconCircle, SectionTitle } from '../components/ui';
import { deptName } from '../store/selectors';
import { useStore } from '../store/Store';
import { colors, font, label, radius, roleMeta, shadow, space } from '../theme';
import { Role } from '../types';

const ROLES: Role[] = ['crew', 'manager', 'producer'];

export function LoginScreen() {
  const { state, login } = useStore();
  const insets = useSafeAreaInsets();
  const [role, setRole] = useState<Role | null>(null);
  const people = state.users.filter((u) => u.role === role);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 40, paddingHorizontal: space.xl, paddingBottom: insets.bottom + 32, gap: space.md }}>
        <View style={styles.brandRow}>
          <Logo size={40} />
          <Text style={styles.brand}>backstage</Text>
        </View>

        <View style={{ gap: 6, marginTop: space.xl }}>
          <Text style={styles.eyebrow}>{`${state.project.name} · ${state.project.kind}`}</Text>
          <Text style={styles.headline}>every rupee on set, accounted for.</Text>
        </View>

        <SectionTitle title={role ? 'who’s signing in?' : 'continue as'} />

        {!role ? (
          ROLES.map((r) => (
            <Pressable key={r} onPress={() => setRole(r)} style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]} accessibilityRole="button">
              <IconCircle name={roleMeta[r].icon} size={54} />
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.cardTitle}>{roleMeta[r].label}</Text>
                <Text style={styles.cardSub}>{roleMeta[r].blurb}</Text>
              </View>
              <LongArrow direction="right" width={26} />
            </Pressable>
          ))
        ) : (
          <>
            {people.map((u) => (
              <Pressable key={u.id} onPress={() => login(u.id)} style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]} accessibilityRole="button">
                <Avatar name={u.name} size={54} />
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={styles.cardTitle}>{u.name}</Text>
                  <Text style={styles.cardSub}>
                    {u.title}
                    {u.role === 'crew' && u.departmentIds[0] ? ` · ${deptName(state, u.departmentIds[0])}` : ''}
                  </Text>
                </View>
                <LongArrow direction="right" width={26} />
              </Pressable>
            ))}
            <Pressable onPress={() => setRole(null)} style={styles.back} hitSlop={8}>
              <LongArrow width={26} color={colors.inkSoft} />
              <Text style={styles.backText}>choose another role</Text>
            </Pressable>
          </>
        )}

        <Text style={styles.footnote}>Demo sign-in. Phone OTP and email verification switch on once the cloud backend is connected.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  brand: { fontFamily: font.bold, fontSize: 28, color: colors.ink, letterSpacing: -0.6 },
  eyebrow: { ...label, fontSize: 11.5, letterSpacing: 1.8, color: colors.accentInk },
  headline: { fontFamily: font.serif, fontSize: 40, lineHeight: 46, color: colors.ink, letterSpacing: -0.8 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg + 4,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space.lg,
    boxShadow: shadow.soft,
  },
  cardTitle: { fontFamily: font.semibold, fontSize: 18, color: colors.ink },
  cardSub: { fontFamily: font.regular, fontSize: 14.5, color: colors.inkSoft, lineHeight: 19 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: space.md },
  backText: { fontFamily: font.medium, fontSize: 15, color: colors.inkSoft },
  footnote: { fontFamily: font.regular, fontSize: 13, color: colors.inkMuted, marginTop: space.xl, lineHeight: 18 },
});
