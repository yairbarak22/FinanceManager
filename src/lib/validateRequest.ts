import { NextResponse } from 'next/server';
import { ZodSchema, ZodError } from 'zod';

type ValidationSuccess<T> = { data: T; errorResponse: null };
type ValidationFailure = { data: null; errorResponse: NextResponse };

/**
 * Parse and validate a JSON request body against a Zod schema.
 * Pattern mirrors `requireAuth()` — destructure and check errorResponse.
 *
 * Usage:
 *   const { data, errorResponse } = await validateRequest(request, schema);
 *   if (errorResponse) return errorResponse;
 *   // data is fully typed and validated
 */
export async function validateRequest<T>(
  request: Request,
  schema: ZodSchema<T>,
): Promise<ValidationSuccess<T> | ValidationFailure> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return {
      data: null,
      errorResponse: NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 },
      ),
    };
  }

  try {
    const data = schema.parse(body);
    return { data, errorResponse: null };
  } catch (err) {
    if (err instanceof ZodError) {
      const firstIssue = err.issues[0];
      const field = firstIssue.path.join('.');
      const message = field
        ? `${field}: ${firstIssue.message}`
        : firstIssue.message;
      return {
        data: null,
        errorResponse: NextResponse.json(
          { error: message },
          { status: 400 },
        ),
      };
    }
    throw err;
  }
}
