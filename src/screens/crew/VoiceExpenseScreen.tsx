import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { Icon, LongArrow } from '../../components/icons';
import { Text, TextInput } from '../../components/Text';
import { useNav } from '../../navigation/Nav';
import { colors, font, radius, space } from '../../theme';
import { parseSpokenExpense } from '../../utils/parseExpense';

// Browser speech recognition (Chrome, Safari). Phones running the native build fall back to typing for now.
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
};
function createRecognition(): Recognition | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
}

const native = Platform.OS !== 'web';
const SIZE = 260;

// A soft cloud of dots, denser at the centre, split into four rings that breathe out of step.
function useRings() {
  return useMemo(() => {
    let seed = 7;
    const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
    const rings: { x: number; y: number; r: number; o: number }[][] = [[], [], [], []];
    for (let i = 0; i < 220; i++) {
      const a = rand() * Math.PI * 2;
      const d = Math.pow(rand(), 0.7) * 120;
      rings[Math.min(3, Math.floor(d / 30))].push({ x: 130 + Math.cos(a) * d, y: 130 + Math.sin(a) * d * 0.95, r: 0.9 + rand() * 1.6, o: 0.38 + (1 - d / 120) * 0.6 });
    }
    return rings;
  }, []);
}

const BREATH = [
  { amp: 0.16, ms: 350 },
  { amp: 0.11, ms: 450 },
  { amp: 0.08, ms: 400 },
  { amp: 0.05, ms: 550 },
];

