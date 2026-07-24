import { render, screen } from '@testing-library/react';
import { ApiClientError } from '@props-analyzer/api-client';
import type { TeamDto } from '@props-analyzer/shared-types';
import TeamsPage from '../app/teams/page';

jest.mock('@props-analyzer/api-client', () => {
  const actual = jest.requireActual('@props-analyzer/api-client');
  return { ...actual, listTeams: jest.fn() };
});

const { listTeams } = jest.requireMock('@props-analyzer/api-client') as {
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

describe('TeamsPage', () => {
  beforeEach(() => {
    listTeams.mockReset();
  });

  it('renders teams grouped by conference without rosters', async () => {
    listTeams.mockResolvedValue([
      makeTeam(),
      makeTeam({
        id: 'team-b',
        name: 'Harbor City',
        abbreviation: 'HBR',
        conference: 'EASTERN',
        division: 'Atlantic',
      }),
    ]);

    const ui = await TeamsPage();
    render(ui);

    expect(screen.getByText('Eastern Conference')).toBeTruthy();
    expect(screen.getByText('Western Conference')).toBeTruthy();
    expect(screen.getByText('Cascade Timber')).toBeTruthy();
    expect(screen.getByText('Harbor City')).toBeTruthy();
    expect(screen.getByRole('link', { name: /Cascade Timber/i }).getAttribute('href')).toBe(
      '/teams/team-a'
    );
    expect(screen.queryByText('Jordan Rivers')).toBeNull();
  });

  it('renders an error state when the API call fails', async () => {
    listTeams.mockRejectedValue(new ApiClientError('boom', 500, undefined));

    const ui = await TeamsPage();
    render(ui);

    expect(screen.getByText("Couldn't load teams")).toBeTruthy();
  });
});
