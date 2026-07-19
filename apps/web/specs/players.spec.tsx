import { render, screen } from '@testing-library/react';
import { ApiClientError } from '@props-analyzer/api-client';
import type { PlayerWithTeamDto, TeamDto } from '@props-analyzer/shared-types';
import PlayersPage from '../app/players/page';

jest.mock('@props-analyzer/api-client', () => {
  const actual = jest.requireActual('@props-analyzer/api-client');
  return { ...actual, listPlayers: jest.fn(), listTeams: jest.fn() };
});

const { listPlayers, listTeams } = jest.requireMock(
  '@props-analyzer/api-client'
) as { listPlayers: jest.Mock; listTeams: jest.Mock };

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

describe('PlayersPage', () => {
  beforeEach(() => {
    listPlayers.mockReset();
    listTeams.mockReset();
    listTeams.mockResolvedValue([makeTeam()]);
  });

  it('renders the player list', async () => {
    listPlayers.mockResolvedValue([makePlayer()]);

    const ui = await PlayersPage({ searchParams: Promise.resolve({}) });
    render(ui);

    expect(screen.getByText('Jordan Rivers')).toBeTruthy();
    expect(screen.getByText('CAS')).toBeTruthy();
  });

  it('passes filters from searchParams through to listPlayers', async () => {
    listPlayers.mockResolvedValue([]);

    const ui = await PlayersPage({
      searchParams: Promise.resolve({
        teamId: 'team-a',
        position: 'PG',
        active: 'true',
      }),
    });
    render(ui);

    expect(listPlayers).toHaveBeenCalledWith(
      expect.objectContaining({
        teamId: 'team-a',
        position: 'PG',
        active: true,
      })
    );
  });

  it('renders an error state when the API call fails', async () => {
    listPlayers.mockRejectedValue(new ApiClientError('boom', 500, undefined));

    const ui = await PlayersPage({ searchParams: Promise.resolve({}) });
    render(ui);

    expect(screen.getByText("Couldn't load players")).toBeTruthy();
  });

  it('renders an empty state when no players match the filters', async () => {
    listPlayers.mockResolvedValue([]);

    const ui = await PlayersPage({ searchParams: Promise.resolve({}) });
    render(ui);

    expect(screen.getByText('No players match those filters.')).toBeTruthy();
  });
});
