/**
 * TypeCast
 */

export interface TypecastOptions {
  targetType: string
}

export function typecast(options: TypecastOptions, value: any) : any {
  if(!options?.targetType) throw new Error("Missing 'targetType' option");

  switch(options.targetType) {
    case 'number': return Number(value);
    case 'string': return String(value);
    default: return null;
  }
}
