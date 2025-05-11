import { CronJob } from 'cron';
import { applyTransformation, TransformationName, TransformationOptions } from './transformations';
import cloneDeep from 'lodash/cloneDeep';
import axios, { AxiosRequestConfig } from 'axios';
import { logger } from './logging';
import jp from 'jsonpath';

type JobData = Record<string, any> | string;

export interface JobConfig {
	schedule: {
		cron: string,
		runOnInit?: boolean,
		timezone?: string
	},

	input: InputConfig,
	outputs: [OutputConfig],
	autostart: boolean
}

interface RequestConfig {
	url: string,
	method?: 'get' | 'post' | 'put' | 'delete' | 'patch',
	headers?: Record<string, string>,
	data?: any
}

interface MergeConfig {
	requests: RequestConfig[],
	transformations?: Array<Transformation>
}

interface InputConfig {
	request?: RequestConfig,
	transformations?: Array<Transformation>,
	contentType?: string,
	merge?: MergeConfig
}

interface OutputConfig {
	to: string,
	transformations?: Array<Transformation>,
	options?: Record<string, any>
}

interface Transformation {
	name: TransformationName,
	options: TransformationOptions,
	source?: string,
	destination?: string
}

/** Apply the given transformations to the data */
function applyTransforms(scope: string, data: JobData, transforms: Array<Transformation>) : any {
	let cloned = cloneDeep(data);

	// Apply each transformation in the list
	transforms.forEach( (t, i) => {
		try {
			logger.debug(`${scope}.transformations[${i}]`, `Applying transformation (${t.name})`);
	
			if(typeof(cloned) === 'string') {
				if(t.source || t.destination)
					logger.warning(`${scope}.transformations[${i}]`, `source/destination specified but the input type is string, ignoring`);
				
				cloned = applyTransformation(t.name, t.options, cloned);
			}
			else if(typeof(cloned) === 'object' && t.source) {
				// Extract data at source path
				const sourceValue = jp.query(cloned, t.source);
				if(sourceValue.length === 0) {
					logger.warning(`${scope}.transformations[${i}]`, `source path '${t.source}' did not match any data, skipping transformation`);
					return cloned;
				}
				
				// Apply transformation on the extracted source data
				const transformedValue = applyTransformation(t.name, t.options, sourceValue.length === 1 ? sourceValue[0] : sourceValue);
				
				// If destination is specified, store result at the root key; otherwise replace at the source path
				if(t.destination) {
					// Assign transformedValue to the destination key at the root of the object
					(cloned as Record<string, any>)[t.destination] = transformedValue;
				} else {
					// Replace at source path
					jp.apply(cloned, t.source, () => transformedValue);
				}
			}
			else if(typeof(cloned) === 'object') {
				// Apply transformation on the entire object and handle result
				const transformedValue = applyTransformation(t.name, t.options, cloned);
				
				// If destination is specified, store the result at the root key
				if(t.destination) {
					// Assign transformedValue to the destination key at the root of the object
					(cloned as Record<string, any>)[t.destination] = transformedValue;
				} else {
					// Replace entire data with the transformation result
					cloned = transformedValue;
				}
			}
			else {
				logger.warning(`${scope}.transformations[${i}]`, `Can't apply transformation on input type ${typeof(cloned)}.`);
			}
			
		}
		catch(err) {
			throw new Error(`${scope}.transformations[${i}] (${t.name}) ${err}`);
		}
	});

	return cloned;
}


export class Job {

	jobName: string
	input: InputConfig
	outputs: Array<OutputConfig> = []
	cronJob : CronJob

	/** Callback functions to call for writing data to destination */
	outputTo : (destinationName: string, jobName: string, data: any, outputOptions: Record<string, any>) => Promise<boolean>

	constructor(name: string, config: JobConfig, outputTo: (destinationName: string, jobName: string, data: any, outputOptions: Record<string, any>) => Promise<boolean>) {
		logger.info(`jobs.${name}`, `Creating job '${name}'`)
		
		this.outputTo = outputTo;
		this.jobName = name;

		const {schedule, input, outputs} = config;

		// Validate the options
		if(!schedule)
			throw(new Error(`Undefined 'schedule' field in job '${name}'`));
		if(!input)
			throw(new Error(`Undefined 'intput' field in job '${name}'`));
		if(!outputs)
			throw(new Error(`Undefined 'outputs' field in job '${name}'`));
		if(!schedule.cron)
			throw(new Error(`Undefined 'cron' field in job.${name}.schedule`))
		if(!input.request && !input.merge)
			throw(new Error(`Undefined or invalid 'input.request' or 'input.merge' configuration in job ${name}`))

		this.input = input;
		this.outputs = outputs;
		this.run = this.run.bind(this);

		this.cronJob = new CronJob(schedule.cron, this.run, null, false, schedule.timezone ?? 'UCT', null, schedule.runOnInit ?? false);
	}

