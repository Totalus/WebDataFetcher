/**
 * TypeCast
 */

export interface TypecastOptions {
  targetType: string
}

export function typecast(options: TypecastOptions, value: any) : any {
  if(!options?.targetType) throw new Error("Missing 'targetType' option");

  switch(options.targetType) {
    case 'number': 
      const num = Number(value);
      if (isNaN(num)) throw new Error(`Cannot cast value '${value}' to number`);
      return num;
    case 'string': 
      return String(value);
    default: 
      throw new Error(`Unsupported target type '${options.targetType}'`);
  }
}
