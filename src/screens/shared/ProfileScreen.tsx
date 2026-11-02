import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../components/Text';
import { ActionRow, Avatar, Button, Screen, SectionTitle } from '../../components/ui';
import { useNav } from '../../navigation/Nav';
import { deptName, isPending, sum } from '../../store/selectors';
import { useStore } from '../../store/Store';
import { colors, font, label, roleMeta, space } from '../../theme';
import { formatDate, formatINR } from '../../utils/format';

export function ProfileScreen() {
  const { state, currentUser, logout, resetDemo } = useStore();
  const nav = useNav();
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  if (!currentUser) return null;

  const mine = state.expenses.filter((e) => e.userId === currentUser.id);
  const managed = state.departments.filter((d) => d.managerId === currentUser.id);
  const departments =
    currentUser.role === 'producer'
      ? 'All departments'
      : (currentUser.role === 'manager' ? managed.map((d) => d.name) : currentUser.departmentIds.map((id) => deptName(state, id))).join(', ');

  return (
    <Screen onBack={nav.pop}>
      <View style={styles.head}>
        <Avatar name={currentUser.name} size={88} ring />
        <Text style={styles.name}>{currentUser.name}</Text>
        <Text style={styles.role}>{roleMeta[currentUser.role].label}</Text>
        <Text style={styles.sub}>{currentUser.title}</Text>
      </View>

      <SectionTitle title="details" />
      <View>
        <Row label={currentUser.role === 'manager' ? 'manages' : 'department'} value={departments} />
        <Row label="phone" value={currentUser.phone} />
        <Row label="project" value={`${state.project.name} · ${state.project.kind}`} />
        <Row label="schedule" value={`${formatDate(state.project.startDate)} – ${formatDate(state.project.endDate)}`} />
        {currentUser.role !== 'producer' ? <Row label="my bills" value={`${mine.length} logged · ${formatINR(sum(mine.filter(isPending)))} pending`} /> : null}
      </View>

      <SectionTitle title="quick actions" />
      <ActionRow icon="reset" title="switch user" subtitle="sign in as another crew, manager or producer" onPress={logout} />
      {confirmReset ? (
        <View style={{ gap: space.sm }}>
          <Text style={styles.sub}>This replaces every expense on this device with the demo data.</Text>
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            <Button label="Cancel" variant="outline" small onPress={() => setConfirmReset(false)} style={{ flex: 1 }} />
            <Button
              label="Reset data"
              small
              onPress={() => {
                resetDemo();
                setConfirmReset(false);
                setResetDone(true);
              }}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      ) : (
        <ActionRow
          icon="trash"
          title="reset demo data"
          subtitle={resetDone ? 'demo data restored' : 'start over with the sample production'}
          onPress={() => setConfirmReset(true)}
          tone={colors.negative}
        />
      )}

      <SectionTitle title="security" />
      <Text style={styles.note}>
        Phone OTP sign-in, NDA signing and encrypted cloud sync arrive with the backend. Every approval and payment is already recorded in each expense’s audit trail.
      </Text>
    </Screen>
  );
}

function Row({ label: l, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{l}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { alignItems: 'center', gap: 6, paddingTop: space.sm },
  name: { fontFamily: font.serif, fontSize: 32, color: colors.ink, marginTop: space.sm },
  role: { ...label, fontSize: 12, letterSpacing: 2, color: colors.accentInk },
  sub: { fontFamily: font.regular, fontSize: 15, color: colors.inkSoft, textAlign: 'center' },
  row: { paddingVertical: 12, gap: 3, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  rowLabel: { ...label, fontSize: 10.5, letterSpacing: 1.6, color: colors.inkMuted },
  rowValue: { fontFamily: font.medium, fontSize: 16, color: colors.ink },
  note: { fontFamily: font.regular, fontSize: 14.5, color: colors.inkSoft, lineHeight: 20 },
});
