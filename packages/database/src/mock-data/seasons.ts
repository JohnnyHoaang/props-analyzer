export interface SeasonFixture {
  id: string;
  label: string;
  startDate: string; // ISO date
  endDate: string; // ISO date
}

export const seasonFixtures: SeasonFixture[] = [
  {
    id: 'season-2025-26',
    label: '2025-26',
    startDate: '2025-10-21',
    endDate: '2026-04-12',
  },
];
