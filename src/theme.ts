import { Platform, ViewStyle } from 'react-native';
import { ExpenseStatus, Role } from './types';

// Monochrome glass palette: pure black canvas, white ink, frosted white surfaces.
// Semantic tokens (success, warning…) are kept for meaning but resolve to greys.
export const colors = {
  bg: '#000000',
  surface: 'rgba(255,255,255,0.07)',
  surfaceAlt: 'rgba(255,255,255,0.10)',
  surfaceStrong: 'rgba(255,255,255,0.16)',
  ink: '#FFFFFF',
  inkSoft: 'rgba(255,255,255,0.66)',
  inkMuted: 'rgba(255,255,255,0.40)',
  onInk: '#000000',
  onInkSoft: 'rgba(0,0,0,0.6)',
  line: 'rgba(255,255,255,0.14)',
  lineStrong: 'rgba(255,255,255,0.32)',
  track: 'rgba(255,255,255,0.10)',
  header: '#000000',
  brand: '#FFFFFF',
  brandSoft: 'rgba(255,255,255,0.12)',
  success: '#FFFFFF',
  successSoft: 'rgba(255,255,255,0.12)',
  danger: '#FFFFFF',
  dangerSoft: 'rgba(255,255,255,0.06)',
  warning: 'rgba(255,255,255,0.78)',
  warningSoft: 'rgba(255,255,255,0.10)',
  info: '#FFFFFF',
  infoSoft: 'rgba(255,255,255,0.10)',
  purple: 'rgba(255,255,255,0.88)',
  purpleSoft: 'rgba(255,255,255,0.10)',
  white: '#FFFFFF',
  black: '#000000',
};

export const radius = { sm: 10, md: 14, lg: 22, pill: 999 };
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };

// Frosted-glass layer. Web gets a real backdrop blur; native relies on translucency over the glow backdrop.
const blur = (px: number) => (Platform.OS === 'web' ? ({ backdropFilter: `blur(${px}px) saturate(140%)` } as ViewStyle) : null);

export const glass = (px = 24): ViewStyle => ({
  backgroundColor: colors.surface,
  borderWidth: 1,
  borderColor: colors.line,
  ...blur(px),
});

export const glassBar = (px = 30): ViewStyle => ({
  backgroundColor: 'rgba(10,10,10,0.68)',
  borderColor: colors.line,
  ...blur(px),
});

// Soft white glows on black that sit behind every screen, so the glass has something to frost.
export const backdrop: ViewStyle = {
  backgroundColor: colors.bg,
  backgroundImage:
    'radial-gradient(circle at 12% 4%, rgba(255,255,255,0.20) 0%, rgba(255,255,255,0) 42%), ' +
    'radial-gradient(circle at 95% 38%, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 38%), ' +
    'radial-gradient(circle at 30% 100%, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 45%)',
};

export const statusMeta: Record<ExpenseStatus, { label: string; fg: string; bg: string; border?: string }> = {
  submitted: { label: 'Pending', fg: colors.inkSoft, bg: 'transparent', border: colors.lineStrong },
  escalated: { label: 'With Producer', fg: colors.ink, bg: colors.surfaceAlt, border: colors.lineStrong },
  approved: { label: 'Approved', fg: colors.ink, bg: colors.surfaceStrong },
  rejected: { label: 'Rejected', fg: colors.inkMuted, bg: colors.dangerSoft },
  paid: { label: 'Paid', fg: colors.onInk, bg: colors.ink },
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
