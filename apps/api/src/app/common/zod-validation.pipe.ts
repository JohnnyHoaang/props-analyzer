import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { parseWithSchema } from '@props-analyzer/validation';
import type { z } from 'zod';

/**
 * Adapts the framework-agnostic `parseWithSchema` helper from
 * packages/validation into a NestJS pipe, so route handlers can validate
 * query params and route params against the same Zod schemas the frontend
 * could reuse (see docs/ARCHITECTURE.md).
 */
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: z.ZodType) {}

  transform(value: unknown) {
    const result = parseWithSchema(this.schema, value);

    if (!result.ok) {
      throw new BadRequestException({
        message: 'Validation failed',
        issues: result.issues,
      });
    }

    return result.data;
  }
}
