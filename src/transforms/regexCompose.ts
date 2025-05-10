/**
 * RegexCompose
 */

export interface RegexComposeOptions {
  pattern: string,
  output: string,
}

export function regexCompose(options: RegexComposeOptions, value: string) : string | null {
  if(!options?.pattern) throw new Error("Missing 'pattern' option");
  if(!options.output) throw new Error("Missing 'output' option");

  let re = new RegExp(options.pattern, 'gm');

  let m = re.exec(value);
  if(!m || m.length <= 1)
    return null;

  return m[0].replace(re, options.output);
}
