import type { ZodSchema } from 'zod';
import { fail } from './responses';

export async function parseJsonBody<T>(request: Request, schema: ZodSchema<T>) {
  const json = await request.json().catch(() => undefined);
  const result = schema.safeParse(json);

  if (!result.success) {
    return {
      data: null,
      response: fail('VALIDATION_ERROR', 'Request body validation failed.', 422, result.error.flatten()),
    } as const;
  }

  return {
    data: result.data,
    response: null,
  } as const;
}
