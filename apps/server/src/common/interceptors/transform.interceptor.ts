import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    const httpContext = context.switchToHttp();
    const response = httpContext.getResponse();
    
    return next.handle().pipe(
      map((data) => {
        // If data is already standardized or empty, handle appropriately
        if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
          return {
            timestamp: new Date().toISOString(),
            ...data,
          };
        }
        
        return {
          success: true,
          data: data === undefined ? null : data,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
