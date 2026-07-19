import { z } from 'zod';
import { playerPositionSchema } from './enums.js';
import { paginationQuerySchema } from './pagination.js';

/** Query params accepted by `GET /players`. */
export const listPlayersQuerySchema = paginationQuerySchema.extend({
  teamId: z.string().min(1).optional(),
  position: playerPositionSchema.optional(),
  active: z.coerce.boolean().optional(),
});

export type ListPlayersQuery = z.infer<typeof listPlayersQuerySchema>;

/** Query params accepted by `GET /players/:id/game-log`. */
export const playerGameLogQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(82).default(10),
});

export type PlayerGameLogQuery = z.infer<typeof playerGameLogQuerySchema>;
