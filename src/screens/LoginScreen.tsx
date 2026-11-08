import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, Platform, Pressable, StyleSheet, View } from 'react-native';
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

const TILE = 188;
const GAP = 14;
const SET = 4 * (TILE + GAP); // one full set of four posters; the column shows it twice so the loop is seamless
const COLUMNS = [
  { posters: [0, 1, 4, 5], up: true, duration: 38000, offset: 0 },
  { posters: [2, 3, 0, 1], up: false, duration: 44000, offset: -120 },
  { posters: [4, 5, 2, 3], up: true, duration: 34000, offset: -60 },
];

function PosterColumn({ posters, up, duration, offset }: { posters: number[]; up: boolean; duration: number; offset: number }) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(t, { toValue: 1, duration, easing: Easing.linear, useNativeDriver: Platform.OS !== 'web' }));
    loop.start();
    return () => loop.stop();
  }, [t, duration]);
  const translateY = t.interpolate({ inputRange: [0, 1], outputRange: up ? [0, -SET] : [-SET, 0] });
  return (
    <View style={[styles.column, { marginTop: offset }]}>
      <Animated.View style={{ gap: GAP, transform: [{ translateY }] }}>
        {[...posters, ...posters].map((p, i) => (
          <View key={i} style={styles.tile}>
            <Image source={COLLAGE[p]} style={StyleSheet.absoluteFill} resizeMode="cover" />
          </View>
        ))}
      </Animated.View>
    </View>
  );
}

export function LoginScreen() {
  const { login } = useStore();
  const insets = useSafeAreaInsets();
  const [role, setRole] = useState<Role>('crew');
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.root}>
      {/* Straight poster columns that keep scrolling, alternating up and down, fading into black. */}
      <View pointerEvents="none" style={styles.collage}>
        {COLUMNS.map((col, i) => (
          <PosterColumn key={i} posters={col.posters} up={col.up} duration={col.duration} offset={col.offset} />
        ))}
      </View>
      <Svg pointerEvents="none" style={styles.fade} width="100%" height="100%">
        <Defs>
          <LinearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#000000" stopOpacity={0.1} />
            <Stop offset="0.45" stopColor="#000000" stopOpacity={0.3} />
            <Stop offset="0.8" stopColor="#000000" stopOpacity={0.8} />
            <Stop offset="1" stopColor="#000000" stopOpacity={1} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#fade)" />
      </Svg>

      <View style={[styles.panel, { paddingBottom: insets.bottom + 28 }]}>
        <Svg pointerEvents="none" style={styles.panelFade} width="100%" height="100%">
          <Defs>
            <LinearGradient id="panelFade" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#000000" stopOpacity={0} />
              <Stop offset="1" stopColor="#000000" stopOpacity={1} />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#panelFade)" />
        </Svg>
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
  collage: { position: 'absolute', left: 14, right: 14, top: 0, height: '58%', flexDirection: 'row', gap: 12, overflow: 'hidden' },
  column: { flex: 1, minWidth: 0 },
  tile: { height: TILE, borderRadius: 22, overflow: 'hidden', backgroundColor: '#1A1A1A' },
  fade: { position: 'absolute', left: 0, right: 0, top: 0, height: '58%' },
  panel: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: space.xl, paddingTop: 8, gap: 12, backgroundColor: '#000000' },
  panelFade: { position: 'absolute', left: 0, right: 0, top: -90, height: 90 },
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
