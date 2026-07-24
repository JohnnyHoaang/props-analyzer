import type { BdlGame, BdlPlayer, BdlStat, BdlTeam } from './client.js';
import {
  DEFAULT_HEIGHT,
  DEFAULT_POSITION,
  DEFAULT_WEIGHT,
  isFinalGame,
  isRealNbaTeam,
  mapConference,
  mapGame,
  mapGameType,
  mapPlayer,
  mapPosition,
  mapSeason,
  mapStat,
  mapTeam,
  overtimePeriods,
  parseHeight,
  parseMinutes,
  parseWeight,
  playerId,
  seasonLabel,
  teamId,
} from './map.js';

const celtics: BdlTeam = {
  id: 2,
  conference: 'East',
  division: 'Atlantic',
  city: 'Boston',
  name: 'Celtics',
  full_name: 'Boston Celtics',
  abbreviation: 'BOS',
};

const tatum: BdlPlayer = {
  id: 246,
  first_name: 'Jayson',
  last_name: 'Tatum',
  position: 'F',
  height: '6-8',
  weight: '210',
  team: celtics,
};

describe('bdl mappers', () => {
  describe('parseHeight', () => {
    it('converts feet-inches to total inches', () => {
      expect(parseHeight('6-8')).toBe(80);
      expect(parseHeight('7-0')).toBe(84);
    });

    it('falls back to the default on empty or malformed input', () => {
      expect(parseHeight('')).toBe(DEFAULT_HEIGHT);
      expect(parseHeight('68')).toBe(DEFAULT_HEIGHT);
      expect(parseHeight('six-eight')).toBe(DEFAULT_HEIGHT);
    });
  });

  describe('parseWeight', () => {
    it('parses a pounds string', () => {
      expect(parseWeight('210')).toBe(210);
    });

    it('falls back to the default on empty input', () => {
      expect(parseWeight('')).toBe(DEFAULT_WEIGHT);
      expect(parseWeight('n/a')).toBe(DEFAULT_WEIGHT);
    });
  });

  describe('mapPosition', () => {
    it('maps each BDL position via the heuristic', () => {
      expect(mapPosition('G')).toBe('PG');
      expect(mapPosition('G-F')).toBe('SG');
      expect(mapPosition('F')).toBe('SF');
      expect(mapPosition('F-C')).toBe('PF');
      expect(mapPosition('C')).toBe('C');
    });

    it('defaults empty or unknown positions', () => {
      expect(mapPosition('')).toBe(DEFAULT_POSITION);
      expect(mapPosition('PG')).toBe(DEFAULT_POSITION);
    });
  });

  describe('mapConference', () => {
    it('maps East and West to the enum values', () => {
      expect(mapConference('East')).toBe('EASTERN');
      expect(mapConference('West')).toBe('WESTERN');
    });
  });

  describe('isRealNbaTeam', () => {
    it('keeps teams with a real conference and division', () => {
      expect(isRealNbaTeam(celtics)).toBe(true);
    });

    it('drops defunct teams with blank conference or division', () => {
      expect(isRealNbaTeam({ ...celtics, conference: '', division: '' })).toBe(
        false
      );
      expect(isRealNbaTeam({ ...celtics, division: '   ' })).toBe(false);
    });
  });

  describe('mapTeam', () => {
    it('produces a deterministic id and mapped fields', () => {
      expect(mapTeam(celtics)).toEqual({
        id: teamId(2),
        name: 'Boston Celtics',
        abbreviation: 'BOS',
        conference: 'EASTERN',
        division: 'Atlantic',
      });
      expect(mapTeam(celtics).id).toBe('2');
    });
  });

  describe('mapPlayer', () => {
    it('produces a deterministic id linked to the team and mapped fields', () => {
      expect(mapPlayer(tatum)).toEqual({
        id: playerId(246),
        teamId: teamId(2),
        fullName: 'Jayson Tatum',
        position: 'SF',
        height: 80,
        weight: 210,
        active: true,
      });
      expect(mapPlayer(tatum).id).toBe('246');
    });

    it('applies defaults for incomplete records', () => {
      const incomplete: BdlPlayer = {
        ...tatum,
        position: '',
        height: '',
        weight: '',
      };
      const mapped = mapPlayer(incomplete);
      expect(mapped.position).toBe(DEFAULT_POSITION);
      expect(mapped.height).toBe(DEFAULT_HEIGHT);
      expect(mapped.weight).toBe(DEFAULT_WEIGHT);
    });

    it('handles null biographical fields (BDL sends null, not "")', () => {
      const nulled: BdlPlayer = {
        ...tatum,
        position: null,
        height: null,
        weight: null,
      };
      const mapped = mapPlayer(nulled);
      expect(mapped.position).toBe(DEFAULT_POSITION);
      expect(mapped.height).toBe(DEFAULT_HEIGHT);
      expect(mapped.weight).toBe(DEFAULT_WEIGHT);
      expect(mapped.fullName).toBe('Jayson Tatum');
    });
  });

  describe('seasonLabel / mapSeason', () => {
    it('formats the starting year as a two-year label', () => {
      expect(seasonLabel(2024)).toBe('2024-25');
      expect(seasonLabel(2025)).toBe('2025-26');
      expect(seasonLabel(1999)).toBe('1999-00');
    });

    it('builds a deterministic season fixture', () => {
      expect(mapSeason(2025)).toEqual({
        id: 'season-2025-26',
        label: '2025-26',
        startDate: new Date('2025-10-01').toISOString(),
        endDate: new Date('2026-06-30').toISOString(),
      });
    });
  });

  describe('mapGameType', () => {
    it('maps the postseason flag', () => {
      expect(mapGameType(true)).toBe('PLAYOFFS');
      expect(mapGameType(false)).toBe('REGULAR_SEASON');
    });
  });

  describe('overtimePeriods', () => {
    it('counts periods beyond regulation', () => {
      expect(overtimePeriods(4)).toBe(0);
      expect(overtimePeriods(5)).toBe(1);
      expect(overtimePeriods(7)).toBe(3);
    });

    it('never returns a negative count', () => {
      expect(overtimePeriods(0)).toBe(0);
    });
  });

  describe('isFinalGame', () => {
    it('recognizes completed games', () => {
      expect(isFinalGame('Final')).toBe(true);
      expect(isFinalGame('final')).toBe(true);
    });

    it('rejects scheduled/other statuses', () => {
      expect(isFinalGame('2025-10-21T23:00:00Z')).toBe(false);
      expect(isFinalGame('')).toBe(false);
    });
  });

  describe('parseMinutes', () => {
    it('parses whole-minute strings', () => {
      expect(parseMinutes('34')).toBe(34);
      expect(parseMinutes('34:30')).toBe(34);
    });

    it('returns 0 for a DNP (missing or malformed)', () => {
      expect(parseMinutes('0')).toBe(0);
      expect(parseMinutes('')).toBe(0);
      expect(parseMinutes(null)).toBe(0);
      expect(parseMinutes('n/a')).toBe(0);
    });
  });

  describe('mapGame', () => {
    const game: BdlGame = {
      id: 18001,
      date: '2025-11-01',
      season: 2025,
      status: 'Final',
      period: 5,
      postseason: false,
      home_team_score: 112,
      visitor_team_score: 108,
      home_team: { id: 2 },
      visitor_team: { id: 14 },
    };

    it('maps a regular-season overtime game with raw-id team keys', () => {
      expect(mapGame(game, 'season-2025-26')).toEqual({
        id: '18001',
        seasonId: 'season-2025-26',
        date: new Date('2025-11-01').toISOString(),
        status: 'FINAL',
        gameType: 'REGULAR_SEASON',
        homeTeamId: '2',
        awayTeamId: '14',
        homeScore: 112,
        awayScore: 108,
        overtimePeriods: 1,
      });
    });

    it('flags playoff games', () => {
      expect(mapGame({ ...game, postseason: true }, 's').gameType).toBe(
        'PLAYOFFS'
      );
    });
  });

  describe('mapStat', () => {
    const stat: BdlStat = {
      id: 900,
      min: '34',
      fgm: 10,
      fga: 20,
      fg3m: 3,
      fg3a: 7,
      ftm: 5,
      fta: 6,
      reb: 8,
      ast: 4,
      stl: 2,
      blk: 1,
      turnover: 3,
      pf: 2,
      pts: 28,
      plus_minus: 11,
      player: { id: 246 },
      team: { id: 2 },
      game: { id: 18001 },
    };

    it('maps every box-score field with raw-id keys', () => {
      expect(mapStat(stat)).toEqual({
        playerId: '246',
        gameId: '18001',
        minutes: 34,
        points: 28,
        rebounds: 8,
        assists: 4,
        threePM: 3,
        threePA: 7,
        fgm: 10,
        fga: 20,
        ftm: 5,
        fta: 6,
        steals: 2,
        blocks: 1,
        turnovers: 3,
        fouls: 2,
        plusMinus: 11,
        starter: false,
      });
    });

    it('defaults a null plus_minus to 0', () => {
      expect(mapStat({ ...stat, plus_minus: null }).plusMinus).toBe(0);
    });
  });
});
