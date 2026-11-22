import React, { useRef, useState } from 'react';
import { Image, NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, ScrollViewInstance, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { PROJECTS, ProjectListing } from '../data/projects';
import { projectSummary } from '../store/selectors';
import { useStore } from '../store/Store';
import { colors, font, radius, space } from '../theme';
import { stageOf } from './projectPlan';
import { Text } from './Text';
import { Icon } from './icons';
import { AppHeader, Money } from './ui';

const BG = '#0A0A0A';
const TILES_H = 112;

export type PosterTile = { label: string; dot: string; value: string; hint: string; onPress?: () => void };

// Home for crew and managers: a tall poster carousel with the project's name, schedule and progress, and two
// headline figures on glass tiles over the poster's foot. White cards follow below.
// Either two glass tiles side by side (`tiles`), or any glass widgets (`overlay`, `overlayH` tall) over the poster's foot.
export function PosterHome({
  tiles,
  overlay,
  overlayH = TILES_H,
  children,
}: {
  tiles?: (listing: ProjectListing) => [PosterTile, PosterTile];
  overlay?: (listing: ProjectListing) => React.ReactNode;
  overlayH?: number;
  children: (listing: ProjectListing) => React.ReactNode;
}) {
  const { state, chooseProject } = useStore();
  const insets = useSafeAreaInsets();
  const { height: winH } = useWindowDimensions();
  const startIdx = Math.max(0, PROJECTS.findIndex((p) => p.id === state.selectedProjectId));
  const [idx, setIdx] = useState(startIdx);
  const [width, setWidth] = useState(0);
  const carousel = useRef<ScrollViewInstance>(null);
  const heroH = Math.round(Math.min(Math.max(winH * 0.56, 440), 520)) + (overlayH - TILES_H) + insets.top;
  const summary = projectSummary(state);
  const listing = PROJECTS[idx];
  const pair = tiles?.(listing);

  const select = (n: number) => {
    if (n === idx) return;
    setIdx(n);
    chooseProject(PROJECTS[n].id);
  };
  const onCarousel = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (width) select(Math.max(0, Math.min(PROJECTS.length - 1, Math.round(e.nativeEvent.contentOffset.x / width))));
  };

  return (
    <View style={styles.root} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: space.xl }}>
        <View style={{ height: heroH }}>
          {width ? (
            <ScrollView
              ref={carousel}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={onCarousel}
              scrollEventThrottle={32}
              contentOffset={{ x: startIdx * width, y: 0 }}
              style={StyleSheet.absoluteFill}
            >
              {PROJECTS.map((pr) => {
                const stage = stageOf(state, pr);
                const live = stage === 'In shoot';
                const days = pr.id === 'proj1' ? { at: summary.daysElapsed, of: summary.totalDays } : parseDays(pr.schedule);
                const pct = days ? Math.min(1, days.at / days.of) : 0;
                return (
                  <View key={pr.id} style={{ width, height: heroH }} accessibilityLabel={`${pr.name}, ${stage}, ${pr.location}`}>
                    <Image source={pr.poster} style={{ position: 'absolute', left: 0, top: 0, width, height: heroH }} resizeMode="cover" />
                    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" pointerEvents="none">
                      <Defs>
                        <LinearGradient id={`pf-${pr.id}`} x1="0" y1="0" x2="0" y2="1">
                          <Stop offset="0" stopColor="#000000" stopOpacity={0.5} />
                          <Stop offset="0.2" stopColor="#000000" stopOpacity={0} />
                          <Stop offset="0.42" stopColor="#000000" stopOpacity={0.05} />
                          <Stop offset="0.7" stopColor={BG} stopOpacity={0.7} />
                          <Stop offset="1" stopColor={BG} stopOpacity={1} />
                        </LinearGradient>
                      </Defs>
                      <Rect x="0" y="0" width="100%" height="100%" fill={`url(#pf-${pr.id})`} />
                    </Svg>
                    <View style={[styles.caption, { bottom: overlayH + 30 }]}>
                      <View style={styles.stage}>
                        <View style={[styles.stageDot, { backgroundColor: live ? '#3FD07F' : '#A8A8A8' }]} />
                        <Text style={styles.stageText}>{stage}</Text>
                      </View>
                      <Text style={styles.name} numberOfLines={2}>
                        {pr.name}
                      </Text>
                      <View style={styles.metaRow}>
                        <Icon name="map-pin" size={15} color={colors.onInk} />
                        <Text style={[styles.meta, { flexShrink: 1, marginLeft: -6 }]} numberOfLines={1}>
                          {pr.location}
                        </Text>
                        <View style={styles.sep} />
                        <Text style={styles.meta}>Call {pr.callTime}</Text>
                      </View>
                      {days ? (
                        <View style={{ gap: 8, marginTop: 4 }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={styles.small}>
                              Day {days.at} of {days.of}
                            </Text>
                            <Text style={styles.small}>{Math.round(pct * 100)}% shot</Text>
                          </View>
                          <View style={styles.track}>
                            <View style={[styles.fill, { width: `${Math.max(2, pct * 100)}%` }]} />
                          </View>
                        </View>
                      ) : pr.schedule ? (
                        <Text style={[styles.small, { marginTop: 2 }]}>{pr.schedule}</Text>
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          ) : null}

          <View style={[styles.header, { paddingTop: insets.top + space.sm }]} pointerEvents="box-none">
            <AppHeader dark search={false} />
          </View>

          <View style={[styles.tiles, { height: overlayH }, overlay ? { flexDirection: 'column' } : null]} pointerEvents="box-none">
            {overlay ? overlay(listing) : pair ? (
              <>
                <GlassTile {...pair[0]} />
                <GlassTile {...pair[1]} />
              </>
            ) : null}
          </View>
        </View>

        <View style={styles.cards}>{children(listing)}</View>
      </ScrollView>
    </View>
  );
}

function GlassTile({ label, dot, value, hint, onPress }: PosterTile) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [styles.tile, pressed && { opacity: 0.75 }]} accessibilityRole="button" accessibilityLabel={`${label} ${value}, ${hint}`}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
        <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: dot }} />
        <Text style={styles.tileLabel}>{label}</Text>
      </View>
      <Text style={styles.tileValue} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.tileHint}>{hint}</Text>
    </Pressable>
  );
}

