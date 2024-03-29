
import { CronJob } from 'cron';
import { applyTransformation } from './transform/transformations';
import { scrapeHtml } from './scraper';
import cloneDeep from 'lodash/cloneDeep';
import axios from 'axios';
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

interface InputConfig {
	url: string,
	template?: Record<string, any>,
	transformations?: Array<Transformation>,
	contentType?: string,
	headers?: Record<string, string>
}

interface OutputConfig {
	to: string,
	transformations?: Array<Transformation>,
	options?: Record<string, any>
}

interface Transformation {
	name: string,
	target?: string,
	options: Record<string, any>
}

/** Apply the given transformations to the data */
function applyTransforms(scope: string, data: JobData, transforms: Array<Transformation>) : any {
	let cloned = cloneDeep(data);

	// Apply each transformation in the list
	transforms.forEach( (t, i) => {
		try {
			logger.debug(`${scope}.transformations[${i}]`, `Applying transformation (${t.name})`);
	
			if(typeof(cloned) === 'string') {
				if(!!t.target)
					logger.warning(`${scope}.transformations[${i}]`, `target specified but the input type is string, ignoring`);
				
				cloned = applyTransformation(t.name, t.options, cloned);
			}
			else if(typeof(cloned) === 'object' && !!t.target) {
				const nodes = jp.apply(cloned, t.target, (value) => applyTransformation(t.name, t.options, value));
			}
			else if(typeof(cloned) === 'object') {
				cloned = applyTransformation(t.name, t.options, cloned);
			}
			else {
				logger.warning(`${scope}.transformations[${i}]`, `Can't apply transformation on input type ${typeof(cloned)}.`);
			}
			return cloned;
		}
		catch(err) {
			logger.error(`${scope}.transformations[${i}]`, `${err}`);
			return null;
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
			throw(new Error(`Undefined 'intputs' field in job '${name}'`));
		if(!outputs)
			throw(new Error(`Undefined 'outputs' field in job '${name}'`));
		if(!schedule.cron)
			throw(new Error(`Undefined 'cron' field in job.${name}.schedule`))
		if(!input.url)
			throw(new Error(`Undefined 'url' and/or 'template' field in job.${name}.input`))

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
		
		// Fetch the input (scrape html page)
		let reply = await axios.get(this.input.url, {headers: this.input.headers});

		let contentType = this.input.contentType;

		if(!contentType) {
			// Automatically figure out the content type if not specified
			if(reply.headers['content-type'].toLowerCase().includes("text/html"))
				contentType = 'html';
			else if(reply.headers['content-type'].toLowerCase().includes("application/json"))
				contentType = 'json';
			else if(reply.headers['content-type'].toLowerCase().includes("text/plain"))
				contentType = 'text';
			else if(reply.headers['content-type'].toLowerCase().includes("text/csv"))
				contentType = 'text';
			else {
				logger.error(`jobs:${this.jobName}`, `Unknown content type '${reply.headers['content-type']}'`)
				return;
			}

			logger.debug(`jobs:${this.jobName}`, `Detected content type: ${contentType}`);
		}

		let data : JobData;
		if(contentType === 'html' && !!this.input.template)
			data = scrapeHtml(reply.data, this.input.template);
		else
			data = reply.data;
		
		//let data : Record<string, any> = await scrapeUrl(this.input.url, this.input.template);

		// Apply input transformations if any
		if(!!this.input.transformations)
			data = applyTransforms(`jobs.${this.jobName}.input`, data, this.input.transformations)

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