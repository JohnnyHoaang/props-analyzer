import { render, screen } from '@testing-library/react';
import { ApiClientError } from '@props-analyzer/api-client';
import type { PlayerWithTeamDto, TeamDto } from '@props-analyzer/shared-types';
import TeamDetailPage from '../app/teams/[teamId]/page';

jest.mock('@props-analyzer/api-client', () => {
  const actual = jest.requireActual('@props-analyzer/api-client');
  return { ...actual, getTeam: jest.fn(), listPlayers: jest.fn() };
});

jest.mock('next/navigation', () => ({
  notFound: jest.fn(),
}));

const { getTeam, listPlayers } = jest.requireMock('@props-analyzer/api-client') as {
  getTeam: jest.Mock;
  listPlayers: jest.Mock;
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

describe('TeamDetailPage', () => {
  beforeEach(() => {
    getTeam.mockReset();
    listPlayers.mockReset();
  });

  it('renders the team roster', async () => {
    getTeam.mockResolvedValue(makeTeam());
    listPlayers.mockResolvedValue([makePlayer()]);

    const ui = await TeamDetailPage({
      params: Promise.resolve({ teamId: 'team-a' }),
    });
    render(ui);

    expect(screen.getByText('Cascade Timber')).toBeTruthy();
    expect(screen.getByText('Jordan Rivers')).toBeTruthy();
    expect(listPlayers).toHaveBeenCalledWith({ teamId: 'team-a' });
  });

  it('renders an error state when the roster call fails', async () => {
    getTeam.mockResolvedValue(makeTeam());
    listPlayers.mockRejectedValue(new ApiClientError('boom', 500, undefined));

    const ui = await TeamDetailPage({
      params: Promise.resolve({ teamId: 'team-a' }),
    });
    render(ui);

    expect(screen.getByText("Couldn't load roster")).toBeTruthy();
  });
});
