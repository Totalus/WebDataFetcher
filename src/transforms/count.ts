/**
 * Count elements of an array or characters of a string
 */

export interface CountOptions {}

export function count(options: CountOptions, value: any) : number {
  if (typeof value !== 'string' && !Array.isArray(value)) {
    throw new Error("Value must be a string or an array for 'count' transformation");
  }
  
  return value.length;
}
