import { z } from 'zod';
import { playerPositionSchema } from './enums.js';
import { paginationQuerySchema } from './pagination.js';

/** Query params accepted by `GET /players`. */
export const listPlayersQuerySchema = paginationQuerySchema.extend({
  // Players have no upper bound on `limit`; omit it to fetch every player.
  limit: z.coerce.number().int().min(1).optional(),
  teamId: z.string().min(1).optional(),
  position: playerPositionSchema.optional(),
  active: z.coerce.boolean().optional(),
  /** Case-insensitive substring match on `fullName`. */
  search: z.string().trim().min(1).optional(),
  /** 1-based page index; used when `cursor` is omitted and `limit` is set. */
  page: z.coerce.number().int().min(1).default(1),
});

export type ListPlayersQuery = z.infer<typeof listPlayersQuerySchema>;

/** Query params accepted by `GET /players/:id/game-log`. */
export const playerGameLogQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(82).default(10),
});

export type PlayerGameLogQuery = z.infer<typeof playerGameLogQuerySchema>;