	start() {
		this.cronJob.start();
	}

	/** Execute the job */
	async run() {
		logger.info(`jobs:${this.jobName}`, `Running`);
		
		let data: JobData;
		let contentType = this.input.contentType;

		// --- Handle merge option ---
		if (this.input.merge) {
			const mergeCfg = this.input.merge;
			// Run all requests in parallel
			const responses = await Promise.all(
				mergeCfg.requests.map(async (req) => {
					const requestConfig: AxiosRequestConfig = {
						url: req.url,
						method: req.method ?? 'get',
						headers: req.headers,
						data: req.data
					};
					const reply = await axios(requestConfig);
					let result = reply.data;
					// Optionally apply merge.transformations
					if (mergeCfg.transformations && mergeCfg.transformations.length > 0) {
						result = applyTransforms(`jobs.${this.jobName}.input.merge`, result, mergeCfg.transformations);
					}
					return result;
				})
			);

			// Check all results are of the same type
			const firstType = Array.isArray(responses[0]) ? 'array' : typeof responses[0];
			if (!responses.every(r => (Array.isArray(r) ? 'array' : typeof r) === firstType)) {
				logger.error(`jobs:${this.jobName}`, "All merged results must be of the same type");
				return;
			}

			// Merge strategy
			if (firstType === 'array') {
				data = ([] as any[]).concat(...responses);
			} else if (firstType === 'object') {
				data = Object.assign({}, ...responses);
			} else {
				logger.error(`jobs:${this.jobName}`, "Merged results must be arrays or objects");
				return;
			}
		} else {
			// --- Regular single request ---
			if (!this.input.request || !this.input.request.url) {
				logger.error(`jobs:${this.jobName}`, "No request or merge specified in input");
				return;
			}
			const requestConfig: AxiosRequestConfig = {
				url: this.input.request.url,
				method: this.input.request.method ?? 'get',
				headers: this.input.request.headers,
				data: this.input.request.data
			};
			const reply = await axios(requestConfig);
			data = reply.data;

			if(!contentType) {
				// Automatically figure out the content type if not specified
				if(reply.headers['content-type'].toLowerCase().includes("text/html"))
					contentType = 'html';
				else if(reply.headers['content-type'].toLowerCase().includes("application/json"))
					contentType = 'json';
				else if(reply.headers['content-type'].toLowerCase().includes("text/plain"))
					contentType = 'text';
				else if(reply.headers['content-type'].toLowerCase().includes("text/csv"))
					contentType = 'csv';
				else {
					logger.error(`jobs:${this.jobName}`, `Unknown content type '${reply.headers['content-type']}'`)
					return;
				}
				logger.debug(`jobs:${this.jobName}`, `Detected content type: ${contentType}`);
			}
		}

		// Apply input transformations if any
		if(this.input.transformations && this.input.transformations.length > 0) {
			data = applyTransforms(`jobs.${this.jobName}.input`, data, this.input.transformations);
		}

		// Data at the end of input transformations should be JSON
		if(typeof(data) != 'object') {
			logger.error(`jobs.${this.jobName}`, "Data must be json at the end of the input transformations");
			return;
		}

		// Inject metadata
		data["__timestamp_ms"] = Math.floor(new Date().getTime());
		data["__job_name"] = this.jobName;

		// Send to each output
		this.outputs.forEach( (o, i) => {
			
			// Apply output transformations if any, and do it only for this output
			let _data = !!o.transformations ? applyTransforms(`jobs.${this.jobName}.outputs[${i}]`, data, o.transformations) : data;

			// Send the result to the destionation
			logger.debug(`jobs.${this.jobName}.outputs[${i}]`, `Writing data to destination '${o.to}'`);
			this.outputTo(o.to, this.jobName, _data, o.options ?? {});
		});
	}

	stop() {
		this.cronJob.stop()
	}
}