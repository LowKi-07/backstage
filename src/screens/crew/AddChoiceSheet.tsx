import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../../components/icons';
import { Text } from '../../components/Text';
import { NavApi } from '../../navigation/Nav';
import { colors, font, radius, shadow, space } from '../../theme';
import { pickImage } from '../../utils/pickImage';

// Bottom sheet behind the + button: speak it, scan the bill, or fill it in by hand.
export function AddChoiceSheet({ close, nav }: { close: () => void; nav: NavApi }) {
  const insets = useSafeAreaInsets();
  const [error, setError] = useState<string | null>(null);
  const voice = () => {
    close();
    nav.push({ name: 'voiceExpense' });
  };
  const manual = () => {
    close();
    nav.push({ name: 'reviewExpense', draft: { description: '' } });
  };
  const scan = async () => {
    setError(null);
    try {
      const uri = await pickImage('camera');
      if (!uri) return;
      close();
      nav.push({ name: 'reviewExpense', draft: { description: '', receiptUri: uri } });
    } catch (e) {
      setError((e as Error).message);
    }
  };
  return (
    <View style={[styles.sheet, { paddingBottom: insets.bottom + 24 }]} accessibilityViewIsModal>
      <View style={styles.handle} />
      <View style={{ gap: 4 }}>
        <Text style={styles.title} accessibilityRole="header">
          Add expense
        </Text>
        <Text style={styles.sub}>How would you like to log it?</Text>
      </View>
      <Option icon="mic" filled title="Speak it" detail="Say what you paid for and the amount. We fill in the form." onPress={voice} />
      <Option icon="scan" title="Scan receipt" detail="Photograph the bill, then check the amount and details." onPress={scan} />
      <Option icon="pen" title="Add manually" detail="Enter the amount, category and receipt yourself." onPress={manual} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable onPress={close} style={({ pressed }) => [styles.cancel, pressed && { opacity: 0.7 }]} accessibilityRole="button">
        <Text style={styles.cancelText}>Cancel</Text>
      </Pressable>
    </View>
  );
}

function Option({ icon, title, detail, filled, onPress }: { icon: string; title: string; detail: string; filled?: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.option, pressed && { opacity: 0.85 }]} accessibilityRole="button">
      <View style={[styles.optionIcon, filled && { backgroundColor: colors.button }]}>
        <Icon name={icon} size={24} color={filled ? colors.onInk : colors.ink} strokeWidth={1.6} />
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={styles.optionTitle}>{title}</Text>
        <Text style={styles.optionDetail}>{detail}</Text>
      </View>
      <Icon name="chevron-right" size={20} color={colors.inkMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sheet: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: space.xl,
    paddingTop: 12,
    gap: 14,
  },
  handle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: '#E2E2E2', marginBottom: 4 },
  title: { fontFamily: font.display, fontSize: 22, color: colors.ink, letterSpacing: -0.5 },
  sub: { fontFamily: font.regular, fontSize: 14.5, color: colors.inkSoft },
  option: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: space.lg, borderRadius: radius.lg, backgroundColor: colors.surface, boxShadow: shadow.raised },
  optionIcon: { width: 52, height: 52, borderRadius: 18, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  optionTitle: { fontFamily: font.bold, fontSize: 16.5, color: colors.ink },
  optionDetail: { fontFamily: font.regular, fontSize: 13.5, lineHeight: 18, color: colors.inkSoft },
  cancel: { height: 50, borderRadius: radius.pill, borderWidth: 1.5, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  error: { fontFamily: font.medium, fontSize: 13.5, color: colors.negative },
  cancelText: { fontFamily: font.bold, fontSize: 15.5, color: colors.ink },
});
