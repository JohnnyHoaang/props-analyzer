import { z } from 'zod';

/**
 * Shared cursor-pagination query shape. Coerces string query params (limit
 * always arrives as a string over HTTP) into the right types with sane
 * defaults/bounds so list endpoints can't be asked for unbounded pages.
 */
export const paginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor: z.string().min(1).optional(),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
