
export function simplifyString(string) {

	if(!string)
		return string;

	let s = string.trim().replace('\t', ' ').replace('\n',' ');

	while(s.includes('  '))
		s = s.replace('  ', ' ');

	return s;
}
