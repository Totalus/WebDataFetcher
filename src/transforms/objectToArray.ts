/**
 * ObjectToArray
 * Converts an object to an array of key-value pair objects in the format { "key": "<key>", "value": <value> }
 */

export interface ObjectToArrayOptions {
  keyField?: string;   // Optional name for the key field (defaults to "key")
  valueField?: string; // Optional name for the value field (defaults to "value")
}

export function objectToArray(options: ObjectToArrayOptions, value: any): any[] {
  // Ensure value is an object
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error("Value must be an object for 'objectToArray' transformation");
  }

  // Get field names, defaulting if not provided
  const keyField = options?.keyField || "key";
  const valueField = options?.valueField || "value";

  // Convert the object to an array of key-value pairs
  return Object.entries(value).map(([key, val]) => ({
    [keyField]: key,
    [valueField]: val
  }));
}
