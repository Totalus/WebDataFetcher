/**
 * TextToJson
 */

export interface TextToJsonOptions {
}

export function textToJson(options: TextToJsonOptions, value: any) : any {
  if(typeof value !== 'string') throw new Error("Value must be a string for 'textToJson' transformation");
  
  try {
    return JSON.parse(value);
  } catch (error) {
    throw new Error(`Failed to parse text as JSON: ${error}`);
  }
}
