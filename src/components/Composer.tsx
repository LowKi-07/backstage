import React from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { colors, font, shadow, space } from '../theme';
import { Icon } from './icons';
import { TextInput } from './Text';

// The pill-shaped input with a round send button, as used in Ask AI. Shared by every comment box.
export function Composer({
  value,
  onChange,
  onSend,
  placeholder,
  label,
  compact,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  placeholder: string;
  label: string;
  compact?: boolean;
}) {
  const off = !value.trim();
  const btn = compact ? 36 : 44;
  return (
    <View style={[styles.composer, compact && { borderRadius: 24, padding: 4, paddingLeft: 14, boxShadow: 'none' }]}>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        multiline
        maxLength={1000}
        onSubmitEditing={() => !off && onSend()}
        blurOnSubmit
        returnKeyType="send"
        style={[styles.input, compact && { fontSize: 13.5, paddingVertical: 8 }, Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null]}
        accessibilityLabel={label}
      />
      <Pressable onPress={onSend} disabled={off} style={[styles.send, { width: btn, height: btn, borderRadius: btn / 2 }, off && { opacity: 0.35 }]} accessibilityLabel="Send" accessibilityRole="button">
        <Icon name="arrow-up" size={compact ? 17 : 20} color={colors.onInk} strokeWidth={2} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: space.sm,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    padding: 6,
    paddingLeft: space.lg,
    boxShadow: shadow.raised,
  },
  input: { flex: 1, fontFamily: font.medium, color: colors.ink, fontSize: 15, maxHeight: 120, paddingVertical: 11 },
  send: { backgroundColor: colors.button, alignItems: 'center', justifyContent: 'center' },
});
