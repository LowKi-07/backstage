import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { PROJECTS, ProjectListing } from '../data/projects';
import { projectSummary, userName } from '../store/selectors';
import { useStore } from '../store/Store';
import { colors, font, radius, shadow, space } from '../theme';
import { AppState, ProjectStage, Task } from '../types';
import { formatShortDate, toISODate } from '../utils/format';
import { Composer } from './Composer';
import { Icon } from './icons';
import { Text } from './Text';

export const STAGES: ProjectStage[] = ['Pre-production', 'In shoot', 'Post-production', 'Wrapped'];
const DAY = 86400000;

export function stageOf(state: AppState, listing: ProjectListing): ProjectStage {
  return state.stages?.[listing.id] ?? (listing.status === 'Shooting' ? 'In shoot' : (listing.status as ProjectStage));
}

// "Day 41 of 150" style line for a project.
export function scheduleLine(state: AppState, listing: ProjectListing) {
  if (listing.id === 'proj1') {
    const p = projectSummary(state);
    return { text: `Day ${p.daysElapsed} of ${p.totalDays}`, progress: p.daysElapsed / p.totalDays };
  }
  const m = listing.schedule.match(/Day (\d+) of (\d+)/);
  return { text: listing.schedule, progress: m ? Number(m[1]) / Number(m[2]) : 0 };
}

// Phase dates for the timeline, worked out from today so the demo always looks current.
export function projectTimeline(state: AppState, listing: ProjectListing) {
  const today = new Date();
  const at = (n: number) => new Date(today.getTime() + n * DAY);
  let shootStart: Date;
  let shootEnd: Date;
  if (listing.id === 'proj1') {
    shootStart = new Date(state.project.startDate);
    shootEnd = new Date(state.project.endDate);
  } else if (listing.id === 'kantara') {
    shootStart = at(-40);
    shootEnd = at(109);
  } else {
    shootStart = at(12);
    shootEnd = at(16);
  }
  const plus = (d: Date, n: number) => new Date(d.getTime() + n * DAY);
  const phases = [
    { label: 'Pre-production', start: plus(shootStart, -60), end: shootStart },
    { label: 'Shoot', start: shootStart, end: shootEnd },
    { label: 'Post-production', start: shootEnd, end: plus(shootEnd, 90) },
    { label: 'Release', start: plus(shootEnd, 120), end: plus(shootEnd, 120) },
  ];
  return phases.map((p) => ({
    ...p,
    state: today > p.end ? ('done' as const) : today >= p.start ? ('now' as const) : ('next' as const),
    range: p.label === 'Release' ? formatShortDate(toISODate(p.start)) : `${formatShortDate(toISODate(p.start))} – ${formatShortDate(toISODate(p.end))}`,
  }));
}

