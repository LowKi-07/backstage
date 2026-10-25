import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar, Icon } from '../components/ui';
import { deptName } from '../store/selectors';
import { useStore } from '../store/Store';
import { colors, glass, radius, roleMeta, space } from '../theme';
import { Role } from '../types';

const ROLES: Role[] = ['crew', 'manager', 'producer'];

export function LoginScreen() {
  const { state, login } = useStore();
  const insets = useSafeAreaInsets();
  const [role, setRole] = useState<Role | null>(null);
  const people = state.users.filter((u) => u.role === role);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 48, paddingHorizontal: space.xl, paddingBottom: insets.bottom + 32 }}>
        <View style={styles.logoRow}>
          <View style={styles.logo}>
            <Icon name="film" size={22} color={colors.onInk} />
          </View>
          <Text style={styles.brand}>Backstage</Text>
        </View>
        <Text style={styles.tagline}>Every rupee on set, accounted for.</Text>
        <View style={styles.projectTag}>
          <Icon name="videocam-outline" size={14} color={colors.ink} />
          <Text style={styles.projectText}>
            {state.project.name} · {state.project.kind}
          </Text>
        </View>

        <Text style={styles.prompt}>{role ? 'Who’s signing in?' : 'Continue as'}</Text>

        {!role
          ? ROLES.map((r) => (
              <Pressable key={r} onPress={() => setRole(r)} style={({ pressed }) => [styles.roleCard, pressed && { opacity: 0.85 }]}>
                <View style={styles.roleIcon}>
                  <Icon name={roleMeta[r].icon} size={24} color={colors.onInk} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.roleTitle}>{roleMeta[r].label}</Text>
                  <Text style={styles.roleBlurb}>{roleMeta[r].blurb}</Text>
                </View>
                <Icon name="chevron-forward" size={20} color={colors.inkMuted} />
              </Pressable>
            ))
          : (
            <>
              {people.map((u) => (
                <Pressable key={u.id} onPress={() => login(u.id)} style={({ pressed }) => [styles.roleCard, pressed && { opacity: 0.85 }]}>
                  <Avatar name={u.name} size={44} dark />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.roleTitle}>{u.name}</Text>
                    <Text style={styles.roleBlurb}>
                      {u.title}
                      {u.role === 'crew' && u.departmentIds[0] ? ` · ${deptName(state, u.departmentIds[0])}` : ''}
                    </Text>
                  </View>
                  <Icon name="log-in-outline" size={20} color={colors.inkMuted} />
                </Pressable>
              ))}
              <Pressable onPress={() => setRole(null)} style={styles.back}>
                <Icon name="arrow-back" size={16} color={colors.inkSoft} />
                <Text style={{ color: colors.inkSoft, fontWeight: '600' }}>Choose another role</Text>
              </Pressable>
            </>
          )}

        <Text style={styles.footnote}>
          Demo sign-in. Phone OTP and email verification will be enabled once the cloud backend is connected.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  logo: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  brand: { color: colors.ink, fontSize: 36, fontWeight: '800', letterSpacing: -1.2 },
  tagline: { color: colors.inkSoft, fontSize: 16, marginTop: space.md },
  projectTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: space.lg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    ...glass(16),
  },
  projectText: { color: colors.ink, fontWeight: '600', fontSize: 13 },
  prompt: { color: colors.ink, fontSize: 18, fontWeight: '700', marginTop: 40, marginBottom: space.md },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    ...glass(),
    borderRadius: radius.lg,
    padding: space.lg,
    marginBottom: space.md,
  },
  roleIcon: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  roleTitle: { color: colors.ink, fontSize: 16, fontWeight: '700' },
  roleBlurb: { color: colors.inkSoft, fontSize: 13, marginTop: 2, lineHeight: 18 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: space.md },
  footnote: { color: colors.inkMuted, fontSize: 12, marginTop: space.xl, lineHeight: 17 },
});
