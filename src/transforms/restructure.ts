import jp from 'jsonpath';

/**
 * Restructure
 */

export interface RestructureOptions {
  template: Record<string, any>
}

export function restructure(options: RestructureOptions, value: any) : any {
  if(!options.template) throw new Error("Missing 'template' option in restructure transformation");
  
  if(typeof value !== 'object') throw new Error("Value must be an object for 'restructure' transformation");
  
  function recursiveBuild(_template: Record<string, any>) {
    let obj : Record<string, any> = {};

    Object.entries(_template).forEach( ([key, val]) => {
      if(typeof(val) === 'string') {
        const result = jp.query(value, val);
        if(result.length === 1)
          obj[key] = result[0];
        else
          obj[key] = result; // If we have multiple match, keep in an array
      }
      else if(typeof(val) === 'object') {
         obj[key] = recursiveBuild(val);
      }
    });

    return obj;
  }
  
  return recursiveBuild(options.template);
}
