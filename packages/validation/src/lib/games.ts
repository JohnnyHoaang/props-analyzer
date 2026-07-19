import { z } from 'zod';
import { gameStatusSchema, gameTypeSchema } from './enums.js';
import { paginationQuerySchema } from './pagination.js';

/** Query params accepted by `GET /games`. */
export const listGamesQuerySchema = paginationQuerySchema.extend({
  teamId: z.string().min(1).optional(),
  seasonId: z.string().min(1).optional(),
  status: gameStatusSchema.optional(),
  gameType: gameTypeSchema.optional(),
});

export type ListGamesQuery = z.infer<typeof listGamesQuerySchema>;
