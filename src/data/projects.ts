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
  managerSample?: { budget: number; spent: number; review: number; reviewCount: number; manage: string; depts: { icon: string; name: string; budget: number; spent: number; pending: number }[] };
  sample?: { pending: number; pendingCount: number; received: number; txns: { icon: string; title: string; when: string; amount: number }[] };
}

// Projects shown on the home carousel and the "Pick a project" screen; the first is the default. Only 'proj1' has expense data behind it for now;
// the others are sample listings that open the same demo production.
export const PROJECTS: ProjectListing[] = [
  {
    id: 'kantara',
    name: 'Kantara',
    kind: 'Film',
    kindLabel: 'Feature film',
    location: 'Bangalore',
    status: 'Shooting',
    budgetLabel: '₹16Cr',
    callTime: '6:00 AM',
    schedule: 'Day 41 of 150',
    managerSample: {
      budget: 16000000,
      spent: 3800000,
      review: 18250,
      reviewCount: 4,
      manage: 'Transport',
      depts: [
        { icon: 'car', name: 'Transport', budget: 16000000, spent: 3800000, pending: 18250 },
        { icon: 'palette', name: 'Art', budget: 32000000, spent: 11000000, pending: 14050 },
        { icon: 'video', name: 'Camera & Lighting', budget: 55000000, spent: 19000000, pending: 0 },
        { icon: 'utensils', name: 'Catering', budget: 18000000, spent: 6100000, pending: 3400 },
        { icon: 'shirt', name: 'Costume', budget: 14000000, spent: 4200000, pending: 0 },
        { icon: 'map-pin', name: 'Locations', budget: 22000000, spent: 7400000, pending: 0 },
      ],
    },
    sample: {
      pending: 21300,
      pendingCount: 6,
      received: 46900,
      txns: [
        { icon: 'fuel', title: 'Diesel for generator truck', when: 'Yesterday', amount: -6600 },
        { icon: 'package', title: 'Bamboo and rope for set', when: '2 days ago', amount: -9250 },
        { icon: 'utensils', title: 'Village crew breakfast', when: '30 Oct', amount: 3400 },
        { icon: 'package', title: 'Brass lamps for shrine set', when: '29 Oct', amount: -4800 },
        { icon: 'fuel', title: 'Jeep fuel, forest unit', when: '28 Oct', amount: -2150 },
      ],
    },
    poster: require('../../assets/posters/kantara.webp'),
  },
  {
    id: 'proj1',
    name: 'Bethlehem Kudumba Unit',
    kind: 'Film',
    kindLabel: 'Feature film',
    location: 'Kochi',
    status: 'Shooting',
    budgetLabel: '₹4.5Cr',
    callTime: '7:00 AM',
    schedule: '',
    poster: require('../../assets/posters/bethlehem-kudumba-unit.png'),
  },
  {
    id: 'big-dawgs',
    name: 'Big Dawgs',
    kind: 'Music video',
    kindLabel: 'Music video',
    location: 'Mumbai',
    status: 'Pre-production',
    budgetLabel: '₹38L',
    callTime: '10:00 AM',
    schedule: 'Shoot starts in 12 days',
    managerSample: {
      budget: 800000,
      spent: 120000,
      review: 3200,
      reviewCount: 1,
      manage: 'Costume',
      depts: [
        { icon: 'shirt', name: 'Costume', budget: 800000, spent: 120000, pending: 3200 },
        { icon: 'video', name: 'Camera & Lighting', budget: 1200000, spent: 250000, pending: 0 },
        { icon: 'palette', name: 'Art', budget: 600000, spent: 90000, pending: 0 },
        { icon: 'map-pin', name: 'Locations', budget: 400000, spent: 60000, pending: 0 },
        { icon: 'brush', name: 'Makeup & Hair', budget: 200000, spent: 30000, pending: 0 },
      ],
    },
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

// Finished productions, shown under "Past" in the manager's All projects list.
export const PAST_PROJECTS: { id: string; name: string; kindLabel: string; location: string; wrapped: string; budgetLabel: string; budget: number; spent: number }[] = [
  { id: 'thira-kadal', name: 'Thira Kadal', kindLabel: 'Feature film', location: 'Kozhikode', wrapped: 'Wrapped Aug 2026', budgetLabel: '₹3.2Cr', budget: 32000000, spent: 30500000 },
  { id: 'night-bus-47', name: 'Night Bus 47', kindLabel: 'Web series · 6 episodes', location: 'Hyderabad', wrapped: 'Wrapped May 2026', budgetLabel: '₹1.1Cr', budget: 11000000, spent: 11400000 },
];

// Budget and spend for the All projects list (₹).
export const PROJECT_SPEND: Record<string, { budget: number; spent: number }> = {
  kantara: { budget: 160000000, spent: 38000000 },
  proj1: { budget: 45000000, spent: 12000000 },
  'big-dawgs': { budget: 3800000, spent: 120000 },
};
