/**
 * Replace
 */

export interface ReplaceOptions {
  replaceWith: string,
  search: string
}

export function replace(options: ReplaceOptions, text: string) : string {
  if(!text) throw new Error("Text undefined");
  if(!options?.search) throw new Error("Missing 'search' option");
  if(options.replaceWith === undefined || options.replaceWith === null) throw new Error("Missing 'replaceWith' option");
  return text.replaceAll(options.search, options.replaceWith);
}
