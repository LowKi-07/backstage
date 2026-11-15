import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Icon } from '../../components/icons';
import { planStyles, TaskRow } from '../../components/projectPlan';
import { Text } from '../../components/Text';
import { Avatar, Button, Chip, ChipRow, Field, Screen, Segmented } from '../../components/ui';
import { CREW_DEPARTMENTS, CREW_DIRECTORY, crewProfile } from '../../data/crew';
import { useNav } from '../../navigation/Nav';
import { useStore } from '../../store/Store';
import { colors, font, radius, space } from '../../theme';
import { PayrollSetup } from '../../types';
import { formatINR, formatShortDate, toISODate } from '../../utils/format';

export function payLabel(p?: PayrollSetup) {
  if (!p) return null;
  if (p.type === 'fixed') return `${formatINR(p.amount)} / ${p.period === 'day' ? 'day' : 'month'}`;
  return `${formatINR(p.amount)} / hour`;
}

// Projects › Crew tab: everyone on the unit grouped by department. Tap a person for their page.
export function CrewTab() {
  const { state } = useStore();
  const nav = useNav();
  return (
    <View style={{ gap: space.lg }}>
      {CREW_DEPARTMENTS.map((dept) => {
        const people = CREW_DIRECTORY.filter((c) => c.dept === dept);
        if (!people.length) return null;
        return (
          <View key={dept} style={{ gap: 6 }}>
            <View style={styles.deptHead}>
              <Text style={styles.deptName}>{dept.toUpperCase()}</Text>
              <Text style={styles.muted}>{people.length}</Text>
            </View>
            <View style={planStyles.card}>
              {people.map((c, i) => {
                const pay = payLabel(state.payroll?.[c.id]);
                return (
                  <Pressable
                    key={c.id}
                    onPress={() => nav.push({ name: 'crewMember', id: c.id })}
                    style={({ pressed }) => [styles.person, i > 0 && styles.divider, pressed && { opacity: 0.6 }]}
                    accessibilityRole="button"
                    accessibilityLabel={`${c.name}, ${c.title}`}
                  >
                    <Avatar name={c.name} size={40} />
                    <View style={{ flex: 1, gap: 3 }}>
                      <Text style={styles.name}>{c.name}</Text>
                      <Text style={styles.muted}>{c.title}</Text>
                    </View>
                    <Text style={[styles.muted, !pay && { color: colors.inkSoft }]}>{pay ?? 'No pay set'}</Text>
                    <Icon name="chevron-right" size={16} color={colors.inkMuted} />
                  </Pressable>
                );
              })}
            </View>
          </View>
        );
      })}
    </View>
  );
}

