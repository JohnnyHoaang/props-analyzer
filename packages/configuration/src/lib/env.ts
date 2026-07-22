import { z } from 'zod';

/**
 * Shared environment schema. Each app validates only the variables it
 * actually needs by picking from this schema, so `apps/web` never has to
 * know about server-only secrets like `DATABASE_URL`.
 */
export const envSchema = z
  .object({
    DATA_SOURCE: z.enum(['mock', 'postgres']).default('mock'),
    DATABASE_URL: z
      .string()
      .min(1, 'DATABASE_URL is required when DATA_SOURCE=postgres')
      .optional(),
    MOCK_DATA_PATH: z.string().min(1).optional(),
    API_PORT: z.coerce.number().int().positive().default(3333),
    NEXT_PUBLIC_API_URL: z.string().min(1).default('http://localhost:3333'),
  })
  .superRefine((env, ctx) => {
    if (env.DATA_SOURCE === 'postgres' && !env.DATABASE_URL) {
      ctx.addIssue({
        code: 'custom',
        message: 'DATABASE_URL is required when DATA_SOURCE=postgres',
        path: ['DATABASE_URL'],
      });
    }
  });

export type Env = z.infer<typeof envSchema>;

/**
 * Validates a raw environment object (typically `process.env`) against a
 * subset of {@link envSchema}. Throws with a readable message if required
 * variables are missing or malformed, instead of failing later with a
 * confusing runtime error deep in Prisma or an HTTP client.
 */
export function loadEnv<Keys extends keyof Env>(
  raw: NodeJS.ProcessEnv | Record<string, string | undefined>,
  keys: readonly Keys[]
): Pick<Env, Keys> {
  const result = envSchema.safeParse(raw);

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }

  const parsed = result.data;
  return Object.fromEntries(
    keys.map((key) => [key, parsed[key]])
  ) as Pick<Env, Keys>;
}
