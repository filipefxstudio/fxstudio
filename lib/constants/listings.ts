export const DEFAULT_LIST_LIMIT = 200;
export const MAX_LIST_LIMIT = 200;

export function clampListLimit(limit?: number): number {
  if (!limit || limit <= 0) {
    return DEFAULT_LIST_LIMIT;
  }

  return Math.min(limit, MAX_LIST_LIMIT);
}

export function clampListOffset(offset?: number): number {
  if (!offset || offset < 0) {
    return 0;
  }

  return offset;
}

export interface ListQueryOptions {
  limit?: number;
  offset?: number;
}
