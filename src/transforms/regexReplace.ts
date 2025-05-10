/**
 * RegexReplace
 */

export interface RegexReplaceOptions {
  pattern: string,
  output: string,
}

export function regexReplace(options: RegexReplaceOptions, value: any) : string {
  if(!options?.pattern) throw new Error("Missing 'pattern' option");
  if(!options.output) throw new Error("Missing 'output' option");
  
  if(typeof value !== 'string') throw new Error("Value must be a string for 'regexReplace' transformation");
  
  return value.replace(new RegExp(options.pattern), options.output);
}
