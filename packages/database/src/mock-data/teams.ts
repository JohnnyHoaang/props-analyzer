/**
 * Fictional teams used to seed the Phase 1 mock dataset. Names are
 * deliberately invented (not real NBA franchises) so this data can never be
 * mistaken for real provider data ahead of Phase 2's real integration.
 */
export interface TeamFixture {
  id: string;
  name: string;
  abbreviation: string;
  conference: 'EASTERN' | 'WESTERN';
  division: string;
}

export const teamFixtures: TeamFixture[] = [
  {
    id: 'team-cascade',
    name: 'Cascade Ironhawks',
    abbreviation: 'CAS',
    conference: 'WESTERN',
    division: 'Pacific',
  },
  {
    id: 'team-meridian',
    name: 'Meridian Comets',
    abbreviation: 'MER',
    conference: 'EASTERN',
    division: 'Atlantic',
  },
  {
    id: 'team-sable',
    name: 'Sable Wolves',
    abbreviation: 'SAB',
    conference: 'WESTERN',
    division: 'Southwest',
  },
  {
    id: 'team-harborview',
    name: 'Harborview Tide',
    abbreviation: 'HAR',
    conference: 'EASTERN',
    division: 'Central',
  },
  {
    id: 'team-redstone',
    name: 'Redstone Miners',
    abbreviation: 'RED',
    conference: 'WESTERN',
    division: 'Northwest',
  },
  {
    id: 'team-lakeshore',
    name: 'Lakeshore Sentinels',
    abbreviation: 'LAK',
    conference: 'EASTERN',
    division: 'Southeast',
  },
];
