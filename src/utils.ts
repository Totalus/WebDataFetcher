
import { cloneDeep } from "lodash";
import jp from 'jsonpath';

export function simplifyString(string: string) {

	if(!string)
		return string;

	let s = string.trim().replace('\t', ' ').replace('\n',' ');

	while(s.includes('  '))
		s = s.replace('  ', ' ');

	return s;
}



/**
 * Replace json path of an object with the corresponding values in the given data.
 * Returns a copy of the object with resolved values. Does not touch the original object.
 */
export function resolveJsonPath(data: Record<string, any>, object: Record<string, any>) : Record<string, any> {
	const copy = cloneDeep(object);

	function resolve(data: Record<string, any>, obj: Record<string, any>) : any {
		switch(typeof(obj)) {
			case "object":
				if(Array.isArray(obj)) {
					return obj.map(e => resolve(data, e));
				}
				else {
					for(let k of Object.keys(obj))
						obj[k] = resolve(data, obj[k]);
				}
				break;
	
			case "string":
				const m = /^\$\{(.*)\}$/.exec(obj);
				if(m) {
					// This is a json path, resolve the value
					const result = jp.query(data, m[1]);

					if(result.length == 0)
						return null;
					if(result.length > 1)
						throw new Error(`Could not resolve JsonPath ${m[1]}: more than one result (${result.length} results)`);

					return result[0];
				}
				break;

			default:
				throw new Error(`resolveJsonPath: Unsupported object type '${typeof(obj)}'`)
		}

		return obj;
	}

	return resolve(data, copy);
}
