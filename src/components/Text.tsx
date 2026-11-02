import React from 'react';
import { Text as RNText, TextInput as RNTextInput, StyleSheet, TextProps, TextStyle } from 'react-native';
import { colors, font } from '../theme';

const byWeight: Record<string, string> = {
  '400': font.regular,
  normal: font.regular,
  '500': font.medium,
  '600': font.semibold,
  '700': font.bold,
  '800': font.display,
  bold: font.bold,
};

// Custom fonts ship one file per weight, so map fontWeight to the matching family
// instead of letting the platform fake a bold.
function resolve(style: TextProps['style']): TextStyle {
  const flat = StyleSheet.flatten(style) ?? {};
  if (flat.fontFamily) return flat;
  const { fontWeight, ...rest } = flat;
  return { ...rest, fontFamily: byWeight[String(fontWeight ?? '400')] ?? font.regular };
}

export function Text({ style, ...props }: TextProps) {
  return <RNText {...props} style={[{ color: colors.ink }, resolve(style)]} />;
}

// React 19 passes `ref` through as a normal prop, so no forwardRef is needed.
export function TextInput({ style, ...props }: React.ComponentProps<typeof RNTextInput>) {
  return <RNTextInput placeholderTextColor={colors.inkMuted} {...props} style={[{ color: colors.ink }, resolve(style)]} />;
}
