
import { CronJob } from 'cron';
import { applyTransformation } from './transform/transformations';
import { scrapeUrl } from './scraper';
import cloneDeep from 'lodash/cloneDeep';

export interface JobOptions {
	schedule: {
		cron: string
	},

	inputs: {
		url: string,
		template: string | Record<string, any>
	},

	outputs: {
		to: string,
		[ key: string ]: any
	}
}

interface InputConfig {
	url: string,
	template: string | Record<string, any>,
	transforms?: Array<Transformation>
}

interface OutputConfig {
	to: string,
	[key: string]: any,
	transforms?: Array<Transformation>
}

interface Transformation {
	name: string,
	target?: string,
	options: Record<string, any>
}

/** Apply the given transformations to the data */
function applyTransforms(data: Record<string, any>, transforms: Array<Transformation>) : any {
	let cloned = cloneDeep(data); // Create a copy to avoid affecting the original

	// Apply each transformation in the list
	transforms.forEach(t => {

		// If target is specified, apply only to the given target
		// TODO: find a better way to match the target
		if(!!t.target && !!cloned[t.target])
			cloned[t.target] = applyTransformation(t.name, t.options, cloned[t.target]);
		else {
			Object.keys(cloned).forEach(key =>{
				cloned[key] = applyTransformation(t.name, t.options, cloned[key]);
			});
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

	constructor(name: string, options: Record<string, any>, outputTo: (destinationName: string, jobName: string, data: any, outputOptions: Record<string, any>) => Promise<boolean>) {
		console.log(`Creating job '${name}'`);
		
		this.outputTo = outputTo;
		this.jobName = name

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
		if(!input.url || !input.template)
			throw(new Error(`Undefined 'url' and/or 'template' field in job.${name}.input`))
					
		this.input = input;
		this.outputs = outputs;
		this.run = this.run.bind(this);

		this.cronJob = new CronJob(schedule.cron, this.run);
	}

	start() {
		// this.cronJob.start();
		this.run();
	}

	/** Execute the job */
	async run() {
		console.log(`Running job ${this.jobName}`)
		
		// Fetch the input (scrape html page)
		let data : Record<string, any> = await scrapeUrl(this.input.url, this.input.template);
		
		// Add metadata to the resulting data
		data["__timestamp_ms"] = Math.floor(new Date().getTime())

		// Apply input transforms if any
		if(!!this.input.transforms)
			data = applyTransforms(data, this.input.transforms)

		// console.log(this.outputs)
		this.outputs.forEach(o => {
			
			// Apply output transforms if any, and do it only for this output
			let _data = !!o.transforms ? applyTransforms(data, o.transforms) : data;

			// Send the result to the destionation
			this.outputTo(o.to, this.jobName, _data, {});
		});
	}

	stop() {
		this.cronJob.stop()
	}

}