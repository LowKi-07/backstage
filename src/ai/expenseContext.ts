import { departmentSummary, managedDepartmentIds, projectSummary, sum, userName, deptName, isPending } from '../store/selectors';
import { AppState, User } from '../types';
import { formatINR, toISODate } from '../utils/format';

// Plain-text snapshot of the expense data the signed-in user is allowed to see, sent with each AI chat request.
// Crew see only their own bills, managers their departments, producers the whole production.
export function buildExpenseContext(state: AppState, user: User): string {
  const { project } = state;
  const deptIds =
    user.role === 'producer'
      ? state.departments.map((d) => d.id)
      : user.role === 'manager'
        ? managedDepartmentIds(state, user)
        : user.departmentIds;
  const expenses =
    user.role === 'crew'
      ? state.expenses.filter((e) => e.userId === user.id)
      : state.expenses.filter((e) => deptIds.includes(e.departmentId) || e.userId === user.id);

  const lines: string[] = [
    `Today: ${toISODate(new Date())}`,
    `Project: ${project.name} (${project.kind}), ${project.startDate} to ${project.endDate}`,
    `Signed in as: ${user.name}, ${user.title} (${user.role})`,
    `Expenses above ${formatINR(project.escalationThreshold)} need producer approval.`,
  ];

  if (user.role === 'producer') {
    const p = projectSummary(state);
    lines.push(
      '',
      'Production totals:',
      `total budget ${formatINR(p.totalBudget)}, allocated to departments ${formatINR(p.allocated)}, spent ${formatINR(p.spent)}, ` +
        `pending approval ${formatINR(p.pending)}, paid out ${formatINR(p.paid)}, remaining ${formatINR(p.remaining)}, ` +
        `day ${p.daysElapsed} of ${p.totalDays}, burn rate ${formatINR(Math.round(p.burnRate))}/day, projected total ${formatINR(Math.round(p.projectedTotal))}`,
    );
  }

  if (user.role !== 'crew') {
    lines.push('', 'Departments (budget | spent | pending | remaining):');
    for (const id of deptIds) {
      const s = departmentSummary(state, id);
      lines.push(`- ${deptName(state, id)}: ${formatINR(s.budget)} | ${formatINR(s.spent)} | ${formatINR(s.pending)} | ${formatINR(s.remaining)}`);
    }
    const requests = state.budgetRequests.filter((r) => deptIds.includes(r.departmentId));
    if (requests.length) {
      lines.push('', 'Budget increase requests (date | department | amount | status | reason):');
      for (const r of requests) {
        lines.push(`- ${r.createdAt.slice(0, 10)} | ${deptName(state, r.departmentId)} | ${formatINR(r.amount)} | ${r.status} | ${r.reason}`);
      }
    }
  }

  lines.push(
    '',
    `Expenses: ${expenses.length} bills, ${formatINR(sum(expenses))} in total, ${formatINR(sum(expenses.filter(isPending)))} pending.`,
    'id | date | submitted by | department | category | amount | status | description | vendor',
  );
  for (const e of expenses) {
    lines.push(
      [e.id, e.date, userName(state, e.userId), deptName(state, e.departmentId), e.category, formatINR(e.amount), e.status, e.description, e.vendor ?? '-'].join(
        ' | ',
      ),
    );
  }
  return lines.join('\n');
}
