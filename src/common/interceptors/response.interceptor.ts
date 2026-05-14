import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { Request, Response } from 'express';

interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T | null;
  meta?: Record<string, unknown>;
  timestamp: string;
  path: string;
}

interface ResponseEnvelope<T> {
  message?: string;
  data?: T;
  meta?: Record<string, unknown>;
}

function isResponseEnvelope<T>(value: T): value is T & ResponseEnvelope<T> {
  return typeof value === 'object' && value !== null;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    return next.handle().pipe(
      map((result: T) => {
        const statusCode = response.statusCode;
        const envelope = isResponseEnvelope(result) ? result : null;

        return {
          success: true,
          statusCode,
          message: envelope?.message ?? 'Request successful',
          data: envelope?.data ?? result ?? null,
          meta: envelope?.meta,
          timestamp: new Date().toISOString(),
          path: request.originalUrl,
        };
      }),
    );
  }
}
