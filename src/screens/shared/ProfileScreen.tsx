import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Avatar, Button, Card, Divider, Screen, SectionTitle } from '../../components/ui';
import { useNav } from '../../navigation/Nav';
import { deptName, isPending, sum } from '../../store/selectors';
import { useStore } from '../../store/Store';
import { colors, roleMeta, space } from '../../theme';
import { formatDate, formatINR } from '../../utils/format';

export function ProfileScreen({ embedded }: { embedded?: boolean }) {
  const { state, currentUser, logout, resetDemo } = useStore();
  const nav = useNav();
  const [confirmReset, setConfirmReset] = useState(false);
  if (!currentUser) return null;

  const mine = state.expenses.filter((e) => e.userId === currentUser.id);
  const managed = state.departments.filter((d) => d.managerId === currentUser.id);

  return (
    <Screen title="Profile" onBack={embedded ? undefined : nav.pop}>
      <Card style={{ alignItems: 'center', gap: space.sm, paddingVertical: space.xl }}>
        <Avatar name={currentUser.name} size={72} dark />
        <Text style={styles.name}>{currentUser.name}</Text>
        <Text style={styles.sub}>{currentUser.title}</Text>
        <Text style={styles.role}>{roleMeta[currentUser.role].label}</Text>
      </Card>

      <SectionTitle title="Details" />
      <Card>
        <Row label="Phone" value={currentUser.phone} />
        <Divider />
        <Row
          label={currentUser.role === 'manager' ? 'Manages' : 'Department'}
          value={
            currentUser.role === 'producer'
              ? 'All departments'
              : (currentUser.role === 'manager' ? managed.map((d) => d.name) : currentUser.departmentIds.map((id) => deptName(state, id))).join(', ')
          }
        />
        <Divider />
        <Row label="Project" value={`${state.project.name} (${state.project.kind})`} />
        <Divider />
        <Row label="Schedule" value={`${formatDate(state.project.startDate)} – ${formatDate(state.project.endDate)}`} />
        {currentUser.role !== 'producer' ? (
          <>
            <Divider />
            <Row label="My submissions" value={`${mine.length} · ${formatINR(sum(mine.filter(isPending)))} pending`} />
          </>
        ) : null}
      </Card>

      <SectionTitle title="Security" />
      <Card>
        <Text style={styles.note}>
          Phone OTP sign-in, NDA signing and end-to-end encrypted sync arrive with the cloud backend. Every approval and payment is already
          recorded in each expense’s audit trail.
        </Text>
      </Card>

      <Button label="Switch user" icon="swap-horizontal" variant="secondary" onPress={logout} />
      {confirmReset ? (
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <Button label="Cancel" variant="secondary" onPress={() => setConfirmReset(false)} style={{ flex: 1 }} />
          <Button
            label="Yes, reset"
            variant="danger"
            onPress={() => {
              resetDemo();
              setConfirmReset(false);
            }}
            style={{ flex: 1 }}
          />
        </View>
      ) : (
        <Button label="Reset demo data" icon="refresh" variant="ghost" onPress={() => setConfirmReset(true)} />
      )}
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ gap: 2 }}>
      <Text style={{ color: colors.inkSoft, fontSize: 12.5 }}>{label}</Text>
      <Text style={{ color: colors.ink, fontSize: 15, fontWeight: '500' }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  name: { fontSize: 22, fontWeight: '700', color: colors.ink },
  sub: { fontSize: 14, color: colors.inkSoft, textAlign: 'center' },
  role: { fontSize: 12, fontWeight: '700', color: colors.warning, textTransform: 'uppercase', letterSpacing: 0.6 },
  note: { fontSize: 13.5, color: colors.inkSoft, lineHeight: 19 },
});