// Frosted dark panel for widgets laid over the poster.
export function Glass({ style, children }: { style?: object; children: React.ReactNode }) {
  return <View style={[styles.glass, style]}>{children}</View>;
}

// White card with an uppercase kicker and an optional "View all" on the right.
export function HomeCard({ title, action, onAction, children }: { title: string; action?: string; onAction?: () => void; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <Text style={styles.cardTitle}>{title.toUpperCase()}</Text>
        {action && onAction ? (
          <Pressable onPress={onAction} hitSlop={10} accessibilityRole="link">
            <Text style={styles.cardAction}>{action}</Text>
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}

// A transaction on a home card: bare category icon, title, sub line and amount (signed and green for money in).
export function HomeTxnRow({ icon, title, sub, amount, signed, onPress }: { icon: string; title: string; sub: string; amount: number; signed?: boolean; onPress?: () => void }) {
  const credit = signed && amount > 0;
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [styles.txn, pressed && { opacity: 0.6 }]} accessibilityRole="button">
      <View style={{ width: 28, alignItems: 'center' }}>
        <Icon name={icon} size={20} color={colors.ink} strokeWidth={1.6} />
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
        <Text style={styles.txnTitle} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.txnSub} numberOfLines={1}>
          {sub}
        </Text>
      </View>
      <Money value={amount} size={14.5} color={credit ? colors.positive : colors.ink} signed={signed} display />
    </Pressable>
  );
}

// "Day 41 of 150" → { at: 41, of: 150 }
function parseDays(schedule: string) {
  const m = /Day\s+(\d+)\s+of\s+(\d+)/i.exec(schedule);
  return m ? { at: Number(m[1]), of: Number(m[2]) } : null;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  header: { position: 'absolute', left: 0, right: 0, top: 0 },
  caption: { position: 'absolute', left: space.xl, right: space.xl, gap: 8 },
  stage: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: 'rgba(0,0,0,0.35)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)' },
  stageDot: { width: 6, height: 6, borderRadius: 3 },
  stageText: { fontFamily: font.bold, fontSize: 12, color: colors.onInk, letterSpacing: 0.2 },
  name: { fontFamily: font.display, fontSize: 32, lineHeight: 36, color: colors.onInk, letterSpacing: -0.8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  meta: { fontFamily: font.bold, fontSize: 14.5, color: colors.onInk },
  sep: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.onInk },
  small: { fontFamily: font.medium, fontSize: 13, color: '#E6E6E6' },
  track: { height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.75)', overflow: 'hidden' },
  fill: { height: 4, borderRadius: 2, backgroundColor: colors.positive },
  tiles: { position: 'absolute', left: space.xl, right: space.xl, bottom: 6, height: TILES_H, flexDirection: 'row', gap: 10 },
  glass: { padding: 16, borderRadius: 24, backgroundColor: 'rgba(18,18,18,0.62)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)' },
  tile: { flex: 1, padding: 16, borderRadius: 24, backgroundColor: 'rgba(18,18,18,0.62)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', gap: 6, justifyContent: 'center' },
  tileLabel: { fontFamily: font.semibold, fontSize: 13.5, color: '#D6D6D6' },
  tileValue: { fontFamily: font.display, fontSize: 22, letterSpacing: -0.5, color: colors.onInk },
  tileHint: { fontFamily: font.regular, fontSize: 12.5, color: '#A8A8A8' },
  txn: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 14 },
  txnTitle: { fontFamily: font.bold, fontSize: 14, color: colors.ink },
  txnSub: { fontFamily: font.regular, fontSize: 12.5, color: colors.inkMuted },
  cards: { paddingHorizontal: 16, paddingTop: 22, gap: 16 },
  card: { backgroundColor: colors.surface, borderRadius: 24, paddingHorizontal: 16, paddingTop: 18, paddingBottom: 18 },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardTitle: { fontFamily: font.semibold, fontSize: 12.5, letterSpacing: 1.4, color: '#7A7A7A' },
  cardAction: { fontFamily: font.semibold, fontSize: 13, color: colors.inkMuted },
});
