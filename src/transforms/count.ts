/**
 * Count elements of an array or characters of a string
 */

export interface CountOptions {}

export function count(options: CountOptions, value: any[]|string) : number {
  return value.length;
}
