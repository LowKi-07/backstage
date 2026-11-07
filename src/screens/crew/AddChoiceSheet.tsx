import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../../components/icons';
import { Text } from '../../components/Text';
import { NavApi } from '../../navigation/Nav';
import { colors, font, radius, shadow, space } from '../../theme';

// Bottom sheet behind the + button: log an expense by voice or by typing it in.
export function AddChoiceSheet({ close, nav }: { close: () => void; nav: NavApi }) {
  const insets = useSafeAreaInsets();
  const go = (name: 'voiceExpense' | 'newExpense') => {
    close();
    nav.push({ name });
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
      <Option icon="mic" filled title="Speak it" detail="Say what you paid for and the amount. We fill in the form." onPress={() => go('voiceExpense')} />
      <Option icon="pen" title="Type it in" detail="Enter the amount, category and receipt yourself." onPress={() => go('newExpense')} />
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
  cancelText: { fontFamily: font.bold, fontSize: 15.5, color: colors.ink },
});
