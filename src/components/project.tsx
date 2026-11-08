import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { ProjectListing } from '../data/projects';
import { projectSummary } from '../store/selectors';
import { useStore } from '../store/Store';
import { colors, font, radius, shadow } from '../theme';
import { Icon } from './icons';
import { Text } from './Text';
import { tint } from './ui';

const statusColor: Record<ProjectListing['status'], string> = {
  Shooting: colors.positive,
  'Pre-production': colors.pending,
  'Post-production': colors.escalated,
};

function StatusPill({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.pill, { backgroundColor: tint(color) }]}>
      <View style={[styles.pillDot, { backgroundColor: color }]} />
      <Text style={[styles.pillText, { color }]}>{label}</Text>
    </View>
  );
}

// Compact "today on set" card at the top of a home screen: poster, title, schedule day and a detail line.
export function ProjectCard({ listing, detail, onPress }: { listing: ProjectListing; detail: React.ReactNode; onPress?: () => void }) {
  const { state } = useStore();
  const p = projectSummary(state);
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]} accessibilityRole="button">
      <Image source={listing.poster} style={styles.thumb} resizeMode="cover" accessibilityLabel={`${listing.name} poster`} />
      <View style={{ flex: 1, minWidth: 0, justifyContent: 'center', gap: 5 }}>
        <Text style={styles.title} numberOfLines={2}>
          {listing.name}
        </Text>
        <StatusPill label={`Day ${p.daysElapsed} of ${p.totalDays}`} color={colors.positive} />
        {detail}
      </View>
    </Pressable>
  );
}

// Large poster card on the project picker.
export function PosterCard({ listing, selected, onPress }: { listing: ProjectListing; selected?: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.posterCard, selected && styles.posterSelected, pressed && { opacity: 0.9 }]} accessibilityRole="button" accessibilityLabel={`Open ${listing.name}`}>
      <View style={styles.posterWrap}>
        <Image source={listing.poster} style={styles.posterImage} resizeMode="cover" />
        <View style={styles.posterArrow}>
          <Icon name="arrow-up-right" size={18} color={colors.onInk} strokeWidth={1.8} />
        </View>
      </View>
      <View style={{ paddingHorizontal: 8, paddingTop: 12, gap: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <StatusPill label={listing.status} color={statusColor[listing.status]} />
          {selected ? <Text style={styles.current}>Current</Text> : null}
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
          <Text style={styles.posterTitle} numberOfLines={1}>
            {listing.name}
          </Text>
          <Text style={styles.posterBudget}>{listing.budgetLabel}</Text>
        </View>
        <Text style={styles.meta}>
          {listing.kindLabel} · {listing.location}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', gap: 14, padding: 10, borderRadius: radius.lg, backgroundColor: colors.surface, boxShadow: shadow.soft },
  thumb: { width: 124, height: 100, borderRadius: radius.md },
  title: { fontFamily: font.display, fontSize: 15.5, lineHeight: 21, color: colors.ink, letterSpacing: -0.3 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill, alignSelf: 'flex-start' },
  pillDot: { width: 6, height: 6, borderRadius: 3 },
  pillText: { fontFamily: font.semibold, fontSize: 12 },
  meta: { fontFamily: font.regular, fontSize: 13.5, color: colors.inkSoft },
  posterCard: { borderRadius: radius.lg, backgroundColor: colors.surface, padding: 8, paddingBottom: 16, boxShadow: shadow.soft, borderWidth: 1.5, borderColor: 'transparent' },
  posterSelected: { borderColor: colors.ink },
  posterWrap: { height: 196, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.surfaceAlt },
  posterImage: { position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' },
  posterArrow: { position: 'absolute', right: 12, top: 12, width: 40, height: 40, borderRadius: 20, backgroundColor: colors.button, alignItems: 'center', justifyContent: 'center' },
  posterTitle: { flex: 1, fontFamily: font.bold, fontSize: 18, color: colors.ink, letterSpacing: -0.3 },
  posterBudget: { fontFamily: font.display, fontSize: 18, color: colors.ink },
  current: { fontFamily: font.semibold, fontSize: 13, color: colors.inkSoft },
});
