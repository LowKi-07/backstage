import { ExpenseStatus, Role } from './types';

// Light, minimal look: white canvas, near-black ink, soft grey tiles,
// one sans family (Plus Jakarta Sans) throughout, sentence-case labels.
export const colors = {
  bg: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceAlt: '#F7F7F7', // icon circles, quiet fills
  sunken: '#EFEFEF', // segmented-control track
  ink: '#141414',
  inkSoft: '#5E5E5E',
  inkMuted: '#9B9B9B',
  line: '#E8E8E8',
  lineSoft: '#F1F1F1',
  dash: '#D6D6D6',
  onInk: '#FFFFFF',
  button: '#161616',
  nav: '#000000',
  navInk: '#7C7C7C',
  track: '#EDEDED',
  // semantic
  positive: '#1F9D5C', // money coming in, healthy budgets
  pending: '#E08A1E', // waiting on a manager
  escalated: '#C2509E', // waiting on the producer
  negative: '#E2462F', // rejected, over budget
  badge: '#F03E2F',
  accentSoft: '#FDEEF4', // pink pill like a promo tag
  accentLine: '#F5C9DB',
  accentInk: '#C2366F',
};

export const font = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  display: 'PlusJakartaSans_800ExtraBold',
  // Till-receipt type for bill views.
  mono: 'IBMPlexMono_500Medium',
  monoBold: 'IBMPlexMono_700Bold',
};

export const radius = { sm: 10, md: 16, lg: 22, pill: 999 };
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 32 };

export const shadow = {
  soft: '0 4px 14px rgba(0,0,0,0.06)',
  raised: '0 6px 18px rgba(0,0,0,0.08)',
  button: '0 4px 10px rgba(0,0,0,0.18)',
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