// A crew member's page: who they are, their pay, their tasks and their biodata.
export function CrewMemberScreen({ id }: { id: string }) {
  const { state, toggleTask } = useStore();
  const nav = useNav();
  const c = crewProfile(id);
  if (!c) return null;
  const pay = state.payroll?.[id];
  const tasks = state.tasks.filter((t) => t.assigneeId === id).sort((a, b) => a.due.localeCompare(b.due));
  const open = tasks.filter((t) => t.status === 'todo');
  const bio: [string, string][] = [
    ['Phone', c.phone],
    ['Email', c.email],
    ['Based in', c.city],
    ['On this unit since', c.joined],
    ['Experience', c.experience],
    ['Languages', c.languages],
    ['Emergency contact', c.emergency],
    ['Bank account', c.bank],
  ];
  return (
    <Screen onBack={nav.pop}>
      <View style={styles.hero}>
        <Avatar name={c.name} size={64} />
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={styles.heroName}>{c.name}</Text>
          <Text style={styles.muted}>
            {c.title} · {c.dept}
          </Text>
        </View>
      </View>

      <View style={styles.sectionRow}>
        <Text style={planStyles.section}>Payroll</Text>
        {pay ? (
          <Pressable onPress={() => nav.push({ name: 'payrollSetup', id })} style={styles.linkHit} accessibilityRole="link">
            <Text style={styles.link}>Edit</Text>
          </Pressable>
        ) : null}
      </View>
      {pay ? (
        <View style={[planStyles.card, { gap: 10 }]}>
          <Text style={styles.kicker}>{pay.type === 'fixed' ? 'FIXED SALARY' : 'PRO RATA · PER HOUR'}</Text>
          <Text style={styles.big}>{payLabel(pay)}</Text>
          {pay.type === 'hourly' ? (
            <Text style={styles.muted}>
              About {pay.hoursPerDay ?? 10} h a day ≈ {formatINR(pay.amount * (pay.hoursPerDay ?? 10))} per shoot day
              {pay.overtime ? ` · overtime ${formatINR(pay.overtime)}/h` : ''}
            </Text>
          ) : pay.overtime ? (
            <Text style={styles.muted}>Overtime {formatINR(pay.overtime)}/h</Text>
          ) : null}
          <Text style={styles.muted}>Starts {formatShortDate(pay.startDate)}</Text>
        </View>
      ) : (
        <View style={[planStyles.card, { gap: 12, alignItems: 'flex-start' }]}>
          <Text style={styles.muted}>No pay set up yet. Add a fixed salary or an hourly rate.</Text>
          <Button label="Add payroll" icon="plus" small onPress={() => nav.push({ name: 'payrollSetup', id })} />
        </View>
      )}

      <View style={styles.sectionRow}>
        <Text style={planStyles.section}>Tasks</Text>
        <Text style={styles.muted}>{tasks.length ? `${open.length} open · ${tasks.length - open.length} done` : ''}</Text>
      </View>
      <View style={planStyles.card}>
        {tasks.map((t, i) => (
          <View key={t.id} style={i > 0 ? styles.divider : null}>
            <TaskRow task={t} showAssignee onToggle={() => toggleTask(t.id)} />
          </View>
        ))}
        {tasks.length === 0 ? <Text style={[styles.muted, { paddingVertical: 8 }]}>No tasks assigned yet.</Text> : null}
      </View>

      <Text style={planStyles.section}>Biodata</Text>
      <View style={planStyles.card}>
        {bio.map(([k, v], i) => (
          <View key={k} style={[styles.bioRow, i > 0 && styles.divider]}>
            <Text style={styles.muted}>{k}</Text>
            <Text style={styles.bioVal}>{v}</Text>
          </View>
        ))}
      </View>
    </Screen>
  );
}

const nextMonth = () => {
  const d = new Date();
  return toISODate(new Date(d.getFullYear(), d.getMonth() + 1, 1));
};

