import React, { useState } from 'react';
import { Text } from 'react-native';
import { Button, Card, Chip, ChipRow, Field, Screen, SectionTitle } from '../../components/ui';
import { useNav } from '../../navigation/Nav';
import { departmentSummary } from '../../store/selectors';
import { useStore } from '../../store/Store';
import { colors } from '../../theme';
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
    if (!dept) return setError('Pick a department');
    if (!value || value <= 0) return setError('Enter the extra amount you need');
    if (reason.trim().length < 10) return setError('Explain briefly why the extra budget is needed');
    requestBudget(dept, value, reason);
    setDone(true);
  };

  if (done) {
    return (
      <Screen title="Request sent" onBack={nav.pop}>
        <Card>
          <Text style={{ fontSize: 15, color: colors.ink, lineHeight: 21 }}>
            Your request has gone to the producer. The department budget updates automatically once it’s approved.
          </Text>
        </Card>
        <Button label="Done" onPress={nav.pop} />
      </Screen>
    );
  }

  return (
    <Screen title="Request budget" subtitle="Sent to the producer" onBack={nav.pop} footer={<Button label="Send request" icon="paper-plane-outline" onPress={submit} />}>
      <SectionTitle title="Department" />
      <ChipRow>
        {managed.map((d) => (
          <Chip key={d.id} label={d.name} active={dept === d.id} onPress={() => setDept(d.id)} />
        ))}
      </ChipRow>
      {s ? (
        <Text style={{ color: colors.inkSoft, fontSize: 13 }}>
          Currently {formatCompact(s.spent)} spent of {formatCompact(s.budget)} ({Math.round(s.pct * 100)}%), {formatCompact(s.pending)} pending.
        </Text>
      ) : null}
      <Field label="Additional amount (₹)" value={amount} onChangeText={(t) => setAmount(t.replace(/[^0-9]/g, ''))} keyboardType="number-pad" placeholder="e.g. 250000" />
      <Field label="Reason" value={reason} onChangeText={setReason} multiline placeholder="What changed and why the current budget won’t cover it" style={{ minHeight: 100, textAlignVertical: 'top' }} />
      {error ? <Text style={{ color: colors.danger }}>{error}</Text> : null}
    </Screen>
  );
}
