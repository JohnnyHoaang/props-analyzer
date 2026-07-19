import { render, screen } from '@testing-library/react';
import { ApiClientError } from '@props-analyzer/api-client';
import type { GameWithTeamsDto, TeamDto } from '@props-analyzer/shared-types';
import Page from '../app/page';

jest.mock('@props-analyzer/api-client', () => {
  const actual = jest.requireActual('@props-analyzer/api-client');
  return { ...actual, listGames: jest.fn() };
});

const { listGames } = jest.requireMock('@props-analyzer/api-client') as {
  listGames: jest.Mock;
};

function makeTeam(overrides: Partial<TeamDto>): TeamDto {
  return {
    id: 'team-a',
    name: 'Team A',
    abbreviation: 'TMA',
    conference: 'EASTERN',
    division: 'Atlantic',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeGame(overrides: Partial<GameWithTeamsDto>): GameWithTeamsDto {
  return {
    id: 'game-1',
    seasonId: 'season-1',
    date: '2025-11-01',
    status: 'FINAL',
    gameType: 'REGULAR_SEASON',
    homeTeamId: 'team-a',
    awayTeamId: 'team-b',
    homeScore: 108,
    awayScore: 101,
    overtimePeriods: 0,
    homeTeam: makeTeam({ id: 'team-a', abbreviation: 'HOM' }),
    awayTeam: makeTeam({ id: 'team-b', abbreviation: 'AWY' }),
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('DashboardPage', () => {
  beforeEach(() => {
    listGames.mockReset();
  });

  it('renders the completed games list', async () => {
    listGames.mockResolvedValue([makeGame({})]);

    const ui = await Page();
    render(ui);

    expect(screen.getByText('Recent completed games')).toBeTruthy();
    expect(screen.getByText('AWY')).toBeTruthy();
    expect(screen.getByText('HOM')).toBeTruthy();
  });

  it('renders an error state when the API call fails', async () => {
    listGames.mockRejectedValue(new ApiClientError('boom', 500, undefined));

    const ui = await Page();
    render(ui);

    expect(screen.getByText("Couldn't load games")).toBeTruthy();
  });

  it('renders an empty state when there are no games yet', async () => {
    listGames.mockResolvedValue([]);

    const ui = await Page();
    render(ui);

    expect(screen.getByText('No completed games yet.')).toBeTruthy();
  });
});
