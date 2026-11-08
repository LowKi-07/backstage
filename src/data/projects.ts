import { ImageSourcePropType } from 'react-native';

export type ProjectKind = 'Film' | 'Series' | 'Music video';

export interface ProjectListing {
  id: string;
  name: string;
  kind: ProjectKind;
  kindLabel: string;
  location: string;
  status: 'Shooting' | 'Pre-production' | 'Post-production';
  budgetLabel: string;
  poster: ImageSourcePropType;
  // Shown on the crew home carousel.
  callTime: string;
  schedule: string;
  // Sample numbers for listings without expense data behind them.
  // Manager-home sample numbers for listings without data.
  managerSample?: { budget: number; spent: number; review: number; reviewCount: number; manage: string };
  sample?: { pending: number; pendingCount: number; received: number; txns: { icon: string; title: string; when: string; amount: number }[] };
}

// Projects shown on the "Pick a project" screen. Only 'proj1' has expense data behind it for now;
// the others are sample listings that open the same demo production.
export const PROJECTS: ProjectListing[] = [
  {
    id: 'proj1',
    name: 'Bethlehem Kudumba Unit',
    kind: 'Film',
    kindLabel: 'Feature film',
    location: 'Film City, Stage 4',
    status: 'Shooting',
    budgetLabel: '₹4.5Cr',
    callTime: '7:00 AM',
    schedule: '',
    poster: require('../../assets/posters/bethlehem-kudumba-unit.png'),
  },
  {
    id: 'kantara',
    name: 'Kantara',
    kind: 'Film',
    kindLabel: 'Feature film',
    location: 'Kundapura, forest unit',
    status: 'Shooting',
    budgetLabel: '₹16Cr',
    callTime: '6:00 AM',
    schedule: 'Day 41 of 150',
    managerSample: { budget: 16000000, spent: 3800000, review: 18250, reviewCount: 4, manage: 'Transport' },
    sample: {
      pending: 21300,
      pendingCount: 6,
      received: 46900,
      txns: [
        { icon: 'fuel', title: 'Diesel for generator truck', when: 'Yesterday', amount: -6600 },
        { icon: 'package', title: 'Bamboo and rope for set', when: '2 days ago', amount: -9250 },
        { icon: 'utensils', title: 'Village crew breakfast', when: '30 Oct', amount: 3400 },
      ],
    },
    poster: require('../../assets/posters/kantara.webp'),
  },
  {
    id: 'big-dawgs',
    name: 'Big Dawgs',
    kind: 'Music video',
    kindLabel: 'Music video',
    location: 'Mumbai, Andheri studio',
    status: 'Pre-production',
    budgetLabel: '₹38L',
    callTime: '10:00 AM',
    schedule: 'Shoot starts in 12 days',
    managerSample: { budget: 800000, spent: 120000, review: 3200, reviewCount: 1, manage: 'Costume' },
    sample: { pending: 3200, pendingCount: 1, received: 0, txns: [{ icon: 'shirt', title: 'Costume fabric samples', when: 'Today', amount: -3200 }] },
    poster: require('../../assets/posters/big-dawgs.webp'),
  },
];

// Posters for the sign-in collage, in display order.
export const COLLAGE: ImageSourcePropType[] = [
  require('../../assets/posters/f1.png'),
  require('../../assets/posters/retro.png'),
  require('../../assets/posters/raftaar.png'),
  require('../../assets/posters/kuthanthram.png'),
  require('../../assets/posters/dhurandhar.png'),
  require('../../assets/posters/big-dawgs.webp'),
];

export function projectListing(id: string | null | undefined): ProjectListing {
  return PROJECTS.find((p) => p.id === id) ?? PROJECTS[0];
}
