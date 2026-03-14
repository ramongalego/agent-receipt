export type Result<T, E = string> =
  | { ok: true; value: T }
  | { ok: false; error: E; code: string };

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function err<E = string>(error: E, code: string): Result<never, E> {
  return { ok: false, error, code };
}
