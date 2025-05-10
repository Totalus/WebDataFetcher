/**
 * RegexReplace
 */

export interface RegexReplaceOptions {
  pattern: string,
  output: string,
}

export function regexReplace(options: RegexReplaceOptions, value: string) : string {
  if(!options?.pattern) throw new Error("Missing 'pattern' option");
  if(!options.output) throw new Error("Missing 'output' option");
  return value.replace(new RegExp(options.pattern), options.output);
}
