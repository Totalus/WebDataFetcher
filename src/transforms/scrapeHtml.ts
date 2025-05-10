/**
 * ScrapeHtml
 * Transform HTML content into JSON using templates
 */

import { scrapeHtml as scrapeHtmlFromScraper } from '../scraper';

export interface ScrapeHtmlOptions {
  template: Record<string, any>;
}

export function scrapeHtml(options: ScrapeHtmlOptions, value: any): any {
  if (typeof value !== 'string') throw new Error("Value must be a string for 'scrapeHtml' transformation");
  if (!options?.template) throw new Error("Missing 'template' option in scrapeHtml transformation");
  
  return scrapeHtmlFromScraper(value, options.template);
}
