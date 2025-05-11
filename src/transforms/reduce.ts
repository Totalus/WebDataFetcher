/**
 * Reduce
 * Applies a reduction operation on an array (or string) to produce a single value
 */
import { logger } from "../logging";

export type ReduceOperation = 'sum' | 'average' | 'count' | 'any' | 'all' | 'max' | 'min';

export interface ReduceOptions {
  operation: ReduceOperation;
  key?: string; // Optional field to access within array objects
}

export function reduce(options: ReduceOptions, value: any): any {
  if (!options?.operation) {
    throw new Error("Missing 'operation' option in reduce transformation");
  }

  // Handle strings for count operation
  if (typeof value === 'string' && options.operation === 'count') {
    if (options.key) {
      logger.warning('reduce', "key specified but the input type is string, ignoring");
    }
    return value.length;
  }

  // All other operations require an array
  if (!Array.isArray(value)) {
    throw new Error(`Value must be an array for 'reduce' transformation with operation '${options.operation}'`);
  }

  // If array is empty, return appropriate default values based on operation
  if (value.length === 0) {
    switch (options.operation) {
      case 'sum':
      case 'average':
        return 0;
      case 'count':
        return 0;
      case 'any':
        return false;
      case 'all':
        return true;
      case 'max':
      case 'min':
        return null;
      default:
        throw new Error(`Unknown operation '${options.operation}'`);
    }
  }

  // Process array values, handling the key option
  const processedValues = value.map(item => {
    if (options.key && typeof item === 'object' && item !== null) {
      return item[options.key];
    } else if (options.key) {
      logger.warning('reduce', `key '${options.key}' specified but array contains non-object elements, ignoring`);
      return item;
    }
    return item;
  });

  // Apply the appropriate reduction operation
  switch (options.operation) {
    case 'sum':
      return processedValues.reduce((acc, curr) => {
        const value = Number(curr);
        if (isNaN(value)) {
          throw new Error(`Cannot convert value '${curr}' to number for sum operation`);
        }
        return acc + value;
      }, 0);

    case 'average':
      const sum = processedValues.reduce((acc, curr) => {
        const value = Number(curr);
        if (isNaN(value)) {
          throw new Error(`Cannot convert value '${curr}' to number for average operation`);
        }
        return acc + value;
      }, 0);
      return sum / processedValues.length;

    case 'count':
      return processedValues.length;

    case 'any':
      return processedValues.some(Boolean);

    case 'all':
      return processedValues.every(Boolean);

    case 'max':
      return Math.max(...processedValues.map(val => {
        const numVal = Number(val);
        if (isNaN(numVal)) {
          throw new Error(`Cannot convert value '${val}' to number for max operation`);
        }
        return numVal;
      }));

    case 'min':
      return Math.min(...processedValues.map(val => {
        const numVal = Number(val);
        if (isNaN(numVal)) {
          throw new Error(`Cannot convert value '${val}' to number for min operation`);
        }
        return numVal;
      }));

    default:
      throw new Error(`Unknown operation '${options.operation}'`);
  }
}
