import { z } from 'zod';

/** Route params are always non-empty strings — Prisma cuid()s in Phase 1. */
export const idParamSchema = z.object({
  id: z.string().min(1, 'id is required'),
});
