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
    poster: require('../../assets/posters/bethlehem-kudumba-unit.png'),
  },
  {
    id: 'kantara',
    name: 'Kantara',
    kind: 'Film',
    kindLabel: 'Feature film',
    location: 'Kundapura, Karnataka',
    status: 'Shooting',
    budgetLabel: '₹16Cr',
    poster: require('../../assets/posters/kantara.webp'),
  },
  {
    id: 'big-dawgs',
    name: 'Big Dawgs',
    kind: 'Music video',
    kindLabel: 'Music video',
    location: 'Mumbai',
    status: 'Pre-production',
    budgetLabel: '₹38L',
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
