import { Type } from "js-yaml";

export interface TypeCastTransformOptions {
}

export interface RegexTransformOptions {
	pattern: string,
	index?: number
}

export interface ReplaceTransformOptions {
	replaceWith: string,
	search: string
}


function typecastTransform(options: TypeCastTransformOptions, value: any) : any {
	return Number(value);
}

function regexTransform({pattern, index}: RegexTransformOptions, text: string) : string | null {
	let re = new RegExp(pattern);

	let res = re.exec(text);
	console.log('index', index, res, pattern);

	if(!res)
		return null;

	if(index !== undefined && res.length > index + 1)
		return res[index];
	else if(index === undefined && res.length > 1)
		return res[1];
	else
		return null;
}

function replaceTransform({search, replaceWith}: ReplaceTransformOptions, text: string) : string {
	return text.replace(search, replaceWith);
}

export function applyTransformation(name: string, options: Record<string, any>, value: any) : any {
	
	console.log("Applying transformation", name, "on value", value);
	switch(name) {
		case 'regex':
			return regexTransform(options as RegexTransformOptions, value);

		case 'replace':
			return replaceTransform(options as ReplaceTransformOptions, value);

		case 'typecast':
			return typecastTransform(options as TypeCastTransformOptions, value);
	}
}