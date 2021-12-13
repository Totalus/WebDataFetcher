
import { CronJob } from 'cron';
import { applyTransformation } from './transform/transformations';
import { scrapeUrl } from './scraper';

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
	[key: string]: any
}

interface Transformation {
	name: string,
	target?: string,
	options: Record<string, any>
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

		// console.log(this.outputs)
		this.outputs.forEach(o => {
			// TODO: apply output transform

			this.outputTo(o.to, this.jobName, data, {});
		});
	}

	stop() {
		this.cronJob.stop()
	}

}