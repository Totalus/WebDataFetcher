
export interface InfluxdbOutputOptions {
	tags: Record<string, string>
	fields: Record<string, string | Number>
	target?: string
}


export class InfluxdbOutput {
	constructor(options : InfluxdbOutputOptions) {
	}

	write(data: any, options: any) {
		console.log("TODO: Write to influxdb", data);
	}
}
