const snakeToCamel = (key: string) => key.replace(/_([a-z0-9])/g, (_, char: string) => char.toUpperCase());
const camelToSnake = (key: string) => key.replace(/[A-Z]/g, (char) => `_${char.toLowerCase()}`);

export function fromSupabase<T = Record<string, any>>(row: Record<string, any> | null): T | null {
  if (!row) return null;
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(row)) result[snakeToCamel(key)] = value;
  result._id = row.id;
  return result as T;
}

export function toSupabase(value: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, item] of Object.entries(value)) {
    if (key === '_id' || item === undefined) continue;
    result[camelToSnake(key)] = item;
  }
  return result;
}

export const rowsFromSupabase = <T = Record<string, any>>(rows: Record<string, any>[] | null): T[] =>
  (rows || []).map((row) => fromSupabase<T>(row)!);
