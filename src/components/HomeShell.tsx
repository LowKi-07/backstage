import React, { useRef, useState } from 'react';
import { Animated, Image, NativeScrollEvent, NativeSyntheticEvent, Platform, Pressable, ScrollView, ScrollViewInstance, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { PROJECTS, ProjectListing } from '../data/projects';
import { projectSummary } from '../store/selectors';
import { useStore } from '../store/Store';
import { colors, font, radius, space } from '../theme';
import { stageOf } from './projectPlan';
import { Text } from './Text';
import { AppHeader } from './ui';

const native = Platform.OS !== 'web';
const BG = '#0E0E0E';

// Home layout shared by crew and managers: a full-bleed project artwork carousel (about a third of the screen)
// and a white sheet below that follows the selected project and slides up to full screen on scroll.
export function HomeShell({ children }: { children: (listing: ProjectListing) => React.ReactNode }) {
  const { state, chooseProject } = useStore();
  const insets = useSafeAreaInsets();
  const { height: winH } = useWindowDimensions();
  const startIdx = Math.max(0, PROJECTS.findIndex((p) => p.id === state.selectedProjectId));
  const [idx, setIdx] = useState(startIdx);
  const [width, setWidth] = useState(0);
  const [viewport, setViewport] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const carousel = useRef<ScrollViewInstance>(null);
  const heroH = Math.round(Math.min(Math.max(winH * 0.35, 260), 340)) + insets.top;
  const summary = projectSummary(state);

  const select = (n: number) => {
    if (n === idx) return;
    setIdx(n);
    chooseProject(PROJECTS[n].id);
  };
  const onCarousel = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (width) select(Math.max(0, Math.min(PROJECTS.length - 1, Math.round(e.nativeEvent.contentOffset.x / width))));
  };
  const goTo = (n: number) => {
    carousel.current?.scrollTo({ x: n * width, animated: true });
    select(n);
  };

  return (
    <View style={styles.root} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <Animated.ScrollView
        onLayout={(e) => setViewport(e.nativeEvent.layout.height)}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: native,
          listener: (e: NativeSyntheticEvent<NativeScrollEvent>) => {
            const full = e.nativeEvent.contentOffset.y >= heroH - 4;
            if (full !== expanded) setExpanded(full);
          },
        })}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {/* Artwork carousel, pinned while the sheet scrolls over it. */}
        <Animated.View style={{ height: heroH, zIndex: 0, transform: [{ translateY: scrollY }] }}>
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
                const day = pr.id === 'proj1' ? `Day ${summary.daysElapsed} of ${summary.totalDays}` : pr.schedule;
                return (
                  <Pressable key={pr.id} style={{ width, height: heroH }} accessibilityLabel={`${pr.name}, ${stageOf(state, pr)}, ${pr.location}`}>
                    <Image source={pr.poster} style={{ position: 'absolute', left: 0, top: 0, width, height: heroH }} resizeMode="cover" />
                    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" pointerEvents="none">
                      <Defs>
                        <LinearGradient id={`fade-${pr.id}`} x1="0" y1="0" x2="0" y2="1">
                          <Stop offset="0" stopColor="#000000" stopOpacity={0.55} />
                          <Stop offset="0.28" stopColor="#000000" stopOpacity={0} />
                          <Stop offset="0.45" stopColor={BG} stopOpacity={0} />
                          <Stop offset="0.8" stopColor={BG} stopOpacity={0.85} />
                          <Stop offset="1" stopColor={BG} stopOpacity={1} />
                        </LinearGradient>
                      </Defs>
                      <Rect x="0" y="0" width="100%" height="100%" fill={`url(#fade-${pr.id})`} />
                    </Svg>
                    <View style={styles.caption}>
                      <View style={styles.stage}>
                        <View style={[styles.stageDot, { backgroundColor: stageOf(state, pr) === 'In shoot' ? colors.onInk : '#A8A8A8' }]} />
                        <Text style={styles.stageText}>{stageOf(state, pr)}</Text>
                      </View>
                      <Text style={styles.name} numberOfLines={2}>
                        {pr.name}
                      </Text>
                      <View style={styles.metaRow}>
                        <Text style={styles.meta}>{day}</Text>
                        <View style={styles.sep} />
                        <Text style={[styles.meta, { flexShrink: 1 }]} numberOfLines={1}>
                          {pr.location}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : null}
          <View style={styles.dots} pointerEvents="box-none">
            {PROJECTS.map((pr, n) => (
              <Pressable key={pr.id} onPress={() => goTo(n)} hitSlop={8} accessibilityLabel={`Show ${pr.name}`} accessibilityRole="button">
                <View style={[styles.dot, n === idx && styles.dotOn]} />
              </Pressable>
            ))}
          </View>
          <View style={[styles.header, { paddingTop: insets.top + space.sm }]} pointerEvents="box-none">
            <AppHeader dark search={false} />
          </View>
        </Animated.View>

        <View style={[styles.sheet, { minHeight: viewport || undefined }, expanded && { borderTopLeftRadius: 0, borderTopRightRadius: 0 }]}>
          <View style={styles.handle} />
          {children(PROJECTS[idx])}
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  header: { position: 'absolute', left: 0, right: 0, top: 0 },
  caption: { position: 'absolute', left: space.xl, right: space.xl, bottom: 36, gap: 6 },
  stage: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.16)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)' },
  stageDot: { width: 6, height: 6, borderRadius: 3 },
  stageText: { fontFamily: font.bold, fontSize: 12, color: colors.onInk, letterSpacing: 0.2 },
  name: { fontFamily: font.display, fontSize: 23, lineHeight: 27, color: colors.onInk, letterSpacing: -0.6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  meta: { fontFamily: font.semibold, fontSize: 14, color: '#D6D6D6' },
  sep: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#8C8C8C' },
  dots: { position: 'absolute', left: 0, right: 0, bottom: 14, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.35)' },
  dotOn: { width: 18, backgroundColor: colors.onInk },
  sheet: { zIndex: 1, backgroundColor: colors.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: space.xl, paddingTop: 10, paddingBottom: 32, gap: space.lg, boxShadow: '0 -8px 24px rgba(0,0,0,0.25)' },
  handle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: '#E2E2E2' },
});
