import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar, Icon } from '../components/ui';
import { deptName } from '../store/selectors';
import { useStore } from '../store/Store';
import { colors, radius, roleMeta, space } from '../theme';
import { Role } from '../types';

const ROLES: Role[] = ['crew', 'manager', 'producer'];

export function LoginScreen() {
  const { state, login } = useStore();
  const insets = useSafeAreaInsets();
  const [role, setRole] = useState<Role | null>(null);
  const people = state.users.filter((u) => u.role === role);

  return (
    <View style={{ flex: 1, backgroundColor: colors.header }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 48, paddingHorizontal: space.xl, paddingBottom: insets.bottom + 32 }}>
        <View style={styles.logoRow}>
          <View style={styles.logo}>
            <Icon name="film" size={22} color={colors.header} />
          </View>
          <Text style={styles.brand}>Packup</Text>
        </View>
        <Text style={styles.tagline}>Every rupee on set, accounted for.</Text>
        <View style={styles.projectTag}>
          <Icon name="videocam-outline" size={14} color={colors.brand} />
          <Text style={styles.projectText}>
            {state.project.name} · {state.project.kind}
          </Text>
        </View>

        <Text style={styles.prompt}>{role ? 'Who’s signing in?' : 'Continue as'}</Text>

        {!role
          ? ROLES.map((r) => (
              <Pressable key={r} onPress={() => setRole(r)} style={({ pressed }) => [styles.roleCard, pressed && { opacity: 0.85 }]}>
                <View style={styles.roleIcon}>
                  <Icon name={roleMeta[r].icon} size={24} color={colors.ink} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.roleTitle}>{roleMeta[r].label}</Text>
                  <Text style={styles.roleBlurb}>{roleMeta[r].blurb}</Text>
                </View>
                <Icon name="chevron-forward" size={20} color="#8F8A80" />
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
                  <Icon name="log-in-outline" size={20} color="#8F8A80" />
                </Pressable>
              ))}
              <Pressable onPress={() => setRole(null)} style={styles.back}>
                <Icon name="arrow-back" size={16} color="#BDB7AC" />
                <Text style={{ color: '#BDB7AC', fontWeight: '600' }}>Choose another role</Text>
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
  logo: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' },
  brand: { color: colors.white, fontSize: 32, fontWeight: '800', letterSpacing: -0.5 },
  tagline: { color: '#BDB7AC', fontSize: 16, marginTop: space.md },
  projectTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: space.lg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: '#2B2925',
  },
  projectText: { color: colors.brand, fontWeight: '600', fontSize: 13 },
  prompt: { color: colors.white, fontSize: 18, fontWeight: '700', marginTop: 40, marginBottom: space.md },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: '#2B2925',
    borderRadius: radius.lg,
    padding: space.lg,
    marginBottom: space.md,
  },
  roleIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' },
  roleTitle: { color: colors.white, fontSize: 16, fontWeight: '700' },
  roleBlurb: { color: '#BDB7AC', fontSize: 13, marginTop: 2, lineHeight: 18 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: space.md },
  footnote: { color: '#8F8A80', fontSize: 12, marginTop: space.xl, lineHeight: 17 },
});
