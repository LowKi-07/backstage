import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useNav } from '../navigation/Nav';
import { userName } from '../store/selectors';
import { useStore } from '../store/Store';
import { colors, font, radius, space } from '../theme';
import { Expense } from '../types';
import { formatINR } from '../utils/format';
import { Icon } from './icons';
import { Text } from './Text';
import { Button } from './ui';

const native = Platform.OS !== 'web';
const GREEN = colors.positive;
const AnimatedPath = Animated.createAnimatedComponent(Path);
const CONFETTI = ['#1F9D5C', '#141414', '#5FD39A', '#BDBDBD'];

// Seeded burst so it looks the same every time.
function useConfetti() {
  return useMemo(() => {
    let seed = 11;
    const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
    return Array.from({ length: 22 }, (_, i) => {
      const a = (i / 22) * Math.PI * 2 + (rand() - 0.5) * 0.3;
      const d = 95 + rand() * 55;
      const w = [6, 8, 10][Math.floor(rand() * 3)];
      return { dx: Math.cos(a) * d, dy: Math.sin(a) * d, w, h: w < 10 && rand() > 0.5 ? 14 : w === 10 ? 4 : 6, round: rand() < 0.4, rot: (rand() - 0.5) * 520, color: CONFETTI[i % 4], delay: rand() * 120 };
    });
  }, []);
}

