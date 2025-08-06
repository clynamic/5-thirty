import {
  CallHandler,
  ConsoleLogger,
  ExecutionContext,
  Injectable,
  LogLevel,
  Logger,
  LoggerService,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable, catchError, tap } from 'rxjs';
import { DecodedJwt } from 'src/auth/auth.service';

@Injectable()
export class AppLogger extends ConsoleLogger implements LoggerService {
  protected override formatPid() {
    return '';
  }

  protected override formatMessage(
    logLevel: LogLevel,
    message: unknown,
    pidMessage: string,
    formattedLogLevel: string,
    contextMessage: string,
    timestampDiff: string,
  ): string {
    return super.formatMessage(
      logLevel,
      message,
      pidMessage,
      `[${formattedLogLevel.trim()}]`,
      contextMessage,
      timestampDiff,
    );
  }

  protected override getTimestamp(): string {
    const now = new Date();
    return (
      now.toLocaleString('en-GB', {
        hour12: false,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }) + `.${now.getMilliseconds().toString().padStart(3, '0')}`
    );
  }
}

@Injectable()
export class RequestLogger implements NestInterceptor {
  logger = new Logger('Requests');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest<Request>();
    const { method, originalUrl, query, user } = req;
    const url = new URL(`${req.protocol}://${req.get('host')}${originalUrl}`);
    const jwt = user as DecodedJwt | undefined;

    const queryString = new URLSearchParams(
      query as Record<string, string>,
    ).toString();
    url.search = queryString;

    const op = method.toUpperCase();
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const username = jwt ? jwt.username : 'anonymous';

    const startTime = Date.now();

    this.logger.log(`[${op}] ${username}@${ip} -> ${url.href}`);

    return next.handle().pipe(
      tap(() => {
        const res = context.switchToHttp().getResponse();
        const duration = Date.now() - startTime;
        this.logger.log(
          `[${op}] ${username}@${ip} <- ${url.href} : ${res.statusCode} - ${duration}ms`,
        );
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        const msg = `[${op}] ${username}@${ip} x- Error: ${error.message} - ${duration}ms`;
        if (error.status && error.status < 500) {
          this.logger.warn(msg);
        } else {
          this.logger.error(msg);
        }
        throw error;
      }),
    );
  }
}
