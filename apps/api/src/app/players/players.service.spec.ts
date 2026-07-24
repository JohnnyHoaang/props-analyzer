import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { REPOSITORIES } from '../database/repositories.token.js';
import { PlayersService } from './players.service.js';

describe('PlayersService', () => {
  let service: PlayersService;
  const now = new Date('2025-11-01T00:00:00.000Z');

  const mockTeam = {
    id: 'team-cascade',
    name: 'Cascade Ironhawks',
    abbreviation: 'CAS',
    conference: 'WESTERN' as const,
    division: 'Pacific',
    createdAt: now,
    updatedAt: now,
  };

  const mockPlayer = {
    id: 'player-cascade-1',
    teamId: 'team-cascade',
    fullName: 'Deshawn Ortiz',
    position: 'PG' as const,
    height: 74,
    weight: 190,
    active: true,
    createdAt: now,
    updatedAt: now,
    team: mockTeam,
  };

  const mockGame = {
    id: 'game-001',
    date: now,
    homeTeamId: 'team-cascade',
    awayTeamId: 'team-meridian',
    homeScore: 108,
    awayScore: 101,
  };

  const mockStat = {
    id: 'stat-1',
    playerId: 'player-cascade-1',
    gameId: 'game-001',
    minutes: 32,
    points: 20,
    rebounds: 4,
    assists: 7,
    threePM: 2,
    threePA: 5,
    fgm: 8,
    fga: 15,
    ftm: 2,
    fta: 3,
    steals: 1,
    blocks: 0,
    turnovers: 2,
    fouls: 2,
    plusMinus: 7,
    starter: true,
    createdAt: now,
    updatedAt: now,
    game: mockGame,
  };

  const repos = {
    player: {
      list: jest.fn(),
      findByIdWithTeam: jest.fn(),
      findById: jest.fn(),
    },
    playerGameStat: {
      listByPlayerWithGame: jest.fn(),
    },
    propLine: {
      listByPlayer: jest.fn(),
    },
    team: {
      list: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [PlayersService, { provide: REPOSITORIES, useValue: repos }],
    }).compile();

    service = moduleRef.get(PlayersService);
  });

  describe('findAll', () => {
    it('passes the query filters through to the repository', async () => {
      repos.player.list.mockResolvedValue([mockPlayer]);

      const result = await service.findAll({
        limit: 50,
        page: 1,
        teamId: 'team-cascade',
        position: 'PG',
        active: true,
        search: 'deshawn',
      });

      expect(repos.player.list).toHaveBeenCalledWith(
        expect.objectContaining({
          teamId: 'team-cascade',
          position: 'PG',
          active: true,
          search: 'deshawn',
          limit: 50,
          page: 1,
        })
      );
      expect(result).toHaveLength(1);
      expect(result[0].team.abbreviation).toBe('CAS');
    });

    it('forwards page and cursor to the repository', async () => {
      repos.player.list.mockResolvedValue([]);

      await service.findAll({ limit: 10, page: 3 });
      expect(repos.player.list).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 10, page: 3 })
      );

      await service.findAll({ limit: 10, page: 1, cursor: 'player-cascade-1' });
      expect(repos.player.list).toHaveBeenCalledWith(
        expect.objectContaining({ cursor: 'player-cascade-1' })
      );
    });
  });

  describe('findById', () => {
    it('throws NotFoundException when missing', async () => {
      repos.player.findByIdWithTeam.mockResolvedValue(null);

      await expect(service.findById('missing')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('findGameLog', () => {
    it('throws NotFoundException for an unknown player', async () => {
      repos.player.findById.mockResolvedValue(null);

      await expect(
        service.findGameLog('missing', { limit: 10 })
      ).rejects.toThrow(NotFoundException);
    });

    it('marks games as home/away relative to the player team', async () => {
      repos.player.findById.mockResolvedValue(mockPlayer);
      repos.playerGameStat.listByPlayerWithGame.mockResolvedValue([mockStat]);

      const [entry] = await service.findGameLog('player-cascade-1', {
        limit: 10,
      });

      expect(entry.isHome).toBe(true);
      expect(entry.opponentTeamId).toBe('team-meridian');
    });
  });

  describe('findProps', () => {
    it('throws NotFoundException for an unknown player', async () => {
      repos.player.findById.mockResolvedValue(null);

      await expect(service.findProps('missing')).rejects.toThrow(
        NotFoundException
      );
    });

    it('derives the per-game series and resolves opponent abbreviations', async () => {
      repos.player.findById.mockResolvedValue(mockPlayer);
      repos.propLine.listByPlayer.mockResolvedValue([
        {
          id: 'prop-1',
          playerId: 'player-cascade-1',
          statType: 'PTS_AST',
          line: 27.5,
          overOdds: -110,
          underOdds: -110,
          projection: 28.4,
          createdAt: now,
          updatedAt: now,
        },
      ]);
      repos.playerGameStat.listByPlayerWithGame.mockResolvedValue([
        { ...mockStat, game: mockGame },
      ]);
      repos.team.list.mockResolvedValue([
        {
          id: 'team-meridian',
          abbreviation: 'MER',
          name: 'Meridian',
          conference: 'EASTERN',
          division: 'Atlantic',
          createdAt: now,
          updatedAt: now,
        },
      ]);

      const [prop] = await service.findProps('player-cascade-1');

      expect(prop.statType).toBe('PTS_AST');
      expect(prop.games).toHaveLength(1);
      // PTS_AST = points (20) + assists (7)
      expect(prop.games[0].value).toBe(27);
      expect(prop.games[0].opponentAbbreviation).toBe('MER');
      expect(prop.games[0].isHome).toBe(true);
    });
  });
});