// Add or edit a crew member's pay: a fixed salary (per month or per day) or pro rata at an hourly rate.
export function PayrollSetupScreen({ id }: { id: string }) {
  const { state, setPayroll } = useStore();
  const nav = useNav();
  const c = crewProfile(id);
  const cur = state.payroll?.[id];
  const [type, setType] = useState<'fixed' | 'hourly'>(cur?.type ?? 'fixed');
  const [amount, setAmount] = useState(cur ? String(cur.amount) : '');
  const [period, setPeriod] = useState<'month' | 'day'>(cur?.period ?? 'month');
  const [hours, setHours] = useState(String(cur?.hoursPerDay ?? 10));
  const [ot, setOt] = useState(cur?.overtime ? String(cur.overtime) : '');
  const [start, setStart] = useState<'today' | 'next'>('today');
  const [err, setErr] = useState('');
  if (!c) return null;
  const n = Number(amount.replace(/[^0-9.]/g, ''));
  const h = Number(hours) || 0;
  const estimate = n > 0 ? (type === 'fixed' ? (period === 'month' ? `${formatINR(n)} a month` : `${formatINR(n)} a shoot day · about ${formatINR(n * 26)} for 26 days`) : `${formatINR(n * h)} a ${h}-hour day · about ${formatINR(n * h * 26)} for 26 days`) : null;

  const save = () => {
    if (!(n > 0)) return setErr(type === 'fixed' ? 'Enter the salary amount.' : 'Enter the hourly rate.');
    if (type === 'hourly' && !(h > 0)) return setErr('Enter the usual hours per day.');
    setPayroll(id, {
      type,
      amount: n,
      period: type === 'fixed' ? period : undefined,
      hoursPerDay: type === 'hourly' ? h : undefined,
      overtime: Number(ot) > 0 ? Number(ot) : undefined,
      startDate: start === 'today' ? toISODate(new Date()) : nextMonth(),
    });
    nav.pop();
  };

  return (
    <Screen title={cur ? 'Edit payroll' : 'Add payroll'} subtitle={`${c.name} · ${c.title}`} onBack={nav.pop} footer={<Button label="Save payroll" onPress={save} />}>
      <Segmented
        options={[
          { key: 'fixed', label: 'Fixed salary' },
          { key: 'hourly', label: 'Pro rata · per hour' },
        ]}
        value={type}
        onChange={(t) => {
          setType(t);
          setErr('');
        }}
      />
      {type === 'fixed' ? (
        <>
          <Field label="Salary (₹)" value={amount} onChangeText={(v) => (setAmount(v), setErr(''))} keyboardType="numeric" placeholder="e.g. 85000" error={err || undefined} />
          <Text style={styles.label}>Paid</Text>
          <ChipRow>
            <Chip label="Per month" active={period === 'month'} onPress={() => setPeriod('month')} />
            <Chip label="Per shoot day" active={period === 'day'} onPress={() => setPeriod('day')} />
          </ChipRow>
        </>
      ) : (
        <>
          <Field label="Rate per hour (₹)" value={amount} onChangeText={(v) => (setAmount(v), setErr(''))} keyboardType="numeric" placeholder="e.g. 450" error={err || undefined} />
          <Field label="Usual hours per day" value={hours} onChangeText={setHours} keyboardType="numeric" hint="Used for the estimate; pay follows hours logged." />
        </>
      )}
      <Field label="Overtime rate per hour (₹, optional)" value={ot} onChangeText={setOt} keyboardType="numeric" placeholder="e.g. 600" />
      <Text style={styles.label}>Starts</Text>
      <ChipRow>
        <Chip label="Today" active={start === 'today'} onPress={() => setStart('today')} />
        <Chip label="1st of next month" active={start === 'next'} onPress={() => setStart('next')} />
      </ChipRow>
      {estimate ? (
        <View style={styles.estimate}>
          <Text style={styles.kicker}>ESTIMATE</Text>
          <Text style={styles.bioVal}>{estimate}</Text>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  muted: { fontFamily: font.regular, fontSize: 12.5, color: colors.inkMuted },
  deptHead: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 },
  deptName: { fontFamily: font.semibold, fontSize: 11, letterSpacing: 1.6, color: colors.inkMuted },
  person: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, minHeight: 56 },
  name: { fontFamily: font.semibold, fontSize: 14, color: colors.ink },
  divider: { borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  heroName: { fontFamily: font.display, fontSize: 22, color: colors.ink, letterSpacing: -0.5 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  linkHit: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 4 },
  link: { fontFamily: font.medium, fontSize: 13.5, color: colors.ink, textDecorationLine: 'underline' },
  kicker: { fontFamily: font.semibold, fontSize: 11, letterSpacing: 1.6, color: colors.inkMuted },
  big: { fontFamily: font.display, fontSize: 22, color: colors.ink, letterSpacing: -0.5 },
  bioRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 11 },
  bioVal: { fontFamily: font.semibold, fontSize: 13.5, color: colors.ink, textAlign: 'right', flexShrink: 1 },
  label: { fontFamily: font.semibold, fontSize: 13, color: colors.inkSoft },
  estimate: { gap: 4, padding: space.lg, borderRadius: radius.lg, backgroundColor: '#F6F6F6' },
});
