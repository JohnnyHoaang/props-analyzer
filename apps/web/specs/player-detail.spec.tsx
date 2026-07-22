import { render, screen } from '@testing-library/react';
import { ApiClientError } from '@props-analyzer/api-client';
import type {
  PlayerGameLogEntryDto,
  PlayerWithTeamDto,
  TeamDto,
} from '@props-analyzer/shared-types';
import PlayerDetailPage from '../app/players/[playerId]/page';

jest.mock('@props-analyzer/api-client', () => {
  const actual = jest.requireActual('@props-analyzer/api-client');
  return {
    ...actual,
    getPlayer: jest.fn(),
    getPlayerGameLog: jest.fn(),
    getPlayerProps: jest.fn(),
    listTeams: jest.fn(),
  };
});

jest.mock('next/navigation', () => ({
  notFound: jest.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

const { getPlayer, getPlayerGameLog, getPlayerProps, listTeams } =
  jest.requireMock('@props-analyzer/api-client') as {
    getPlayer: jest.Mock;
    getPlayerGameLog: jest.Mock;
    getPlayerProps: jest.Mock;
    listTeams: jest.Mock;
  };

function makeTeam(overrides: Partial<TeamDto> = {}): TeamDto {
  return {
    id: 'team-a',
    name: 'Cascade Timber',
    abbreviation: 'CAS',
    conference: 'WESTERN',
    division: 'Pacific',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function makePlayer(overrides: Partial<PlayerWithTeamDto> = {}): PlayerWithTeamDto {
  return {
    id: 'player-1',
    teamId: 'team-a',
    fullName: 'Jordan Rivers',
    position: 'PG',
    height: 74,
    weight: 190,
    active: true,
    team: makeTeam(),
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeGameLogEntry(
  overrides: Partial<PlayerGameLogEntryDto> = {}
): PlayerGameLogEntryDto {
  return {
    id: 'stat-1',
    playerId: 'player-1',
    gameId: 'game-1',
    minutes: 32,
    points: 24,
    rebounds: 5,
    assists: 8,
    threePM: 3,
    threePA: 7,
    fgm: 9,
    fga: 17,
    ftm: 3,
    fta: 4,
    steals: 2,
    blocks: 0,
    turnovers: 3,
    fouls: 2,
    plusMinus: 12,
    starter: true,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    game: {
      id: 'game-1',
      date: '2025-11-01',
      homeTeamId: 'team-a',
      awayTeamId: 'team-b',
      homeScore: 108,
      awayScore: 101,
    },
    opponentTeamId: 'team-b',
    isHome: true,
    ...overrides,
  };
}

describe('PlayerDetailPage', () => {
  beforeEach(() => {
    getPlayer.mockReset();
    getPlayerGameLog.mockReset();
    getPlayerProps.mockReset();
    getPlayerProps.mockResolvedValue([]);
    listTeams.mockReset();
  });

  it("renders the player's profile and game log", async () => {
    getPlayer.mockResolvedValue(makePlayer());
    getPlayerGameLog.mockResolvedValue([makeGameLogEntry()]);
    listTeams.mockResolvedValue([
      makeTeam({ id: 'team-b', abbreviation: 'OPP' }),
    ]);

    const ui = await PlayerDetailPage({
      params: Promise.resolve({ playerId: 'player-1' }),
    });
    render(ui);

    expect(screen.getByText('Jordan Rivers')).toBeTruthy();
    expect(screen.getByText(/Cascade Timber/)).toBeTruthy();
    expect(screen.getByText('vs OPP')).toBeTruthy();
    expect(screen.getByText('24')).toBeTruthy();
  });

  it('renders the prop analysis when markets are available', async () => {
    getPlayer.mockResolvedValue(makePlayer());
    getPlayerGameLog.mockResolvedValue([makeGameLogEntry()]);
    listTeams.mockResolvedValue([]);
    getPlayerProps.mockResolvedValue([
      {
        playerId: 'player-1',
        statType: 'POINTS',
        line: 15.5,
        overOdds: -110,
        underOdds: -110,
        projection: 17.2,
        games: [
          {
            gameId: 'game-1',
            date: '2025-11-01',
            opponentAbbreviation: 'OPP',
            isHome: true,
            value: 20,
          },
        ],
      },
    ]);

    const ui = await PlayerDetailPage({
      params: Promise.resolve({ playerId: 'player-1' }),
    });
    render(ui);

    expect(screen.getByText('Jordan Rivers Points Prop')).toBeTruthy();
    expect(screen.getByText('Prop Analysis')).toBeTruthy();

    // The game log reflects the selected prop: a Prop column plus the
    // over/under caption for that line.
    expect(screen.getByText('Prop')).toBeTruthy();
    expect(screen.getByText(/in these games at a line of/)).toBeTruthy();
  });

  it('renders an error state when the game log fails to load', async () => {
    getPlayer.mockResolvedValue(makePlayer());
    getPlayerGameLog.mockRejectedValue(
      new ApiClientError('boom', 500, undefined)
    );
    listTeams.mockResolvedValue([]);

    const ui = await PlayerDetailPage({
      params: Promise.resolve({ playerId: 'player-1' }),
    });
    render(ui);

    expect(screen.getByText("Couldn't load the game log")).toBeTruthy();
  });

  it('triggers notFound() when the player does not exist', async () => {
    getPlayer.mockRejectedValue(new ApiClientError('Not found', 404, undefined));

    await expect(
      PlayerDetailPage({ params: Promise.resolve({ playerId: 'missing' }) })
    ).rejects.toThrow('NEXT_NOT_FOUND');
  });
});
