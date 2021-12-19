
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
 * Function to apply a transformation on a value, by its name
 */
export function applyTransformation(name: string, options: Record<string, any>, value: any) : any {
	
	switch(name) {
		case 'regex_replace': return regexReplace(options as RegexReplaceOptions, value);
		case 'replace': return replace(options as ReplaceOptions, value);
		case 'typecast': return typecast(options as TypecastOptions, value);
		case 'text_to_json': return textToJson(options as TextToJsonOptions, value);
		default: throw new Error(`Unknown transformation '${name}'`);
	}
}