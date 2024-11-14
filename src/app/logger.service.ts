import {
  CallHandler,
  ConsoleLogger,
  ExecutionContext,
  Injectable,
  Logger,
  LoggerService,
  LogLevel,
  NestInterceptor,
} from '@nestjs/common';
import { catchError, Observable, tap } from 'rxjs';

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
    const req = context.switchToHttp().getRequest();
    const { method, originalUrl, query } = req;
    const url = new URL(`${req.protocol}://${req.get('host')}${originalUrl}`);

    const queryString = new URLSearchParams(
      query as Record<string, string>,
    ).toString();
    url.search = queryString;

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    const startTime = Date.now();

    this.logger.log(`[${method.toUpperCase()}] ${ip} -> ${url.href}`);

    return next.handle().pipe(
      tap(() => {
        const res = context.switchToHttp().getResponse();
        const duration = Date.now() - startTime;
        this.logger.log(
          `[${method.toUpperCase()}] ${ip} <- ${url.href} : ${res.statusCode} - ${duration}ms`,
        );
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        this.logger.error(`${ip} x- Error: ${error.message} - ${duration}ms`);
        throw error;
      }),
    );
  }
}
