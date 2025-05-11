import { replace, ReplaceOptions } from './transforms/replace';
import { regexReplace, RegexReplaceOptions } from './transforms/regexReplace';
import { regexCompose, RegexComposeOptions } from './transforms/regexCompose';
import { typecast, TypecastOptions } from './transforms/typecast';
import { textToJson, TextToJsonOptions } from './transforms/textToJson';
import { restructure, RestructureOptions } from './transforms/restructure';
import { printValue, PrintValueOptions } from './transforms/printValue';
import { count, CountOptions } from './transforms/count';
import { scrapeHtml, ScrapeHtmlOptions } from './transforms/scrapeHtml';
import { reduce, ReduceOptions } from './transforms/reduce';


export type TransformationName = 'replace' | 'regexReplace' | 'regexCompose' | 'typecast' | 'textToJson' | 'restructure' | 'print' | 'count' | 'scrapeHtml' | 'reduce';
export type TransformationOptions = 
  | ReplaceOptions
  | RegexReplaceOptions
  | RegexComposeOptions
  | TypecastOptions
  | TextToJsonOptions
  | RestructureOptions
  | PrintValueOptions
  | CountOptions
  | ScrapeHtmlOptions
  | ReduceOptions;

/**
 * Function to apply a transformation on a value, by its name
 */
export function applyTransformation(name: TransformationName, options: TransformationOptions, value: any): any {
  switch(name) {
    case 'replace': return replace(options as ReplaceOptions, value);
    case 'regexReplace': return regexReplace(options as RegexReplaceOptions, value);
    case 'regexCompose': return regexCompose(options as RegexComposeOptions, value);
    case 'typecast': return typecast(options as TypecastOptions, value);
    case 'textToJson': return textToJson(options as TextToJsonOptions, value);
    case 'restructure': return restructure(options as RestructureOptions, value);
    case 'print': return printValue(options as PrintValueOptions, value);
    case 'count': return count(options as CountOptions, value);
    case 'scrapeHtml': return scrapeHtml(options as ScrapeHtmlOptions, value);
    case 'reduce': return reduce(options as ReduceOptions, value);
    default: throw new Error(`Unknown transformation '${name}'`);
  }
}
