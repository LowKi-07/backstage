import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Svg, { Line, Path } from 'react-native-svg';
import { colors, font } from '../theme';
import { Text } from './Text';

export const PAPER = '#FFFDF8';
const RULE = '#BDBAB2';

// A row of small triangles: the torn edge of a till receipt.
function zigzag(width: number, teeth: number, pointing: 'up' | 'down') {
  const step = width / teeth;
  const base = pointing === 'down' ? 0 : 10;
  const tip = pointing === 'down' ? 10 : 0;
  let d = `M0 ${base}`;
  for (let i = 0; i < teeth; i++) d += ` L${((i + 0.5) * step).toFixed(1)} ${tip} L${((i + 1) * step).toFixed(1)} ${base}`;
  return `${d} Z`;
}
const EDGE_TOP = zigzag(360, 30, 'up');
const EDGE_BOTTOM = zigzag(360, 30, 'down');

function TornEdge({ position, color }: { position: 'top' | 'bottom'; color: string }) {
  return (
    <Svg width="100%" height={10} viewBox="0 0 360 10" preserveAspectRatio="none">
      <Path d={position === 'top' ? EDGE_TOP : EDGE_BOTTOM} fill={color} />
    </Svg>
  );
}

// Paper slip with torn edges; children are laid out as a column.
export function Receipt({ children, torn = 'both', color = PAPER, style }: { children: React.ReactNode; torn?: 'both' | 'bottom'; color?: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.wrap, style]}>
      {torn === 'both' ? <TornEdge position="top" color={color} /> : null}
      <View style={[styles.paper, { backgroundColor: color }, torn === 'bottom' && styles.squareTop]}>{children}</View>
      <TornEdge position="bottom" color={color} />
    </View>
  );
}

// Drawn as SVG because single-side dashed borders render solid on iOS.
export function DashedRule() {
  return (
    <Svg width="100%" height={2}>
      <Line x1="0" y1="1" x2="100%" y2="1" stroke={RULE} strokeWidth={1.5} strokeDasharray="5 4" />
    </Svg>
  );
}

// "Label ........ value" line in receipt type.
export function ReceiptRow({ label, value, valueColor, bold }: { label: string; value: string; valueColor?: string; bold?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, bold && { fontFamily: font.monoBold }, valueColor ? { color: valueColor } : null]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

export const receiptType = StyleSheet.create({
  heading: { fontFamily: font.monoBold, fontSize: 16, letterSpacing: 1.5, color: colors.ink, textAlign: 'center' },
  sub: { fontFamily: font.mono, fontSize: 12, color: colors.inkSoft, textAlign: 'center' },
  small: { fontFamily: font.mono, fontSize: 12, color: colors.inkSoft },
  body: { fontFamily: font.mono, fontSize: 13.5, color: colors.ink },
  total: { fontFamily: font.monoBold, fontSize: 28, color: colors.ink, letterSpacing: -1 },
});

const styles = StyleSheet.create({
  wrap: {},
  paper: { paddingHorizontal: 20, paddingVertical: 14, gap: 10 },
  squareTop: { borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  rowLabel: { fontFamily: font.mono, fontSize: 13, color: colors.inkSoft },
  rowValue: { fontFamily: font.mono, fontSize: 13, color: colors.ink, flexShrink: 1, textAlign: 'right' },
});
