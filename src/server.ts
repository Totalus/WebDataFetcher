
import * as yargs from 'yargs';
import * as yaml from 'js-yaml';
import * as fs from 'fs';
import { Job } from './job';
import { ConsoleOutput } from './destinations/console';
import { Output } from './destinations/output';

const argv = yargs
	.option('config', {
		alias: 'c',
		type: 'string'
	})
	.help()
	.alias('help', 'h')
	.argv;

class Scraper {

	jobs: Record<string, Job> = {}
	destinations: Record<string, Output> = {}

	constructor() {
		this.outputTo = this.outputTo.bind(this);
	}

	addJob(name: string, options: any) {
		// Create a cron job
		console.log(`Adding job '${name}'`);

		if(!!this.jobs[name]) {
			console.error(`Job '${name}' already exists`);
			return;
		}

		let j : Job;
		try {
			j = new Job(name, options, this.outputTo);
			this.jobs[name] = j;
			j.start();
		}
		catch(exception){
			console.info(`Could not create job ${name} : ${exception}`);
			return;
		}
	}
	
	registerDestination(name: string, options: any) {
		const {type} = options;

		if(type == 'console') {
			console.log(`registerDestination '${name}'`);
			this.destinations[name] = new ConsoleOutput(name);
		}
		else {
			console.error(`Invalid destination type '${type}' for destination '${name}'`)
		}
	}

	/** Called when a job wants to write data to a destination */
	async outputTo(destinationName: string, jobName: string, data: any, options: Record<string, any>) : Promise<boolean> {
		let target = this.destinations[destinationName];
		if(!target) {
			console.error(`Job '${jobName}' trying to output data to a destination that does not exist: '${destinationName}'.`)
			return false;
		}

		console.log("Writing data to", destinationName);
		return target.write(jobName, data, options);
	}
}

const scraper = new Scraper()

if(!!argv.config) {
	console.log('Loading config file', argv.config);

	// Load configuration
	const doc = yaml.load(fs.readFileSync(argv.config, 'utf-8')) as Record<string, any>;

	// Register destinations
	if(!!doc?.destinations) {
		Object.entries(doc.destinations).forEach(([name, config]) => {
			scraper.registerDestination(name, config);
		});
	}

	// Create jobs
	if(!!doc?.jobs) {
		Object.entries(doc.jobs).forEach(([name, config]) => {
			scraper.addJob(name, config);
		});
	}
}

// function shutdown() {
// 	scraper.shutdown()
// }

// process.on('SIGTERM', shutdown);
// process.on('SIGINT', shutdown);