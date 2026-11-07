import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { Icon, LongArrow } from '../../components/icons';
import { Text, TextInput } from '../../components/Text';
import { Button } from '../../components/ui';
import { useNav } from '../../navigation/Nav';
import { colors, font, radius, shadow, space } from '../../theme';
import { formatINR } from '../../utils/format';
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

// A soft cloud of dots, denser at the centre, seeded so it's the same every render.
function useDots() {
  return useMemo(() => {
    let seed = 7;
    const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
    return Array.from({ length: 200 }, () => {
      const a = rand() * Math.PI * 2;
      const d = Math.pow(rand(), 0.7) * 110;
      return { x: 120 + Math.cos(a) * d, y: 120 + Math.sin(a) * d, r: 0.8 + rand() * 1.5, o: 0.35 + (1 - d / 110) * 0.6 };
    });
  }, []);
}

export function VoiceExpenseScreen() {
  const nav = useNav();
  const insets = useSafeAreaInsets();
  const dots = useDots();
  const recognition = useRef<Recognition | null>(null);
  const [supported] = useState(() => createRecognition() !== null);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(false);
  const pulse = useRef(new Animated.Value(0)).current;

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
  const stop = () => {
    recognition.current?.stop();
    setListening(false);
  };

  useEffect(() => {
    if (supported) start();
    return () => recognition.current?.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!listening) {
      pulse.stopAnimation();
      pulse.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(pulse, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: Platform.OS !== 'web' }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [listening, pulse]);

  const draft = transcript ? parseSpokenExpense(transcript) : null;
  const done = !listening && !!transcript;
  const typing = !supported || blocked;
  const status = listening ? 'Listening' : done ? 'Got it' : typing ? 'Type it' : 'Paused';

  return (
    <View style={[styles.root, { paddingTop: insets.top + space.sm, paddingBottom: insets.bottom + space.md }]}>
      <View style={styles.topBar}>
        <Pressable onPress={nav.pop} hitSlop={14} accessibilityLabel="Go back" accessibilityRole="button">
          <LongArrow />
        </Pressable>
        <Text style={styles.topTitle}>Add by voice</Text>
        <View style={{ width: 34 }} />
      </View>

      <View style={styles.stage}>
        <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
          <Defs>
            <RadialGradient id="glow" cx="50%" cy="40%" r="65%">
              <Stop offset="0" stopColor="#CFCFCF" />
              <Stop offset="0.5" stopColor="#E6E6E6" />
              <Stop offset="1" stopColor="#F3F3F3" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#glow)" />
        </Svg>
        <View style={styles.statusPill}>
          <View style={[styles.statusDot, { backgroundColor: listening ? '#D7321F' : done ? colors.positive : colors.inkMuted }]} />
          <Text style={styles.statusText}>{status}</Text>
        </View>

        <Animated.View style={[styles.cloud, { transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) }] }]}>
          <Svg width={240} height={240} viewBox="0 0 240 240">
            {dots.map((d, i) => (
              <Circle key={i} cx={d.x} cy={d.y} r={d.r} fill="#3A3A3A" opacity={listening ? d.o : d.o * 0.5} />
            ))}
          </Svg>
        </Animated.View>

        <Text style={styles.prompt}>
          {done ? (
            <>
              <Text style={styles.promptStrong}>Got it.</Text> Check the details below.
            </>
          ) : (
            <>
              Say <Text style={styles.promptStrong}>what you paid for</Text>, the amount and where you bought it.
            </>
          )}
        </Text>

        <Pressable onPress={nav.pop} style={styles.cancel} accessibilityLabel="Cancel" accessibilityRole="button">
          <Icon name="close" size={24} strokeWidth={1.8} />
        </Pressable>
        {supported ? (
          <Pressable onPress={listening ? stop : start} style={styles.stop} accessibilityLabel={listening ? 'Stop recording' : 'Record again'} accessibilityRole="button">
            {listening ? <View style={styles.stopSquare} /> : <Icon name="mic" size={24} color={colors.onInk} strokeWidth={1.8} />}
          </Pressable>
        ) : null}
      </View>

      <View style={styles.sheet}>
        <View style={styles.handle} />
        {!typing ? (
          <>
            <Text style={styles.sheetLabel}>Heard so far</Text>
            <Text style={[styles.transcript, !transcript && { color: colors.inkMuted }]}>{transcript ? `“${transcript}”` : 'Start speaking…'}</Text>
          </>
        ) : (
          <>
            <Text style={styles.sheetLabel}>{supported ? 'Type what you’d say:' : 'Voice needs the web app for now. Type what you’d say:'}</Text>
            <TextInput
              value={transcript}
              onChangeText={setTranscript}
              placeholder="Diesel for the generator van, 2,450, IndianOil Aluva"
              multiline
              style={styles.input}
              accessibilityLabel="What you paid for, the amount and the vendor"
            />
          </>
        )}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {draft ? (
          <View style={styles.chips}>
            {draft.amount ? <Text style={styles.chip}>{formatINR(draft.amount)}</Text> : null}
            {draft.category ? <Text style={styles.chip}>{draft.category}</Text> : null}
            {draft.vendor ? <Text style={styles.chip}>{draft.vendor}</Text> : null}
          </View>
        ) : null}
        {draft && (done || typing) ? <Button label="Review & submit" onPress={() => nav.push({ name: 'reviewExpense', draft })} style={{ marginTop: 4 }} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: space.lg, gap: space.md },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4, minHeight: 40 },
  topTitle: { fontFamily: font.bold, fontSize: 16, color: colors.ink },
  stage: { flex: 1, minHeight: 360, borderRadius: 28, overflow: 'hidden', backgroundColor: '#ECECEC', alignItems: 'center', justifyContent: 'center' },
  statusPill: { position: 'absolute', left: 18, top: 18, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.85)' },
  statusDot: { width: 9, height: 9, borderRadius: 5 },
  statusText: { fontFamily: font.semibold, fontSize: 14.5, color: colors.ink },
  cloud: { marginTop: -40 },
  prompt: { position: 'absolute', left: 24, right: 24, bottom: 104, textAlign: 'center', fontFamily: font.medium, fontSize: 23, lineHeight: 30, color: colors.inkSoft, letterSpacing: -0.4 },
  promptStrong: { fontFamily: font.display, color: colors.ink },
  cancel: { position: 'absolute', left: 18, bottom: 18, width: 64, height: 64, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' },
  stop: { position: 'absolute', right: 18, bottom: 18, width: 64, height: 64, borderRadius: 20, backgroundColor: colors.button, alignItems: 'center', justifyContent: 'center' },
  stopSquare: { width: 20, height: 20, borderRadius: 5, backgroundColor: colors.onInk },
  sheet: { borderRadius: 26, backgroundColor: colors.surface, boxShadow: shadow.raised, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 16, gap: 10 },
  handle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: '#E2E2E2' },
  sheetLabel: { fontFamily: font.semibold, fontSize: 13, color: colors.inkSoft },
  transcript: { fontFamily: font.regular, fontSize: 15, lineHeight: 21, color: colors.ink },
  input: { minHeight: 64, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 14, paddingVertical: 10, fontFamily: font.medium, fontSize: 15, textAlignVertical: 'top' },
  error: { fontFamily: font.medium, fontSize: 13.5, color: colors.negative },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: colors.surfaceAlt, fontFamily: font.semibold, fontSize: 13, color: colors.ink, overflow: 'hidden' },
});
