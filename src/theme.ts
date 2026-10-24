import { ExpenseStatus, Role } from './types';

export const colors = {
  bg: '#F4F2EE',
  surface: '#FFFFFF',
  surfaceAlt: '#FAF8F5',
  ink: '#1C1B19',
  inkSoft: '#69655D',
  inkMuted: '#9C978D',
  line: '#E7E3DB',
  header: '#1C1B19',
  brand: '#E5A13A',
  brandSoft: '#FBEFD9',
  success: '#2E8B57',
  successSoft: '#E2F3E9',
  danger: '#C4453B',
  dangerSoft: '#F9E4E2',
  warning: '#C27C0E',
  warningSoft: '#FCF0D9',
  info: '#3567A0',
  infoSoft: '#E3ECF7',
  purple: '#7149AE',
  purpleSoft: '#EEE7F8',
  white: '#FFFFFF',
};

export const radius = { sm: 8, md: 12, lg: 18, pill: 999 };
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };

export const statusMeta: Record<ExpenseStatus, { label: string; fg: string; bg: string }> = {
  submitted: { label: 'Pending', fg: colors.warning, bg: colors.warningSoft },
  escalated: { label: 'With Producer', fg: colors.purple, bg: colors.purpleSoft },
  approved: { label: 'Approved', fg: colors.info, bg: colors.infoSoft },
  rejected: { label: 'Rejected', fg: colors.danger, bg: colors.dangerSoft },
  paid: { label: 'Paid', fg: colors.success, bg: colors.successSoft },
};

export const roleMeta: Record<Role, { label: string; icon: string; blurb: string }> = {
  crew: {
    label: 'Crew Member',
    icon: 'person-outline',
    blurb: 'Log daily expenses with receipts and track your reimbursements.',
  },
  manager: {
    label: 'Team Manager',
    icon: 'people-outline',
    blurb: 'Review team expenses, approve spends and watch department budgets.',
  },
  producer: {
    label: 'Producer',
    icon: 'film-outline',
    blurb: 'See the whole production’s money at a glance and clear escalations.',
  },
};
