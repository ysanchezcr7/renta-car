import { plainToInstance, ClassConstructor } from 'class-transformer';

/** Typed wrappers for plainToInstance to satisfy ESLint no-unsafe-call (class-transformer types are safe). */
const toInstance = plainToInstance as <T, V>(
  cls: ClassConstructor<T>,
  plain: V,
  options?: { excludeExtraneousValues?: boolean },
) => T;

const toInstanceList = plainToInstance as <T, V>(
  cls: ClassConstructor<T>,
  plain: V[],
  options?: { excludeExtraneousValues?: boolean },
) => T[];

/**
 * This module provides utility functions to transform plain objects into class instances
 * and to create standardized success responses for API endpoints.
 */

export function transformOne<T, V>(cls: ClassConstructor<T>, plain: V): T {
  return toInstance(cls, plain, {
    excludeExtraneousValues: true,
  });
}

export function transformMany<T, V>(cls: ClassConstructor<T>, plain: V[]): T[] {
  return toInstanceList(cls, plain, {
    excludeExtraneousValues: true,
  });
}

export function successResponse<T>(
  message: string,
  data: T,
): {
  success: boolean;
  message: string;
  data: T;
} {
  return {
    success: true,
    message,
    data,
  };
}

export function createResponse<T>(
  cls: ClassConstructor<T>,
  message: string,
  entity: unknown,
) {
  return successResponse(message, transformOne(cls, entity));
}

export function updateResponse<T>(
  cls: ClassConstructor<T>,
  message: string,
  entity: unknown,
) {
  return successResponse(message, transformOne(cls, entity));
}

export function deleteResponse(message: string) {
  return {
    success: true,
    message,
  };
}
