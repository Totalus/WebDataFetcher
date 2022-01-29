
import jp from 'jsonpath';

/**
 * Replace
 */

interface ReplaceOptions {
	replaceWith: string,
	search: string
}

function replace(options: ReplaceOptions, text: string) : string {
	if(!options?.search) throw new Error("Missing 'search' option");
	if(options.replaceWith === undefined || options.replaceWith === null) throw new Error("Missing 'replaceWith' option");
	return text.replaceAll(options.search, options.replaceWith);
}

/**
 * RegexReplace
 */

interface RegexReplaceOptions {
	pattern: string,
	output: string,
}

function regexReplace(options: RegexReplaceOptions, value: string) : string {
	if(!options?.pattern) throw new Error("Missing 'pattern' option");
	if(!options.output) throw new Error("Missing 'output' option");
	return value.replace(new RegExp(options.pattern), options.output);
}

/**
 * RegexCompose
 */

 interface RegexComposeOptions {
	pattern: string,
	output: string,
}

function regexCompose(options: RegexComposeOptions, value: string) : string | null {
	if(!options?.pattern) throw new Error("Missing 'pattern' option");
	if(!options.output) throw new Error("Missing 'output' option");

	let re = new RegExp(options.pattern, 'gm');

	let m = re.exec(value);
	if(!m || m.length <= 1)
		return null;

	return m[0].replace(re, options.output);
}


/**
 * TypeCast
 */

interface TypecastOptions {
	targetType: string
}

function typecast(options: TypecastOptions, value: any) : any {
	
	if(!options?.targetType) throw new Error("Missing 'targetType' option");

	switch(options.targetType) {
		case 'number': return Number(value);
		case 'string': return String(value);
		default: return null;
	}
}


/**
 * TextToJson
 */

interface TextToJsonOptions {
}

function textToJson(options: TextToJsonOptions, value: any) : any {
	return JSON.parse(value);
}

/**
 * Restructure
 */

interface RestructureOptions {
	template: Record<string, any>
}

function restructure(options: RestructureOptions, value: any) : any {
	if(!options.template) throw new Error("Missing 'template' option in restructure transformation");

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

/**
 * PrintValue
 */

interface PrintValueOptions {}

function printValue(options: PrintValueOptions, value: any) {
	console.log(value);
	return value;
}


/**
 * Function to apply a transformation on a value, by its name
 */
export function applyTransformation(name: string, options: Record<string, any>, value: any) : any {
	
	switch(name) {
		case 'regexReplace': return regexReplace(options as RegexReplaceOptions, value);
		case 'regexCompose': return regexCompose(options as RegexComposeOptions, value);
		case 'replace': return replace(options as ReplaceOptions, value);
		case 'typecast': return typecast(options as TypecastOptions, value);
		case 'textToJson': return textToJson(options as TextToJsonOptions, value);
		case 'restructure': return restructure(options as RestructureOptions, value);
		case 'print': return printValue(options as PrintValueOptions, value);
		default: throw new Error(`Unknown transformation '${name}'`);
	}
}