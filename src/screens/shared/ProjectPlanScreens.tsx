import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { planStyles, ProjectOverview, ProjectSwitcher, STAGES, stageOf, TaskRow, Timeline } from '../../components/projectPlan';
import { Text, TextInput } from '../../components/Text';
import { Avatar, Button, EmptyState, Screen } from '../../components/ui';
import { PROJECTS } from '../../data/projects';
import { managedDepartmentIds } from '../../store/selectors';
import { useStore } from '../../store/Store';
import { colors, font, radius, space } from '../../theme';
import { Task } from '../../types';
import { toISODate } from '../../utils/format';

const DAY = 86400000;
const DUE = [
  { label: 'Today', days: 0 },
  { label: 'Tomorrow', days: 1 },
  { label: 'In 3 days', days: 3 },
  { label: 'Next week', days: 7 },
];
const byDue = (a: Task, b: Task) => a.due.localeCompare(b.due);

function useProject() {
  const { state, chooseProject } = useStore();
  const listing = PROJECTS.find((p) => p.id === state.selectedProjectId) ?? PROJECTS[0];
  return { listing, select: chooseProject };
}

// Manager "Projects" tab: set the production stage, see the plan, and assign tasks to the crew.
export function ManagerProjectScreen() {
  const { state, currentUser, setStage, addTask, toggleTask } = useStore();
  const { listing, select } = useProject();
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [assignee, setAssignee] = useState<string | null>(null);
  const [due, setDue] = useState(1);
  const [show, setShow] = useState<'open' | 'done'>('open');
  const [flash, setFlash] = useState<string | null>(null);
  const [error, setError] = useState(false);
  if (!currentUser) return null;

  const deptIds = managedDepartmentIds(state, currentUser);
  const crew = state.users.filter((u) => u.role === 'crew' && u.departmentIds.some((d) => deptIds.includes(d)));
  const crewIds = crew.map((u) => u.id);
  const tasks = state.tasks.filter((t) => t.projectId === listing.id && (crewIds.includes(t.assigneeId) || t.assignedBy === currentUser.id)).sort(byDue);
  const open = tasks.filter((t) => t.status === 'todo');
  const done = tasks.filter((t) => t.status === 'done');
  const stage = stageOf(state, listing);
  const noOutline = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null;

  const assign = () => {
    if (title.trim().length < 3) {
      setError(true);
      return setFlash('Type what the task is first.');
    }
    if (!assignee) {
      setError(true);
      return setFlash('Pick a crew member to assign it to.');
    }
    addTask({ projectId: listing.id, title: title.trim(), note: note.trim() || undefined, assigneeId: assignee, due: toISODate(new Date(Date.now() + due * DAY)) });
    setError(false);
    setFlash(`Assigned to ${crew.find((c) => c.id === assignee)?.name.split(' ')[0]}. It's in their Project tab.`);
    setTitle('');
    setNote('');
    setAssignee(null);
    setShow('open');
  };

  return (
    <Screen title="Projects" subtitle="Status, timeline and tasks for your crew">
      <ProjectSwitcher selectedId={listing.id} onSelect={select} />
      <ProjectOverview listing={listing} />

      <Text style={planStyles.section}>Project status</Text>
      <View style={styles.stages} accessibilityRole="radiogroup">
        {STAGES.map((st) => {
          const on = st === stage;
          return (
            <Pressable key={st} onPress={() => setStage(listing.id, st)} style={[styles.stage, on && styles.stageOn]} accessibilityRole="radio" accessibilityState={{ checked: on }}>
              <Text style={[styles.stageText, on && { color: colors.onInk }]}>{st}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.headRow}>
        <Text style={planStyles.section}>Crew tasks</Text>
        <Text style={styles.muted}>
          {open.length} open · {done.length} done
        </Text>
      </View>
      <View style={[planStyles.card, { gap: space.md }]}>
        <Text style={styles.addTitle}>Add a task</Text>
        <TextInput
          value={title}
          onChangeText={(v) => {
            setTitle(v);
            setFlash(null);
            setError(false);
          }}
          placeholder="What needs doing? e.g. Dress the market set by 4 PM"
          style={[styles.input, noOutline]}
          accessibilityLabel="Task title"
        />
        <TextInput value={note} onChangeText={setNote} placeholder="Details (optional)" multiline style={[styles.input, { minHeight: 56, textAlignVertical: 'top' }, noOutline]} accessibilityLabel="Task details" />
        <Text style={styles.label}>Assign to</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} style={{ flexGrow: 0, marginHorizontal: -space.lg }} contentInset={{ left: 0 }}>
          <View style={{ width: space.lg - 8 }} />
          {crew.map((u) => {
            const on = u.id === assignee;
            return (
              <Pressable
                key={u.id}
                onPress={() => {
                  setAssignee(u.id);
                  setFlash(null);
                  setError(false);
                }}
                style={[styles.person, on && styles.personOn]}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
              >
                <Avatar name={u.name} size={30} />
                <View>
                  <Text style={[styles.personName, on && { color: colors.onInk }]}>{u.name.split(' ')[0]}</Text>
                  <Text style={[styles.personRole, on && { color: '#CFCFCF' }]} numberOfLines={1}>
                    {u.title}
                  </Text>
                </View>
              </Pressable>
            );
          })}
          <View style={{ width: space.lg - 8 }} />
        </ScrollView>
        <Text style={styles.label}>Due</Text>
        <View style={styles.dueRow}>
          {DUE.map((d) => (
            <Pressable key={d.label} onPress={() => setDue(d.days)} style={[styles.stage, d.days === due && styles.stageOn]} accessibilityRole="radio" accessibilityState={{ checked: d.days === due }}>
              <Text style={[styles.stageText, d.days === due && { color: colors.onInk }]}>{d.label}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={[styles.hint, error && { color: colors.negative }]}>
          {flash ?? (assignee ? `Assigning to ${crew.find((c) => c.id === assignee)?.name.split(' ')[0]} · due ${DUE.find((d) => d.days === due)?.label.toLowerCase()}` : 'Type the task, pick a crew member, then assign.')}
        </Text>
        <Button label="Assign task" onPress={assign} />
      </View>

      <View style={styles.dueRow}>
        {(['open', 'done'] as const).map((k) => (
          <Pressable key={k} onPress={() => setShow(k)} style={[styles.stage, show === k && styles.stageOn]} accessibilityRole="button" accessibilityState={{ selected: show === k }}>
            <Text style={[styles.stageText, show === k && { color: colors.onInk }]}>
              {k === 'open' ? `Open ${open.length}` : `Done ${done.length}`}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={planStyles.card}>
        {(show === 'open' ? open : done).map((t, i) => (
          <View key={t.id} style={i > 0 ? styles.divider : null}>
            <TaskRow task={t} showAssignee onToggle={() => toggleTask(t.id)} />
          </View>
        ))}
        {(show === 'open' ? open : done).length === 0 ? <EmptyState icon="check" title={show === 'open' ? 'No open tasks' : 'Nothing done yet'} message="Tasks you assign to your crew show up here." /> : null}
      </View>

      <Text style={planStyles.section}>Timeline</Text>
      <Timeline listing={listing} />
    </Screen>
  );
}

// Crew "Project" tab: today's tasks, what's coming up, and the project timeline.
export function CrewProjectScreen() {
  const { state, currentUser, toggleTask } = useStore();
  const { listing, select } = useProject();
  if (!currentUser) return null;

  const today = toISODate(new Date());
  const mine = state.tasks.filter((t) => t.projectId === listing.id && t.assigneeId === currentUser.id).sort(byDue);
  // Due today, plus anything overdue that's still open.
  const todays = mine.filter((t) => t.due === today || (t.due < today && t.status === 'todo'));
  const upcoming = mine.filter((t) => t.due > today);
  const leftToday = todays.filter((t) => t.status === 'todo').length;

  return (
    <Screen title="Project" subtitle="Your tasks and the shoot timeline">
      <ProjectSwitcher selectedId={listing.id} onSelect={select} />
      <ProjectOverview listing={listing} />

      <View style={styles.headRow}>
        <Text style={planStyles.section}>Today</Text>
        <Text style={styles.muted}>{todays.length ? (leftToday ? `${leftToday} left` : 'All done') : ''}</Text>
      </View>
      <View style={planStyles.card}>
        {todays.map((t, i) => (
          <View key={t.id} style={i > 0 ? styles.divider : null}>
            <TaskRow task={t} onToggle={() => toggleTask(t.id)} />
          </View>
        ))}
        {todays.length === 0 ? <Text style={[styles.muted, { paddingVertical: 8 }]}>Nothing assigned for today.</Text> : null}
      </View>

      <Text style={planStyles.section}>Upcoming</Text>
      <View style={planStyles.card}>
        {upcoming.map((t, i) => (
          <View key={t.id} style={i > 0 ? styles.divider : null}>
            <TaskRow task={t} onToggle={() => toggleTask(t.id)} />
          </View>
        ))}
        {upcoming.length === 0 ? <Text style={[styles.muted, { paddingVertical: 8 }]}>No upcoming tasks yet.</Text> : null}
      </View>

      <Text style={planStyles.section}>Timeline</Text>
      <Timeline listing={listing} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  muted: { fontFamily: font.regular, fontSize: 13, color: colors.inkMuted },
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stages: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stage: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface },
  stageOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  stageText: { fontFamily: font.semibold, fontSize: 13, color: colors.inkSoft },
  label: { fontFamily: font.semibold, fontSize: 13, color: colors.inkSoft },
  addTitle: { fontFamily: font.bold, fontSize: 15, color: colors.ink },
  hint: { fontFamily: font.regular, fontSize: 12.5, color: colors.inkMuted },
  input: { borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 14, paddingVertical: 11, fontFamily: font.regular, fontSize: 14.5, color: colors.ink },
  person: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 4, paddingRight: 12, paddingVertical: 4, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, maxWidth: '100%' },
  personOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  personName: { fontFamily: font.semibold, fontSize: 13.5, color: colors.ink },
  personRole: { fontFamily: font.regular, fontSize: 11.5, color: colors.inkMuted, maxWidth: 140 },
  dueRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  divider: { borderTopWidth: 1, borderTopColor: '#F0F0F0' },
});
