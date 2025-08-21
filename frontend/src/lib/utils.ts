import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}



export const range = (start: number, stop: number, step: number = 1) =>
  Array.from({ length: (stop - start) / step + 1 }, (_, i) => start + i * step);

export type Result<T, E = string> =
  | { error: E; ok: false }
  | { data: T; ok: true };

export function successResult<T, E = string>(data: T): Result<T, E> {
  return { data, ok: true };
}

export function failureResult<T, E = string>(error: E): Result<T, E> {
  return { error, ok: false };
}

export function getOrDefault<T, E = string>(
  result: Result<T, E>,
  defaultValue: T
): T {
  if (result.ok) {
    return result.data;
  } else {
    return defaultValue;
  }
}

export function getOrNull<T, E = string>(result: Result<T, E>): T | undefined {
  if (result.ok) {
    return result.data;
  } else {
    return undefined;
  }
}

export function getOrThrow<T, E = string>(result: Result<T, E>): T {
  if (result.ok) {
    return result.data;
  } else {
    if (typeof result.error === typeof Error) {
      throw result.error;
    } else {
      throw new Error(String(result.error));
    }
  }
}