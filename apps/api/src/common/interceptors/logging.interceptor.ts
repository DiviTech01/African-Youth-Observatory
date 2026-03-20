import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse();
          const statusCode = response.statusCode;
          const elapsed = Date.now() - start;
          const userId = request.user?.id || 'anonymous';
          const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);

          this.logger.log(
            `[${timestamp}] ${method} ${url} ${statusCode} ${elapsed}ms user:${userId}`,
          );
        },
        error: (error) => {
          const elapsed = Date.now() - start;
          const statusCode = error.status || 500;
          const userId = request.user?.id || 'anonymous';
          const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);

          this.logger.warn(
            `[${timestamp}] ${method} ${url} ${statusCode} ${elapsed}ms user:${userId}`,
          );
        },
      }),
    );
  }
}
