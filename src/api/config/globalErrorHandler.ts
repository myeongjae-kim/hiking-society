import { ZodError } from 'zod';
import type { ErrorHandler } from 'hono';
import { ApiError, toApiErrorBody } from './ApiError';

export const globalErrorHandler: ErrorHandler = (error) => {
  if (error instanceof ApiError) {
    return Response.json(toApiErrorBody(error), { status: error.status });
  }

  if (error instanceof ZodError) {
    return Response.json(
      toApiErrorBody(
        new ApiError({
          error: 'VALIDATION_ERROR',
          message: error.issues[0]?.message ?? '입력값을 확인해주세요.',
          status: 400,
        }),
      ),
      { status: 400 },
    );
  }

  console.error(error);
  return Response.json(
    toApiErrorBody(
      new ApiError({
        error: 'INTERNAL_SERVER_ERROR',
        message: error instanceof Error ? error.message : '요청을 처리하지 못했습니다.',
        status: 500,
      }),
    ),
    { status: 500 },
  );
};
