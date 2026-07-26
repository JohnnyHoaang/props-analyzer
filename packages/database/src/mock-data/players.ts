export interface PlayerFixture {
  id: string;
  teamId: string;
  fullName: string;
  position: 'PG' | 'SG' | 'SF' | 'PF' | 'C';
  height: number; // inches
  weight: number; // pounds
  active: boolean;
  imageUrl?: string | null;
}

/**
 * Three fictional players per team (18 total): one guard, one forward, one
 * center, so every mock game has a plausible mix of box-score lines.
 */
export const playerFixtures: PlayerFixture[] = [
  // Cascade Ironhawks
  {
    id: 'player-cascade-1',
    teamId: 'team-cascade',
    fullName: 'Deshawn Ortiz',
    position: 'PG',
    height: 74,
    weight: 190,
    active: true,
  },
  {
    id: 'player-cascade-2',
    teamId: 'team-cascade',
    fullName: 'Milo Andric',
    position: 'SF',
    height: 80,
    weight: 220,
    active: true,
  },
  {
    id: 'player-cascade-3',
    teamId: 'team-cascade',
    fullName: 'Toby Reinholt',
    position: 'C',
    height: 84,
    weight: 250,
    active: true,
  },
  // Meridian Comets
  {
    id: 'player-meridian-1',
    teamId: 'team-meridian',
    fullName: 'Quentin Yao',
    position: 'PG',
    height: 73,
    weight: 185,
    active: true,
  },
  {
    id: 'player-meridian-2',
    teamId: 'team-meridian',
    fullName: 'Baptiste Ferrand',
    position: 'SF',
    height: 79,
    weight: 215,
    active: true,
  },
  {
    id: 'player-meridian-3',
    teamId: 'team-meridian',
    fullName: 'Emeka Osei',
    position: 'C',
    height: 83,
    weight: 245,
    active: true,
  },
  // Sable Wolves
  {
    id: 'player-sable-1',
    teamId: 'team-sable',
    fullName: 'Jaylen Marchetti',
    position: 'SG',
    height: 76,
    weight: 200,
    active: true,
  },
  {
    id: 'player-sable-2',
    teamId: 'team-sable',
    fullName: 'Ronan Delgado',
    position: 'PF',
    height: 81,
    weight: 230,
    active: true,
  },
  {
    id: 'player-sable-3',
    teamId: 'team-sable',
    fullName: 'Casimir Novak',
    position: 'C',
    height: 85,
    weight: 255,
    active: true,
  },
  // Harborview Tide
  {
    id: 'player-harborview-1',
    teamId: 'team-harborview',
    fullName: 'Sylas Whitfield',
    position: 'PG',
    height: 75,
    weight: 188,
    active: true,
  },
  {
    id: 'player-harborview-2',
    teamId: 'team-harborview',
    fullName: 'Ambrose Kilcline',
    position: 'SF',
    height: 80,
    weight: 218,
    active: true,
  },
  {
    id: 'player-harborview-3',
    teamId: 'team-harborview',
    fullName: 'Desmond Achebe',
    position: 'C',
    height: 84,
    weight: 248,
    active: true,
  },
  // Redstone Miners
  {
    id: 'player-redstone-1',
    teamId: 'team-redstone',
    fullName: 'Kellan Voss',
    position: 'SG',
    height: 77,
    weight: 205,
    active: true,
  },
  {
    id: 'player-redstone-2',
    teamId: 'team-redstone',
    fullName: 'Nikolai Petrosyan',
    position: 'PF',
    height: 82,
    weight: 235,
    active: true,
  },
  {
    id: 'player-redstone-3',
    teamId: 'team-redstone',
    fullName: 'Theo Mabaso',
    position: 'C',
    height: 85,
    weight: 260,
    active: true,
  },
  // Lakeshore Sentinels
  {
    id: 'player-lakeshore-1',
    teamId: 'team-lakeshore',
    fullName: 'Riordan Cassidy',
    position: 'PG',
    height: 74,
    weight: 182,
    active: true,
  },
  {
    id: 'player-lakeshore-2',
    teamId: 'team-lakeshore',
    fullName: 'Amadou Traore',
    position: 'SF',
    height: 79,
    weight: 217,
    active: true,
  },
  {
    id: 'player-lakeshore-3',
    teamId: 'team-lakeshore',
    fullName: 'Bram Van Houten',
    position: 'C',
    height: 86,
    weight: 258,
    active: true,
  },
];
