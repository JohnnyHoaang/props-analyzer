import type { z } from 'zod';

export interface ParseFailure {
  ok: false;
  issues: { path: string; message: string }[];
}

export interface ParseSuccess<T> {
  ok: true;
  data: T;
}

export type ParseResult<T> = ParseSuccess<T> | ParseFailure;

/**
 * Framework-agnostic Zod parse helper (no NestJS/Next.js imports here so
 * this package stays usable from both apps/api and apps/web — see
 * docs/ARCHITECTURE.md). Callers adapt {@link ParseResult} into whatever
 * their framework expects (e.g. a NestJS `PipeTransform` throwing
 * `BadRequestException`).
 */
export function parseWithSchema<Schema extends z.ZodType>(
  schema: Schema,
  input: unknown
): ParseResult<z.infer<Schema>> {
  const result = schema.safeParse(input);

  if (result.success) {
    return { ok: true, data: result.data };
  }

  return {
    ok: false,
    issues: result.error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    })),
  };
}
