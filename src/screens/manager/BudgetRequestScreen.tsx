import React, { useState } from 'react';
import { View } from 'react-native';
import { Icon } from '../../components/icons';
import { Text } from '../../components/Text';
import { Button, Chip, ChipRow, Field, Hero, Screen, SectionTitle } from '../../components/ui';
import { useNav } from '../../navigation/Nav';
import { departmentSummary } from '../../store/selectors';
import { useStore } from '../../store/Store';
import { colors, font, space } from '../../theme';
import { formatCompact } from '../../utils/format';

export function BudgetRequestScreen({ departmentId }: { departmentId?: string }) {
  const { state, currentUser, requestBudget } = useStore();
  const nav = useNav();
  const managed = state.departments.filter((d) => d.managerId === currentUser?.id);
  const [dept, setDept] = useState(departmentId ?? (managed.length === 1 ? managed[0].id : null));
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const s = dept ? departmentSummary(state, dept) : null;

  const submit = () => {
    const value = Number(amount);
    if (!dept) return setError('Pick a department.');
    if (!value || value <= 0) return setError('Enter the extra amount you need.');
    if (reason.trim().length < 10) return setError('Explain briefly why the extra budget is needed.');
    requestBudget(dept, value, reason);
    setDone(true);
  };

  if (done) {
    return (
      <Screen onBack={nav.pop}>
        <View style={{ alignItems: 'center', paddingTop: space.xl }}>
          <View style={{ width: 76, height: 76, borderRadius: 38, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="check" size={38} color={colors.onInk} strokeWidth={2} />
          </View>
          <Hero eyebrow="sent to the producer" lines={['request sent']} amount={Number(amount)} />
          <Text style={{ fontFamily: font.regular, fontSize: 14, color: colors.inkSoft, textAlign: 'center', lineHeight: 21 }}>
            The department budget goes up automatically once the producer approves it.
          </Text>
        </View>
        <Button label="Done" onPress={nav.pop} />
      </Screen>
    );
  }

  return (
    <Screen title="request budget" subtitle="sent to the producer for approval" onBack={nav.pop} footer={<Button label="Send request" icon="send" onPress={submit} />}>
      <SectionTitle title="department" />
      <ChipRow>
        {managed.map((d) => (
          <Chip key={d.id} label={d.name} active={dept === d.id} onPress={() => setDept(d.id)} />
        ))}
      </ChipRow>
      {s ? (
        <Text style={{ fontFamily: font.regular, color: colors.inkSoft, fontSize: 13.5 }}>
          {formatCompact(s.spent)} spent of {formatCompact(s.budget)} ({Math.round(s.pct * 100)}%) · {formatCompact(s.pending)} pending
        </Text>
      ) : null}
      <Field label="Extra amount (₹)" value={amount} onChangeText={(t) => setAmount(t.replace(/[^0-9]/g, ''))} keyboardType="number-pad" placeholder="e.g. 250000" />
      <Field
        label="Reason"
        value={reason}
        onChangeText={setReason}
        multiline
        placeholder="What changed, and why the current budget won’t cover it"
        style={{ minHeight: 110, textAlignVertical: 'top' }}
      />
      {error ? <Text style={{ fontFamily: font.medium, color: colors.negative }}>{error}</Text> : null}
    </Screen>
  );
}
