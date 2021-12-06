
import { CronJob } from 'cron';

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
	template: string | Record<string, any>
}

interface OutputConfig {
	to: string,
	[key: string]: any
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
		this.cronJob.start();
	}

	/** Execute the job */
	run() {
		console.log("Running job", this.jobName)
		
		// Fetch the input
		const data : Record<string, any> = {hello: "world"};

		// Apply input transform

		// Add timestamp to data
		data["__timestamp_ms"] = Math.floor(new Date().getTime())
		// data["__timestamp_s"] = Math.floor(new Date().getTime()/1000.0)
		
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