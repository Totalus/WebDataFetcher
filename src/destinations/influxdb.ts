import {InfluxDB, Point, HttpError, WriteApi} from '@influxdata/influxdb-client';
import { logger } from '../logging';
import { Output } from './output';
import jp from 'jsonpath';

export interface InfluxdbOutputOptions {
	url: string,
	token: string,
	organisation: string,
	bucket: string,
	defaultTags?: Record<string, string>
}

export interface InfluxdbWriteOptions {
	fields: Record<string, string>,
	tags?: Record<string, string>,
	measurement?: string,
}

export class InfluxdbOutput extends Output {
	writeApi : WriteApi

	constructor(name: string, disabled: boolean, options : InfluxdbOutputOptions) {
		super(name, disabled)

		if(this.disabled)
			logger.warning(`[destinations.${this.name}]`, `Destination is disabled`)

		// Create a write api instance
		const {url, token, organisation, bucket, defaultTags} = options;

		// Verify required fields
		if(!url) throw(new Error(`Can't initialize influxdb destination '${name}'. Missing required option 'url'`))
		if(!token) throw(new Error(`Can't initialize influxdb destination '${name}'. Missing required option 'token'`))
		if(!organisation) throw(new Error(`Can't initialize influxdb destination '${name}'. Missing required option 'organisation'`))
		if(!bucket) throw(new Error(`Can't initialize influxdb destination '${name}'. Missing required option 'bucket'`))

		// console.log(`Initializing influxdb output ${name} : url=${url} bucket=${bucket} token=${token}`);
		this.writeApi = new InfluxDB({url, token}).getWriteApi(organisation, bucket, 'ms') // Expect timestamp in seconds
		
		if(!defaultTags)
			return;
		
		for(let [key, value] of Object.entries(defaultTags)) {
			this.writeApi.useDefaultTags({ [key]:value });
		}
	}

	async write(data: any, options: InfluxdbWriteOptions) : Promise<boolean> {

		const { fields, tags = {}, measurement = "default" } = options;

		if(this.disabled) {
			logger.warning(`destinations.${this.name}`, `Skip writing to output : disabled`)
			return true;
		}

		let point = new Point(measurement);
		point.timestamp(data["__timestamp_ms"]);
		
		if(!!tags) {
			Object.entries(tags).forEach( ([key, target]) => {

				let value = target;

				const m = /^\$\{(.*)\}$/.exec(target)
				if(!!m) {
					// This is a json path, resolve the value
					const result = jp.query(data, m[1]);
					if(result.length !== 1)
						throw new Error(`Specified target '${target}' matches more than one entry`);
					value = result[0]
				}

				point.tag(key, value);
			});
		}

		if(!!fields) {
			Object.entries(fields).forEach( ([key, target]) => {
				let value = target;

				const m = /^\$\{(.*)\}$/.exec(target)
				if(!!m) {
					// This is a json path, resolve the value
					const result = jp.query(data, m[1]);
					if(result.length !== 1)
						throw new Error(`Specified target '${target}' matches more than one entry`);
					value = result[0]
				}

				switch(typeof(value)) {
					case 'string': point.stringField(key, value); break;
					case 'number': point.floatField(key, value); break;
					default: throw new Error(`Specified target value must be string or number`);
				}
			});
		}
		
		this.writeApi.writePoint(point);
		this.writeApi.flush()
		.catch(err => { 
			logger.error(`destinations.${this.name}`, `Could not write to influxDB: ${err}`); 
		})
		return true;
	}
}
