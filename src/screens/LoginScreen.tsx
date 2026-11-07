import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { Icon, Logo } from '../components/icons';
import { Text } from '../components/Text';
import { COLLAGE } from '../data/projects';
import { useStore } from '../store/Store';
import { colors, font, radius, roleMeta, space } from '../theme';
import { Role } from '../types';

const ROLES: Role[] = ['crew', 'manager', 'producer'];
// Demo sign-in: each role opens as one of the sample people.
const DEMO_USER: Record<Role, string> = { crew: 'c1', manager: 'm2', producer: 'p1' };

const sentence = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function LoginScreen() {
  const { login } = useStore();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [role, setRole] = useState<Role>('crew');
  const [open, setOpen] = useState(false);
  const collageWidth = Math.min(width, 440) + 92;

  return (
    <View style={styles.root}>
      {/* Tilted poster collage that fades into black behind the sign-in panel. */}
      <View pointerEvents="none" style={[styles.collage, { width: collageWidth }]}>
        {[0, 1, 2].map((col) => (
          <View key={col} style={[styles.column, { marginTop: col === 0 ? 30 : col === 2 ? 54 : 0 }]}>
            {[0, 1].map((row) => (
              <View key={row} style={styles.tile}>
                <Image source={COLLAGE[row * 3 + col]} style={StyleSheet.absoluteFill} resizeMode="cover" />
              </View>
            ))}
          </View>
        ))}
      </View>
      <Svg pointerEvents="none" style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <LinearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#000000" stopOpacity={0.15} />
            <Stop offset="0.28" stopColor="#000000" stopOpacity={0.35} />
            <Stop offset="0.55" stopColor="#000000" stopOpacity={1} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#fade)" />
      </Svg>

      <View style={[styles.panel, { paddingBottom: insets.bottom + 28 }]}>
        <View style={{ alignItems: 'center' }}>
          <Logo size={54} color={colors.onInk} />
        </View>
        <Text style={styles.title}>Backstage</Text>
        <Text style={styles.tagline}>Every rupee on set, accounted for.</Text>

        <Text style={styles.label} nativeID="roleLabel">
          Choose role
        </Text>
        <Pressable
          onPress={() => setOpen((o) => !o)}
          style={styles.select}
          accessibilityRole="button"
          accessibilityLabel={`Role: ${roleMeta[role].label}`}
          accessibilityState={{ expanded: open }}
        >
          <Text style={styles.selectText}>{sentence(roleMeta[role].label)}</Text>
          <Icon name="chevron-down" size={20} color={colors.onInk} strokeWidth={1.8} />
        </Pressable>
        {open ? (
          <View style={styles.options} accessibilityRole="radiogroup">
            {ROLES.map((r) => (
              <Pressable
                key={r}
                onPress={() => {
                  setRole(r);
                  setOpen(false);
                }}
                style={({ pressed }) => [styles.option, pressed && { backgroundColor: '#262626' }]}
                accessibilityRole="radio"
                accessibilityState={{ checked: r === role }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.optionTitle}>{sentence(roleMeta[r].label)}</Text>
                  <Text style={styles.optionSub}>{sentence(roleMeta[r].blurb)}</Text>
                </View>
                {r === role ? <Icon name="check" size={18} color={colors.onInk} strokeWidth={2} /> : null}
              </Pressable>
            ))}
          </View>
        ) : null}

        <Pressable onPress={() => login(DEMO_USER[role])} style={({ pressed }) => [styles.signIn, pressed && { opacity: 0.85 }]} accessibilityRole="button">
          <Text style={styles.signInText}>Sign in</Text>
          <Icon name="chevron-right" size={18} color={colors.ink} strokeWidth={2} />
        </Pressable>
        <Text style={styles.footnote}>Demo sign-in. Phone OTP switches on with the cloud backend.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000000', overflow: 'hidden' },
  collage: { position: 'absolute', left: -46, top: -36, flexDirection: 'row', gap: 14, transform: [{ rotate: '-7deg' }] },
  column: { flex: 1, gap: 14 },
  tile: { height: 188, borderRadius: 22, overflow: 'hidden', backgroundColor: '#1A1A1A' },
  panel: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: space.xl, gap: 12 },
  title: { fontFamily: font.display, fontSize: 34, color: colors.onInk, textAlign: 'center', letterSpacing: -1 },
  tagline: { fontFamily: font.regular, fontSize: 15, color: '#A8A8A8', textAlign: 'center', marginBottom: 8 },
  label: { fontFamily: font.semibold, fontSize: 14, color: '#A8A8A8' },
  select: {
    height: 54,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#333333',
    backgroundColor: '#1C1C1C',
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectText: { fontFamily: font.medium, fontSize: 16, color: colors.onInk },
  options: { borderRadius: radius.md, borderWidth: 1, borderColor: '#333333', backgroundColor: '#161616', overflow: 'hidden' },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingVertical: 12 },
  optionTitle: { fontFamily: font.semibold, fontSize: 15.5, color: colors.onInk },
  optionSub: { fontFamily: font.regular, fontSize: 12.5, color: '#9A9A9A', marginTop: 2 },
  signIn: {
    height: 54,
    marginTop: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.onInk,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  signInText: { fontFamily: font.bold, fontSize: 16, color: colors.ink },
  footnote: { fontFamily: font.regular, fontSize: 12.5, color: '#8C8C8C', textAlign: 'center', marginTop: 4 },
});
