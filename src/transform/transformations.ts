
function typecastTransform() {

}

function regexTransform({pattern, index}: Record<string, any>, text: string) : string {
	let re = new RegExp(pattern);

	let res = re.exec(text);

	if(!res)
		return "null";

	if(res.length > index - 1)
		return res[index];
	else
		return res[0];
}

function replaceTransform({search, replaceWith}: Record<string, any>, text: string) : string {
	return text.replace(search, replaceWith);
}

export function applyTransformation(name: string, options: Record<string, any>, value: any) : any {
	
	console.log("Applying transformation", name, "on value", value);
	switch(name) {
		case 'regex':
			return regexTransform(options, value);

		case 'replace':
			return replaceTransform(options, value);
	}
}