// Poster chips to switch project.
export function ProjectSwitcher({ selectedId, onSelect }: { selectedId: string; onSelect: (id: string) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} style={{ flexGrow: 0 }}>
      {PROJECTS.map((p) => {
        const on = p.id === selectedId;
        return (
          <Pressable key={p.id} onPress={() => onSelect(p.id)} style={[styles.switch, on && styles.switchOn]} accessibilityRole="button" accessibilityState={{ selected: on }}>
            <Image source={p.poster} style={styles.switchImg} resizeMode="cover" />
            <Text style={[styles.switchText, on && { color: colors.onInk }]} numberOfLines={1}>
              {p.name}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

// Poster, name, stage, location and a schedule progress bar.
export function ProjectOverview({ listing }: { listing: ProjectListing }) {
  const { state } = useStore();
  const sched = scheduleLine(state, listing);
  return (
    <View style={styles.overview}>
      <Image source={listing.poster} style={styles.ovImg} resizeMode="cover" />
      <View style={{ flex: 1, gap: 4, justifyContent: 'center' }}>
        <Text style={styles.ovStage}>{stageOf(state, listing).toUpperCase()}</Text>
        <Text style={styles.ovName} numberOfLines={2}>
          {listing.name}
        </Text>
        <Text style={styles.muted} numberOfLines={1}>
          {listing.location}
        </Text>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${Math.round(Math.min(1, sched.progress) * 100)}%` }]} />
        </View>
        <Text style={styles.muted}>{sched.text}</Text>
      </View>
    </View>
  );
}

export function dueLabel(iso: string) {
  const today = toISODate(new Date());
  const tomorrow = toISODate(new Date(Date.now() + DAY));
  if (iso === today) return 'Today';
  if (iso === tomorrow) return 'Tomorrow';
  if (iso < today) return `Overdue · ${formatShortDate(iso)}`;
  return formatShortDate(iso);
}

// A task with a round checkbox; managers see who it's for, crew see who set it. Tap the comment link to
// open the thread and reply.
export function TaskRow({ task, showAssignee, onToggle }: { task: Task; showAssignee?: boolean; onToggle: () => void }) {
  const { state, addTaskComment } = useStore();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const done = task.status === 'done';
  const due = dueLabel(task.due);
  const overdue = !done && due.startsWith('Overdue');
  const who = showAssignee ? userName(state, task.assigneeId).split(' ')[0] : `from ${userName(state, task.assignedBy).split(' ')[0]}`;
  const comments = task.comments ?? [];
  return (
    <View style={styles.task}>
      <Pressable onPress={onToggle} hitSlop={10} style={[styles.check, done && styles.checkOn]} accessibilityRole="checkbox" accessibilityState={{ checked: done }} accessibilityLabel={task.title}>
        {done ? <Icon name="check" size={14} color={colors.onInk} strokeWidth={3} /> : null}
      </Pressable>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={[styles.taskTitle, done && styles.taskDone]}>{task.title}</Text>
        {task.note && !done ? <Text style={styles.muted}>{task.note}</Text> : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <Text style={[styles.taskMeta, overdue && { color: colors.negative }]}>
            {who} · {done ? 'Done' : due}
          </Text>
          <Pressable onPress={() => setOpen((o) => !o)} hitSlop={8} style={styles.cLink} accessibilityRole="button" accessibilityState={{ expanded: open }} accessibilityLabel={comments.length ? `${comments.length} comments` : 'Add a comment'}>
            <Icon name="comment" size={14} color={colors.inkSoft} />
            <Text style={styles.cLinkText}>{comments.length ? comments.length : 'Comment'}</Text>
          </Pressable>
        </View>
        {open ? (
          <View style={{ gap: 8, marginTop: 6 }}>
            {comments.map((c, i) => (
              <View key={i} style={styles.tComment}>
                <Text style={styles.taskMeta}>
                  {userName(state, c.byUserId).split(' ')[0]} · {formatShortDate(c.at.slice(0, 10))}
                </Text>
                <Text style={styles.tCommentText}>{c.text}</Text>
              </View>
            ))}
            <Composer
              compact
              value={draft}
              onChange={setDraft}
              placeholder={showAssignee ? 'Add a note for the crew' : 'Ask or update your manager'}
              label={`Comment on ${task.title}`}
              onSend={() => {
                addTaskComment(task.id, draft);
                setDraft('');
              }}
            />
          </View>
        ) : null}
      </View>
    </View>
  );
}

// Vertical timeline of the production phases with the current one highlighted.
export function Timeline({ listing }: { listing: ProjectListing }) {
  const { state } = useStore();
  const phases = projectTimeline(state, listing);
  return (
    <View style={styles.card}>
      {phases.map((p, i) => (
        <View key={p.label} style={styles.tlRow}>
          <View style={{ alignItems: 'center', width: 18 }}>
            <View style={[styles.tlDot, p.state === 'done' && styles.tlDone, p.state === 'now' && styles.tlNow]} />
            {i < phases.length - 1 ? <View style={[styles.tlLine, p.state === 'done' && { backgroundColor: colors.ink }]} /> : null}
          </View>
          <View style={{ flex: 1, gap: 2, paddingBottom: i < phases.length - 1 ? 18 : 0 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={[styles.tlLabel, p.state === 'next' && { color: colors.inkMuted }]}>{p.label}</Text>
              {p.state === 'now' ? (
                <View style={styles.nowPill}>
                  <Text style={styles.nowText}>Now</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.muted}>{p.range}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

export const planStyles = StyleSheet.create({
  section: { fontFamily: font.bold, fontSize: 16, color: colors.ink },
  card: { padding: space.lg, borderRadius: radius.lg, backgroundColor: colors.surface, boxShadow: shadow.soft },
});

const styles = StyleSheet.create({
  muted: { fontFamily: font.regular, fontSize: 13, color: colors.inkMuted },
  switch: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 4, paddingRight: 12, paddingVertical: 4, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, maxWidth: 200 },
  switchOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  switchImg: { width: 28, height: 28, borderRadius: 14 },
  switchText: { fontFamily: font.semibold, fontSize: 13, color: colors.inkSoft, flexShrink: 1 },
  overview: { flexDirection: 'row', gap: 14, padding: 10, borderRadius: radius.lg, backgroundColor: colors.surface, boxShadow: shadow.soft },
  ovImg: { width: 104, height: 120, borderRadius: radius.md },
  ovStage: { fontFamily: font.semibold, fontSize: 11, letterSpacing: 1.6, color: colors.inkMuted },
  ovName: { fontFamily: font.display, fontSize: 18, lineHeight: 22, color: colors.ink, letterSpacing: -0.3 },
  track: { height: 4, borderRadius: 2, backgroundColor: '#EDEDED', overflow: 'hidden', marginTop: 6 },
  fill: { height: 4, borderRadius: 2, backgroundColor: colors.ink },
  task: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, paddingVertical: 12 },
  check: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: '#CFCFCF', alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  checkOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  taskTitle: { fontFamily: font.medium, fontSize: 14.5, lineHeight: 20, color: colors.ink },
  taskDone: { color: colors.inkMuted, textDecorationLine: 'line-through' },
  cLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cLinkText: { fontFamily: font.medium, fontSize: 12, color: colors.inkSoft },
  tComment: { gap: 2, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, backgroundColor: '#F6F6F6' },
  tCommentText: { fontFamily: font.regular, fontSize: 13.5, lineHeight: 19, color: colors.ink },
  taskMeta: { fontFamily: font.regular, fontSize: 12.5, color: colors.inkMuted },
  card: { padding: space.lg, borderRadius: radius.lg, backgroundColor: colors.surface, boxShadow: shadow.soft },
  tlRow: { flexDirection: 'row', gap: 12 },
  tlDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: '#CFCFCF', backgroundColor: colors.surface, marginTop: 2 },
  tlDone: { backgroundColor: colors.ink, borderColor: colors.ink },
  tlNow: { borderColor: colors.ink, borderWidth: 4 },
  tlLine: { flex: 1, width: 2, backgroundColor: '#E2E2E2', marginTop: 2 },
  tlLabel: { fontFamily: font.semibold, fontSize: 14.5, color: colors.ink },
  nowPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.pill, backgroundColor: colors.ink },
  nowText: { fontFamily: font.bold, fontSize: 11, color: colors.onInk },
});
