import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exResponse = exception.getResponse();
      if (typeof exResponse === 'string') {
        message = exResponse;
      } else if (typeof exResponse === 'object' && exResponse !== null) {
        message = (exResponse as any).message || message;
        code = (exResponse as any).error || code;
      }
    }

    // Strip PHI from error logs — never log patient names, IDs, or health data
    const safeLog = {
      timestamp: new Date().toISOString(),
      method: request.method,
      path: request.url,
      status,
      code,
      userAgent: request.headers['user-agent']?.slice(0, 100),
      ip: (request.headers['x-forwarded-for'] || request.socket.remoteAddress || '').toString().slice(0, 45),
    };

    if (status >= 500) {
      this.logger.error(`[${status}] ${request.method} ${request.url}`, exception instanceof Error ? exception.stack : '');
    } else if (status >= 400) {
      this.logger.warn(`[${status}] ${request.method} ${request.url}`);
    }

    response.status(status).json({
      statusCode: status,
      error: code,
      message: Array.isArray(message) ? message : [message],
      timestamp: safeLog.timestamp,
      path: request.url,
    });
  }
}
