/**
 * Replace
 */

export interface ReplaceOptions {
  replaceWith: string,
  search: string
}

export function replace(options: ReplaceOptions, value: any) : string {
  if(!options?.search) throw new Error("Missing 'search' option");
  if(options.replaceWith === undefined || options.replaceWith === null) throw new Error("Missing 'replaceWith' option");
  
  if(typeof value !== 'string') throw new Error("Value must be a string for 'replace' transformation");
  
  return value.replaceAll(options.search, options.replaceWith);
}
