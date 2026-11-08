// One file per icon so only the icons in use are bundled (the package index pulls in all of them).
import type { LucideIcon } from 'lucide-react-native';
import ArrowUp from 'lucide-react-native/icons/arrow-up';
import ArrowUpRight from 'lucide-react-native/icons/arrow-up-right';
import Banknote from 'lucide-react-native/icons/banknote';
import BedDouble from 'lucide-react-native/icons/bed-double';
import Bell from 'lucide-react-native/icons/bell';
import Brush from 'lucide-react-native/icons/brush';
import Calendar from 'lucide-react-native/icons/calendar';
import Camera from 'lucide-react-native/icons/camera';
import Car from 'lucide-react-native/icons/car';
import Check from 'lucide-react-native/icons/check';
import CheckCheck from 'lucide-react-native/icons/check-check';
import ChevronDown from 'lucide-react-native/icons/chevron-down';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import CircleAlert from 'lucide-react-native/icons/circle-alert';
import Clapperboard from 'lucide-react-native/icons/clapperboard';
import Clock from 'lucide-react-native/icons/clock';
import Ellipsis from 'lucide-react-native/icons/ellipsis';
import FileText from 'lucide-react-native/icons/file-text';
import Fuel from 'lucide-react-native/icons/fuel';
import Hammer from 'lucide-react-native/icons/hammer';
import Image from 'lucide-react-native/icons/image';
import Inbox from 'lucide-react-native/icons/inbox';
import IndianRupee from 'lucide-react-native/icons/indian-rupee';
import Info from 'lucide-react-native/icons/info';
import Layers from 'lucide-react-native/icons/layers';
import LogOut from 'lucide-react-native/icons/log-out';
import MapPin from 'lucide-react-native/icons/map-pin';
import Menu from 'lucide-react-native/icons/menu';
import Mic from 'lucide-react-native/icons/mic';
import Package from 'lucide-react-native/icons/package';
import Palette from 'lucide-react-native/icons/palette';
import PenLine from 'lucide-react-native/icons/pen-line';
import Phone from 'lucide-react-native/icons/phone';
import Plus from 'lucide-react-native/icons/plus';
import Printer from 'lucide-react-native/icons/printer';
import Receipt from 'lucide-react-native/icons/receipt';
import RotateCcw from 'lucide-react-native/icons/rotate-ccw';
import ScanLine from 'lucide-react-native/icons/scan-line';
import Search from 'lucide-react-native/icons/search';
import Send from 'lucide-react-native/icons/send';
import ShieldCheck from 'lucide-react-native/icons/shield-check';
import Shirt from 'lucide-react-native/icons/shirt';
import Sparkles from 'lucide-react-native/icons/sparkles';
import Trash2 from 'lucide-react-native/icons/trash';
import TrendingUp from 'lucide-react-native/icons/trending-up';
import User from 'lucide-react-native/icons/user';
import Users from 'lucide-react-native/icons/users';
import UtensilsCrossed from 'lucide-react-native/icons/utensils-crossed';
import Video from 'lucide-react-native/icons/video';
import Wallet from 'lucide-react-native/icons/wallet';
import X from 'lucide-react-native/icons/x';
import React, { useId } from 'react';
import Svg, { Circle, Defs, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { colors } from '../theme';

const LINE: Record<string, LucideIcon> = {
  'arrow-up': ArrowUp,
  'arrow-up-right': ArrowUpRight,
  banknote: Banknote,
  bed: BedDouble,
  bell: Bell,
  brush: Brush,
  calendar: Calendar,
  camera: Camera,
  car: Car,
  check: Check,
  'check-double': CheckCheck,
  'chevron-down': ChevronDown,
  'chevron-right': ChevronRight,
  alert: CircleAlert,
  clapperboard: Clapperboard,
  clock: Clock,
  ellipsis: Ellipsis,
  file: FileText,
  fuel: Fuel,
  hammer: Hammer,
  image: Image,
  inbox: Inbox,
  rupee: IndianRupee,
  info: Info,
  layers: Layers,
  logout: LogOut,
  'map-pin': MapPin,
  menu: Menu,
  mic: Mic,
  package: Package,
  palette: Palette,
  pen: PenLine,
  phone: Phone,
  plus: Plus,
  printer: Printer,
  receipt: Receipt,
  reset: RotateCcw,
  scan: ScanLine,
  search: Search,
  send: Send,
  shield: ShieldCheck,
  shirt: Shirt,
  sparkles: Sparkles,
  trash: Trash2,
  trending: TrendingUp,
  user: User,
  users: Users,
  utensils: UtensilsCrossed,
  video: Video,
  wallet: Wallet,
  close: X,
};

// Thin monoline icons, as used across tiles, rows and buttons.
export function Icon({ name, size = 22, color = colors.ink, strokeWidth = 1.5 }: { name: string; size?: number; color?: string; strokeWidth?: number }) {
  const Glyph = LINE[name] ?? Receipt;
  return <Glyph size={size} color={color} strokeWidth={strokeWidth} />;
}

// Long hairline arrow used for back buttons and "go" affordances.
export function LongArrow({ direction = 'left', width = 34, color = colors.ink }: { direction?: 'left' | 'right'; width?: number; color?: string }) {
  const d = direction === 'left' ? 'M33 8H2M2 8L8 2M2 8L8 14' : 'M1 8H32M32 8L26 2M32 8L26 14';
  return (
    <Svg width={width} height={(width * 16) / 34} viewBox="0 0 34 16" fill="none">
      <Path d={d} stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// Clapperboard with a "B" – the Backstage mark.
export function Logo({ size = 64, color = colors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <Path d="M14 33 L82 17 L85.5 30 L17.5 46 Z" stroke={color} strokeWidth={5} strokeLinejoin="round" />
      <Path d="M33 28.5 L41 41.5 M52 24 L60 37 M71 19.5 L78 31.5" stroke={color} strokeWidth={5} strokeLinecap="round" />
      <Rect x={16} y={46} width={70} height={42} rx={5} stroke={color} strokeWidth={5} />
      <Path
        d="M40 56 V78 M40 56 H52.5 a5.5 5.5 0 0 1 0 11 H40 M40 67 H54.5 a5.5 5.5 0 0 1 0 11 H40"
        stroke={color}
        strokeWidth={5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export type NavGlyphName = 'home' | 'receipt' | 'wallet' | 'grid' | 'sparkles';

// Bottom-bar glyphs: solid shapes with a metallic grey gradient, brighter when active.
export function NavGlyph({ name, active, size = 30 }: { name: NavGlyphName; active?: boolean; size?: number }) {
  const id = useId().replace(/:/g, '');
  const top = active ? '#FFFFFF' : '#9C9C9C';
  const bottom = active ? '#A9A9A9' : '#4C4C4C';
  const detail = active ? '#5C5C5C' : '#262626';
  const fill = `url(#g${id})`;
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Defs>
        <LinearGradient id={`g${id}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={top} />
          <Stop offset="1" stopColor={bottom} />
        </LinearGradient>
      </Defs>
      {name === 'home' ? (
        <>
          <Path d="M5.5 14.5 L16 5.5 L26.5 14.5 V26 a1.8 1.8 0 0 1 -1.8 1.8 H7.3 A1.8 1.8 0 0 1 5.5 26 Z" fill={fill} />
          <Path d="M13 27.8 V20.5 a1.2 1.2 0 0 1 1.2 -1.2 h3.6 a1.2 1.2 0 0 1 1.2 1.2 V27.8 Z" fill={detail} />
        </>
      ) : null}
      {name === 'receipt' ? (
        <>
          <Path d="M7 5.2 a1.2 1.2 0 0 1 1.2 -1.2 H23.8 a1.2 1.2 0 0 1 1.2 1.2 V28 L22 26 L19 28 L16 26 L13 28 L10 26 L7 28 Z" fill={fill} />
          <Rect x={10.5} y={9} width={11} height={2.2} rx={1.1} fill={detail} />
          <Rect x={10.5} y={13.6} width={11} height={2.2} rx={1.1} fill={detail} />
          <Rect x={10.5} y={18.2} width={6.5} height={2.2} rx={1.1} fill={detail} />
        </>
      ) : null}
      {name === 'wallet' ? (
        <>
          <Path d="M7 11.5 L21.5 6.2 a1.6 1.6 0 0 1 2.1 1.5 V11.5 Z" fill={detail} />
          <Rect x={4.5} y={10.5} width={23} height={16.5} rx={3} fill={fill} />
          <Rect x={19.5} y={15.5} width={9} height={6.5} rx={2.2} fill={detail} />
          <Circle cx={23.2} cy={18.75} r={1.3} fill={top} />
        </>
      ) : null}
      {name === 'grid' ? (
        <>
          <Rect x={5} y={5} width={10} height={10} rx={3} fill={fill} />
          <Rect x={17} y={5} width={10} height={10} rx={3} fill={fill} />
          <Rect x={5} y={17} width={10} height={10} rx={3} fill={fill} />
          <Rect x={17} y={17} width={10} height={10} rx={3} fill={detail} stroke={fill} strokeWidth={1.6} />
        </>
      ) : null}
      {name === 'sparkles' ? (
        <>
          <Path d="M13.5 6 Q14.6 15.4 24 16.5 Q14.6 17.6 13.5 27 Q12.4 17.6 3 16.5 Q12.4 15.4 13.5 6 Z" fill={fill} />
          <Path d="M24.5 3.5 Q25 7 28.5 7.5 Q25 8 24.5 11.5 Q24 8 20.5 7.5 Q24 7 24.5 3.5 Z" fill={fill} />
        </>
      ) : null}
    </Svg>
  );
}

// Soft radial light behind the active bottom-bar item.
export function NavGlow({ size = 64 }: { size?: number }) {
  const id = useId().replace(/:/g, '');
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" style={{ position: 'absolute' }} pointerEvents="none">
      <Defs>
        <RadialGradient id={`r${id}`} cx="32" cy="32" r="32" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.16} />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx={32} cy={32} r={32} fill={`url(#r${id})`} />
    </Svg>
  );
}

export function DashedLine({ color = colors.dash }: { color?: string }) {
  return (
    <Svg height={2} width="100%" style={{ flex: 1 }}>
      <Path d="M0 1 H2000" stroke={color} strokeWidth={1} strokeDasharray="4 4" />
    </Svg>
  );
}
