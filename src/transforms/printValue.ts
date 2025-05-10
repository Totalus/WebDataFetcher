/**
 * PrintValue
 */

export interface PrintValueOptions {}

export function printValue(options: PrintValueOptions, value: any) : any {
  console.log(value);
  return value;
}
