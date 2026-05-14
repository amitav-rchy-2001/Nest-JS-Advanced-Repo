import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '../../generated/prisma/client';

type ErrorDetails = Record<string, unknown> | string[] | null;

interface HttpExceptionResponseBody {
  message?: string | string[];
  errors?: ErrorDetails;
}

interface PrismaErrorResponse {
  statusCode: HttpStatus;
  message: string;
  errors: ErrorDetails;
}

function isHttpExceptionResponseBody(
  value: unknown,
): value is HttpExceptionResponseBody {
  return typeof value === 'object' && value !== null;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: ErrorDetails = null;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();

      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (isHttpExceptionResponseBody(exceptionResponse)) {
        const responseMessage = exceptionResponse.message;

        if (Array.isArray(responseMessage)) {
          message = 'Validation failed';
          errors = responseMessage;
        } else {
          message = responseMessage ?? exception.message;
        }

        if (exceptionResponse.errors) {
          errors = exceptionResponse.errors;
        }
      }
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const prismaError = this.handlePrismaError(exception);
      statusCode = prismaError.statusCode;
      message = prismaError.message;
      errors = prismaError.errors;
    }

    response.status(statusCode).json({
      success: false,
      statusCode,
      message,
      errors,
      timestamp: new Date().toISOString(),
      path: request.originalUrl,
    });
  }

  private handlePrismaError(
    error: Prisma.PrismaClientKnownRequestError,
  ): PrismaErrorResponse {
    switch (error.code) {
      case 'P2002':
        return {
          statusCode: HttpStatus.CONFLICT,
          message: 'Duplicate value already exists',
          errors: error.meta ?? null,
        };

      case 'P2025':
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Requested record not found',
          errors: error.meta ?? null,
        };

      case 'P2003':
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Foreign key constraint failed',
          errors: error.meta ?? null,
        };

      default:
        return {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Database operation failed',
          errors: {
            code: error.code,
            meta: error.meta,
          },
        };
    }
  }
}
