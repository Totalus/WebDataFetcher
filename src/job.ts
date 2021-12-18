
import { CronJob } from 'cron';
import { applyTransformation } from './transform/transformations';
import { scrapeHtml } from './scraper';
import cloneDeep from 'lodash/cloneDeep';
import axios from 'axios';

type JobData = Record<string, any> | string;

export interface JobOptions {
	schedule: {
		cron: string
	},

	inputs: InputConfig,
	outputs: OutputConfig
}

interface InputConfig {
	url: string,
	template?: Record<string, any>,
	transformations?: Array<Transformation>
}

interface OutputConfig {
	to: string,
	[key: string]: any,
	transformations?: Array<Transformation>,
	options?: Record<string, any>
}

interface Transformation {
	name: string,
	target?: string,
	options: Record<string, any>
}

/** Apply the given transformations to the data */
function applyTransforms(data: JobData, transforms: Array<Transformation>) : any {
	let cloned = cloneDeep(data); // Create a copy to avoid affecting the original

	// Apply each transformation in the list
	transforms.forEach( (t, index) => {
		if(typeof(cloned) === 'string') {
			if(!!t.target) {
				console.log(`target specified for a string input value, ignoring target.`);
			}
			cloned = applyTransformation(t.name, t.options, cloned);
		}
		else if(typeof(cloned) === 'object') {
			if(!t.target) {
				console.log("Error: Can't apply transform to json without a specified target");
				return;
			}
			
			// If target is specified, apply only to the given target
			// TODO: find a better way to match the target (jsonpath)
			if(!!cloned[t.target])
			cloned[t.target] = applyTransformation(t.name, t.options, cloned[t.target]);
		}
		else
		return cloned;
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

	constructor(name: string, options: Record<string, any>, outputTo: (destinationName: string, jobName: string, data: any, outputOptions: Record<string, any>) => Promise<boolean>) {
		console.log(`Creating job '${name}'`);
		
		this.outputTo = outputTo;
		this.jobName = name;

		const {schedule, input, outputs} = options;

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

		this.cronJob = new CronJob(schedule.cron, this.run);
	}

	start() {
		this.cronJob.start();
		this.run(); // To run the job directly on start (for testing)
	}

	/** Execute the job */
	async run() {
		console.log(`INFO [job:${this.jobName}] Running`)
		
		// Fetch the input (scrape html page)
		let reply = await axios.get(this.input.url);

		let contentType = null;
		if(reply.headers['content-type'].includes("text/html"))
			contentType = 'html';
		else if(reply.headers['content-type'].includes("application/json"))
			contentType = 'json';
		else if(reply.headers['content-type'].includes("text/plain"))
			contentType = 'text';
		else if(reply.headers['content-type'].includes("text/csv"))
			contentType = 'text';
		else {
			console.warn(`ERROR [job:${this.jobName}] Unknown content type '${reply.headers['content-type']}'`);
			return;
		}

		let data : JobData;
		if(contentType === 'html' && !!this.input.template)
			data = scrapeHtml(reply.data, this.input.template);
		else
			data = reply.data;
		
		//let data : Record<string, any> = await scrapeUrl(this.input.url, this.input.template);

		// Apply input transforms if any
		if(!!this.input.transformations)
			data = applyTransforms(data, this.input.transformations)

		// console.log(this.outputs)
		this.outputs.forEach( (o, i) => {
			
			// Apply output transforms if any, and do it only for this output
			let _data = !!o.transformations ? applyTransforms(data, o.transformations) : data;
				
			// Send the result to the destionation
			this.outputTo(o.to, this.jobName, _data, o.options ?? {});
		});

		if(typeof(data) != 'object') {
			console.log(`ERROR [jobs.${this.jobName}] Data is not json at the end of the transformation pipeline`);
			return;
		}

		// Add metadata to the resulting data
		data["__timestamp_ms"] = Math.floor(new Date().getTime());
		data["__job_name"] = this.jobName;
	}

	stop() {
		this.cronJob.stop()
	}

}