import { ExpenseStatus, Role } from './types';

// Light, airy look: cool off-white canvas, white cards, indigo brand accent,
// one sans family (Plus Jakarta Sans) throughout, sentence-case labels.
export const colors = {
  bg: '#F5F6FA',
  surface: '#FFFFFF',
  surfaceAlt: '#F1F2F7', // icon tiles, quiet fills
  sunken: '#E9EAF1', // segmented-control track
  ink: '#16172B',
  inkSoft: '#575A72',
  inkMuted: '#9497AB',
  line: '#E4E5EE',
  lineSoft: '#EEEFF5',
  dash: '#D7D9E4',
  onInk: '#FFFFFF',
  button: '#4A3AFF',
  nav: '#FFFFFF',
  navInk: '#9497AB',
  track: '#E9EAF1',
  // semantic
  positive: '#12A15F', // money coming in, healthy budgets
  pending: '#E08A1E', // waiting on a manager
  escalated: '#9B4DDB', // waiting on the producer
  negative: '#E2462F', // rejected, over budget
  badge: '#F03E2F',
  accent: '#4A3AFF',
  accentSoft: '#EEECFF',
  accentLine: '#D8D3FF',
  accentInk: '#3A2BE0',
};

export const font = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  display: 'PlusJakartaSans_800ExtraBold',
};

export const radius = { sm: 10, md: 16, lg: 22, pill: 999 };
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 32 };

export const shadow = {
  soft: '0 2px 10px rgba(22,23,43,0.05)',
  raised: '0 8px 24px rgba(22,23,43,0.08)',
  button: '0 6px 16px rgba(74,58,255,0.28)',
};

// Small sentence-case labels used for section headers and statuses.
export const label = { fontFamily: font.semibold, letterSpacing: 0.1 };

export const statusMeta: Record<ExpenseStatus, { label: string; color: string }> = {
  submitted: { label: 'Pending', color: colors.pending },
  escalated: { label: 'With producer', color: colors.escalated },
  approved: { label: 'Approved', color: colors.positive },
  rejected: { label: 'Rejected', color: colors.negative },
  paid: { label: 'Paid', color: colors.inkMuted },
};

export const roleMeta: Record<Role, { label: string; icon: string; blurb: string }> = {
  crew: {
    label: 'crew member',
    icon: 'user',
    blurb: 'log daily expenses with receipts and track reimbursements',
  },
  manager: {
    label: 'team manager',
    icon: 'users',
    blurb: 'approve team spends and keep department budgets on track',
  },
  producer: {
    label: 'producer',
    icon: 'clapperboard',
    blurb: 'see the production’s money at a glance and clear escalations',
  },
};