function useLoop(make: () => Animated.CompositeAnimation, deps: unknown[]) {
  useEffect(() => {
    const a = make();
    a.start();
    return () => a.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

// Full-screen voice entry: a pulsing dot cloud, the words as they're heard, and one stop button.
export function VoiceExpenseScreen() {
  const nav = useNav();
  const insets = useSafeAreaInsets();
  const rings = useRings();
  const recognition = useRef<Recognition | null>(null);
  const [supported] = useState(() => createRecognition() !== null);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const typing = !supported || blocked;
  const speaking = listening && transcript.length > 0;

  const start = () => {
    const rec = createRecognition();
    if (!rec) return;
    recognition.current = rec;
    rec.lang = 'en-IN';
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e) => {
      let text = '';
      for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript;
      setTranscript(text.trim());
    };
    rec.onerror = (e) => {
      const denied = e.error === 'not-allowed' || e.error === 'service-not-allowed';
      if (denied) setBlocked(true);
      setError(denied ? 'Microphone access is blocked. Allow it in your browser settings, or type it below.' : 'Didn’t catch that. Tap the mic to try again.');
    };
    rec.onend = () => setListening(false);
    setError(null);
    setListening(true);
    try {
      rec.start();
    } catch {
      setListening(false);
    }
  };

  useEffect(() => {
    if (supported) start();
    return () => recognition.current?.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!listening) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [listening]);

  const finish = () => {
    recognition.current?.stop();
    setListening(false);
    const draft = transcript.trim() ? parseSpokenExpense(transcript) : { description: '' };
    nav.push({ name: 'reviewExpense', draft });
  };

  // Ring breathing: gentle while waiting, stronger once words are coming in.
  const breath = useRef(BREATH.map(() => new Animated.Value(0))).current;
  useLoop(
    () =>
      Animated.parallel(
        breath.map((v, i) => {
          const ms = (speaking ? 1 : 2.4) * BREATH[i].ms;
          return Animated.loop(
            Animated.sequence([
              Animated.timing(v, { toValue: 1, duration: ms, easing: Easing.inOut(Easing.ease), useNativeDriver: native }),
              Animated.timing(v, { toValue: 0, duration: ms, easing: Easing.inOut(Easing.ease), useNativeDriver: native }),
            ]),
          );
        }),
      ),
    [speaking],
  );
  const ripples = useRef([new Animated.Value(0), new Animated.Value(0)]).current;
  useLoop(
    () =>
      Animated.parallel(
        ripples.map((v, i) =>
          Animated.sequence([
            Animated.delay(i * 1200),
            Animated.loop(Animated.sequence([Animated.timing(v, { toValue: 1, duration: 2400, easing: Easing.out(Easing.quad), useNativeDriver: native }), Animated.timing(v, { toValue: 0, duration: 0, useNativeDriver: native })])),
          ]),
        ),
      ),
    [],
  );

  const words = transcript ? transcript.split(/\s+/) : [];
  const status = listening ? `Listening · ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}` : typing ? 'Type it' : 'Paused';

  return (
    <View style={styles.root}>
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <RadialGradient id="glow" cx="50%" cy="40%" r="70%">
            <Stop offset="0" stopColor="#CFCFCF" />
            <Stop offset="0.45" stopColor="#E6E6E6" />
            <Stop offset="1" stopColor="#F5F5F5" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#glow)" />
      </Svg>

      <View style={[styles.topBar, { paddingTop: insets.top + space.md }]}>
        <Pressable onPress={nav.pop} hitSlop={14} accessibilityLabel="Go back" accessibilityRole="button">
          <LongArrow />
        </Pressable>
        <View style={styles.statusPill}>
          <View style={[styles.statusDot, { backgroundColor: listening ? '#D7321F' : colors.inkMuted }]} />
          <Text style={styles.statusText}>{status}</Text>
        </View>
        <View style={{ width: 34 }} />
      </View>

      <View style={styles.middle}>
        <View style={styles.cloud}>
          {ripples.map((v, i) => (
            <Animated.View
              key={`r${i}`}
              pointerEvents="none"
              style={[
                styles.ripple,
                {
                  opacity: v.interpolate({ inputRange: [0, 1], outputRange: [listening ? 0.45 : 0, 0] }),
                  transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1.25] }) }],
                },
              ]}
            />
          ))}
          {rings.map((dots, i) => (
            <Animated.View
              key={i}
              pointerEvents="none"
              style={[StyleSheet.absoluteFill, { transform: [{ scale: breath[i].interpolate({ inputRange: [0, 1], outputRange: [1, 1 + (speaking ? BREATH[i].amp : BREATH[i].amp / 3)] }) }] }]}
            >
              <Svg width={SIZE} height={SIZE} viewBox="0 0 260 260">
                {dots.map((d, j) => (
                  <Circle key={j} cx={d.x} cy={d.y} r={d.r} fill="#2A2A2A" opacity={listening || typing ? d.o : d.o * 0.5} />
                ))}
              </Svg>
            </Animated.View>
          ))}
        </View>

        {typing ? (
          <View style={styles.typeBox}>
            <Text style={styles.typeLabel}>{supported ? 'Type what you’d say' : 'Voice needs the web app for now. Type what you’d say'}</Text>
            <TextInput
              value={transcript}
              onChangeText={setTranscript}
              placeholder="Diesel for the generator van, 2,450, IndianOil Aluva"
              multiline
              style={styles.input}
              accessibilityLabel="What you paid for, the amount and the vendor"
            />
          </View>
        ) : words.length ? (
          <Text style={styles.live} accessibilityLiveRegion="polite">
            {words.map((w, i) => (
              <Text key={i} style={{ color: i >= words.length - 3 ? colors.inkMuted : colors.ink }}>
                {w}{' '}
              </Text>
            ))}
            {listening ? <Text style={{ color: colors.ink }}>|</Text> : null}
          </Text>
        ) : (
          <Text style={styles.prompt}>
            Say <Text style={styles.promptStrong}>what you paid for</Text>, the amount and where you bought it.
          </Text>
        )}
        {error && !typing ? <Text style={styles.error}>{error}</Text> : null}
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + 48 }]}>
        {typing ? (
          <Pressable onPress={finish} disabled={!transcript.trim()} style={[styles.stop, !transcript.trim() && { opacity: 0.4 }]} accessibilityLabel="Review expense" accessibilityRole="button">
            <Icon name="chevron-right" size={30} color={colors.onInk} strokeWidth={2} />
          </Pressable>
        ) : listening ? (
          <Pressable onPress={finish} style={styles.stop} accessibilityLabel="Stop and review" accessibilityRole="button">
            <View style={styles.stopSquare} />
          </Pressable>
        ) : (
          <Pressable onPress={transcript ? finish : start} style={styles.stop} accessibilityLabel={transcript ? 'Review expense' : 'Record again'} accessibilityRole="button">
            <Icon name={transcript ? 'chevron-right' : 'mic'} size={28} color={colors.onInk} strokeWidth={1.8} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#EDEDED' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.xl },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.85)' },
  statusDot: { width: 9, height: 9, borderRadius: 5 },
  statusText: { fontFamily: font.semibold, fontSize: 13.5, color: colors.ink },
  middle: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 28, paddingHorizontal: 28 },
  cloud: { width: SIZE, height: SIZE },
  ripple: { position: 'absolute', left: 12, top: 12, width: SIZE - 24, height: SIZE - 24, borderRadius: SIZE, borderWidth: 1, borderColor: '#3A3A3A' },
  prompt: { textAlign: 'center', fontFamily: font.medium, fontSize: 22, lineHeight: 29, color: colors.inkSoft, letterSpacing: -0.5 },
  promptStrong: { fontFamily: font.display, color: colors.ink },
  live: { textAlign: 'center', fontFamily: font.bold, fontSize: 22, lineHeight: 29, letterSpacing: -0.5 },
  typeBox: { alignSelf: 'stretch', gap: 8 },
  typeLabel: { fontFamily: font.semibold, fontSize: 13.5, color: colors.inkSoft, textAlign: 'center' },
  input: { minHeight: 72, borderRadius: radius.md, backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 14, paddingVertical: 10, fontFamily: font.medium, fontSize: 14.5, textAlignVertical: 'top' },
  error: { fontFamily: font.medium, fontSize: 13.5, color: colors.negative, textAlign: 'center' },
  bottom: { alignItems: 'center' },
  stop: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.button, alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 10px rgba(22,22,22,0.10), 0 0 0 22px rgba(22,22,22,0.05), 0 8px 20px rgba(0,0,0,0.2)' },
  stopSquare: { width: 24, height: 24, borderRadius: 6, backgroundColor: colors.onInk },
});
