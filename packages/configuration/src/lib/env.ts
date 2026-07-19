import { z } from 'zod';

/**
 * Shared environment schema. Each app validates only the variables it
 * actually needs by picking from this schema, so `apps/web` never has to
 * know about server-only secrets like `DATABASE_URL`.
 */
export const envSchema = z.object({
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL is required (see .env.example)'),
  API_PORT: z.coerce.number().int().positive().default(3333),
  NEXT_PUBLIC_API_URL: z.string().min(1).default('http://localhost:3333'),
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
  const shape = Object.fromEntries(
    keys.map((key) => [key, envSchema.shape[key]])
  ) as Pick<typeof envSchema.shape, Keys>;

  const result = z.object(shape).safeParse(raw);

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }

  return result.data as Pick<Env, Keys>;
}
