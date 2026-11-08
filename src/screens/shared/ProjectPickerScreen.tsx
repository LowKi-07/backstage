import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { PosterCard } from '../../components/project';
import { Text } from '../../components/Text';
import { Chip, ChipRow, EmptyState, Screen } from '../../components/ui';
import { PROJECTS, ProjectKind } from '../../data/projects';
import { useNav } from '../../navigation/Nav';
import { useStore } from '../../store/Store';
import { colors, font, space } from '../../theme';

const FILTERS: ('All' | ProjectKind)[] = ['All', 'Film', 'Series', 'Music video'];

// "Pick a project": shown to crew after sign-in, as the crew Project tab, and from the header menu.
export function ProjectPickerScreen({ pushed }: { pushed?: boolean }) {
  const { state, currentUser, chooseProject } = useStore();
  const nav = useNav();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All');
  if (!currentUser) return null;

  const shown = PROJECTS.filter((p) => filter === 'All' || p.kind === filter);
  const open = (id: string) => {
    chooseProject(id);
    nav.popToTab('home');
  };

  return (
    <Screen onBack={pushed ? nav.pop : undefined}>
      <View style={{ gap: 6 }}>
        <View style={styles.eyebrowRow}>
          <View style={styles.dot} />
          <Text style={styles.eyebrow}>Hey {currentUser.name.split(' ')[0]}</Text>
        </View>
        <Text style={styles.title}>Pick a project</Text>
      </View>

      <ChipRow>
        {FILTERS.map((f) => (
          <Chip key={f} label={f} count={f === 'All' ? PROJECTS.length : undefined} active={filter === f} onPress={() => setFilter(f)} />
        ))}
      </ChipRow>

      {shown.length ? (
        <View style={{ gap: space.lg }}>
          {shown.map((p) => (
            <PosterCard key={p.id} listing={p} selected={state.selectedProjectId === p.id} onPress={() => open(p.id)} />
          ))}
        </View>
      ) : (
        <EmptyState icon="clapperboard" title="No projects here yet" message="Projects you’re added to appear in this list." />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.accentInk },
  eyebrow: { fontFamily: font.semibold, fontSize: 13, color: colors.accentInk },
  title: { fontFamily: font.display, fontSize: 24, color: colors.ink, letterSpacing: -0.6 },
});
