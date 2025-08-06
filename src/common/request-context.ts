import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { ApiHeader } from '@nestjs/swagger';

/**
 * Contextual headers, which might apply to any request.
 */
export interface RequestContext {
  /**
   * Filters explicit content when enabled.
   */
  safeMode?: boolean;
}

export const SAFE_MODE_HEADER = 'x-safe-mode';

export const getSafeModeFromHeaders = (
  headers: Record<string, any>,
): boolean => {
  const safeModeHeader = headers[SAFE_MODE_HEADER];
  return safeModeHeader === 'true' || safeModeHeader === '1';
};

/**
 * Helper function to create RequestContext from headers
 */
export const createRequestContextFromHeaders = (
  headers: Record<string, any>,
): RequestContext => {
  return {
    safeMode: getSafeModeFromHeaders(headers),
  };
};

export const RequestCtx = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestContext => {
    const request = ctx.switchToHttp().getRequest();
    return createRequestContextFromHeaders(request.headers || {});
  },
);

export function WithRequestContext() {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    ApiHeader({
      name: SAFE_MODE_HEADER,
      description: 'Enable safe mode to filter explicit content',
      required: false,
    })(target, propertyKey, descriptor);
  };
}
