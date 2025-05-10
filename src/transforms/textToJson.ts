/**
 * TextToJson
 */

export interface TextToJsonOptions {
}

export function textToJson(options: TextToJsonOptions, value: any) : any {
  return JSON.parse(value);
}