// "Expense submitted": a green tick that pops in, a confetti burst, then the amount and where it's gone.
export function SubmittedView({ expense, onAnother }: { expense: Expense; onAnother: () => void }) {
  const { state } = useStore();
  const nav = useNav();
  const insets = useSafeAreaInsets();
  const confetti = useConfetti();
  const pop = useRef(new Animated.Value(0)).current;
  const draw = useRef(new Animated.Value(24)).current;
  const burst = useRef(new Animated.Value(0)).current;
  const rings = useRef([new Animated.Value(0), new Animated.Value(0)]).current;
  const rise = useRef([0, 1, 2, 3].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.spring(pop, { toValue: 1, friction: 5, tension: 90, useNativeDriver: native }).start();
    Animated.timing(draw, { toValue: 0, duration: 450, delay: 400, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
    Animated.timing(burst, { toValue: 1, duration: 1100, delay: 250, easing: Easing.bezier(0.15, 0.7, 0.3, 1), useNativeDriver: native }).start();
    Animated.stagger(150, rise.map((v) => Animated.timing(v, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: native }))).start();
    const loops = rings.map((v, i) =>
      Animated.sequence([
        Animated.delay(900 + i * 1100),
        Animated.loop(Animated.sequence([Animated.timing(v, { toValue: 1, duration: 2200, easing: Easing.out(Easing.quad), useNativeDriver: native }), Animated.timing(v, { toValue: 0, duration: 0, useNativeDriver: native })])),
      ]),
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [pop, draw, burst, rings, rise]);

  const toProducer = expense.status === 'escalated';
  const dept = state.departments.find((d) => d.id === expense.departmentId);
  const who = toProducer ? 'the producer' : dept?.managerId ? `your manager, ${userName(state, dept.managerId).split(' ')[0]}` : 'your manager';
  const [whole, paise] = formatINR(expense.amount, { decimals: true }).split('.');
  const up = (v: Animated.Value) => ({ opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] });

  return (
    <View style={[styles.root, { paddingTop: insets.top + space.sm, paddingBottom: insets.bottom + space.lg }]}>
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" pointerEvents="none">
        <Defs>
          <RadialGradient id="okGlow" cx="50%" cy="34%" r="55%">
            <Stop offset="0" stopColor="#EAF7F0" />
            <Stop offset="1" stopColor="#FFFFFF" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#okGlow)" />
      </Svg>

      <Pressable onPress={() => nav.popToTab('home')} style={styles.close} accessibilityLabel="Close" accessibilityRole="button">
        <Icon name="close" size={17} strokeWidth={2} />
      </Pressable>

      <View style={styles.middle}>
        <View style={styles.badge}>
          {rings.map((v, i) => (
            <Animated.View
              key={i}
              pointerEvents="none"
              style={[styles.ring, { opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] }), transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.9] }) }] }]}
            />
          ))}
          <Animated.View style={[styles.halo, { transform: [{ scale: pop }] }]} />
          {confetti.map((c, i) => (
            <Animated.View
              key={i}
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: 100 - c.w / 2,
                top: 100 - c.h / 2,
                width: c.w,
                height: c.h,
                borderRadius: c.round ? c.w : 2,
                backgroundColor: c.color,
                opacity: burst.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 1, 0] }),
                transform: [
                  { translateX: burst.interpolate({ inputRange: [0, 1], outputRange: [0, c.dx] }) },
                  { translateY: burst.interpolate({ inputRange: [0, 1], outputRange: [0, c.dy] }) },
                  { rotate: burst.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${c.rot}deg`] }) },
                ],
              }}
            />
          ))}
          <Animated.View style={[styles.tick, { transform: [{ scale: pop }] }]}>
            <Svg width={56} height={56} viewBox="0 0 24 24">
              <AnimatedPath d="M5 12.5 10 17.5 19.5 7" fill="none" stroke="#FFFFFF" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="24" strokeDashoffset={draw} />
            </Svg>
          </Animated.View>
        </View>

        <Animated.View style={[{ alignItems: 'center', gap: 6 }, up(rise[0])]}>
          <Text style={styles.kicker}>Expense submitted</Text>
          <Text style={styles.amount} accessibilityLabel={formatINR(expense.amount)}>
            {whole}
            <Text style={[styles.amount, { color: '#BDBDBD' }]}>.{paise}</Text>
          </Text>
          <Text style={styles.what} numberOfLines={2}>
            {expense.description} · {expense.category}
          </Text>
        </Animated.View>

        <Animated.View style={[styles.sentPill, up(rise[1])]}>
          <View style={styles.sentDot} />
          <Text style={styles.sentText}>Sent to {who}</Text>
        </Animated.View>

        <Animated.View style={[styles.tracker, up(rise[2])]} accessibilityLabel="Submitted. Next: review, then paid.">
          <Step label="Submitted" state="done" />
          <View style={[styles.bar, { backgroundColor: GREEN }]} />
          <Step label="Review" state="now" />
          <View style={styles.bar} />
          <Step label="Paid" state="next" />
        </Animated.View>
      </View>

      <Animated.View style={[{ gap: 12, alignSelf: 'stretch' }, up(rise[3])]}>
        <Button label="Log another expense" onPress={onAnother} />
        <Button
          label="View expense"
          variant="outline"
          onPress={() => {
            nav.popToTab('home');
            nav.push({ name: 'expense', id: expense.id });
          }}
        />
      </Animated.View>
    </View>
  );
}

function Step({ label: text, state }: { label: string; state: 'done' | 'now' | 'next' }) {
  return (
    <View style={styles.step}>
      {state === 'done' ? (
        <View style={[styles.stepDot, { backgroundColor: GREEN, borderColor: GREEN }]}>
          <Icon name="check" size={14} color="#FFFFFF" strokeWidth={3} />
        </View>
      ) : (
        <View style={[styles.stepDot, state === 'now' && { borderColor: colors.ink }]}>{state === 'now' ? <View style={styles.nowDot} /> : null}</View>
      )}
      <Text style={[styles.stepText, state === 'done' && { fontFamily: font.bold, color: colors.ink }, state === 'next' && { color: colors.inkMuted }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: space.xl, alignItems: 'center' },
  close: { alignSelf: 'flex-end', width: 38, height: 38, borderRadius: 19, backgroundColor: '#F2F2F2', alignItems: 'center', justifyContent: 'center' },
  middle: { flex: 1, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', gap: 22 },
  badge: { width: 200, height: 200 },
  ring: { position: 'absolute', left: 40, top: 40, width: 120, height: 120, borderRadius: 60, borderWidth: 2, borderColor: GREEN },
  halo: { position: 'absolute', left: 22, top: 22, width: 156, height: 156, borderRadius: 78, backgroundColor: 'rgba(31,157,92,0.12)' },
  tick: { position: 'absolute', left: 44, top: 44, width: 112, height: 112, borderRadius: 56, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center', boxShadow: '0 14px 30px rgba(31,157,92,0.45)' },
  kicker: { fontFamily: font.semibold, fontSize: 15, color: colors.inkSoft },
  amount: { fontFamily: font.display, fontSize: 54, lineHeight: 62, letterSpacing: -2.5, color: colors.ink },
  what: { fontFamily: font.regular, fontSize: 14.5, color: colors.inkSoft, textAlign: 'center' },
  sentPill: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.pill, backgroundColor: colors.ink },
  sentDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#5FD39A' },
  sentText: { fontFamily: font.semibold, fontSize: 13.5, color: colors.onInk },
  tracker: { flexDirection: 'row', alignItems: 'flex-start', width: '100%', maxWidth: 300 },
  step: { width: 72, alignItems: 'center', gap: 6 },
  stepDot: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: '#E2E2E2', backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  nowDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.ink },
  stepText: { fontFamily: font.semibold, fontSize: 12, color: colors.inkSoft },
  bar: { flex: 1, height: 2, marginTop: 12, backgroundColor: '#E2E2E2' },
});
