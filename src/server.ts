
import * as yargs from 'yargs';
import * as yaml from 'js-yaml';
import * as fs from 'fs';
import { Job, JobConfig } from './job';
import { ConsoleOutput } from './destinations/console';
import { Output } from './destinations/output';
import { InfluxdbOutput } from './destinations/influxdb';
import { logger } from './logging';

const argv = yargs
	.option('config', {
		alias: 'c',
		type: 'string'
	})
	.option('log-level', {
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

	addJob(name: string, config: JobConfig) {
		// Create a cron job
		logger.info(`jobs.${name}`, `Adding job ${name}`);

		if(!!this.jobs[name]) {
			logger.error(`jobs.${name}`, `Job named ${name} already exists.`)
			return;
		}

		let j : Job;
		try {
			j = new Job(name, config, this.outputTo);
			this.jobs[name] = j;

			if(config.autostart !== false) {
				logger.info(``, `Starting job '${name}'`);
				j.start();
			}
			else
				logger.debug(``, `Skipping starting job '${name}', autostart=false`);
		}
		catch(exception){
			logger.error(`jobs.${name}`, `Could not create job ${name} : ${exception}`);
			return;
		}
	}
	
	registerDestination(name: string, config: any) {
		const {type, options} = config;

		logger.debug(`destinations.${name}`, `Registrating destination ${name}`);

		if(type == 'console') {
			this.destinations[name] = new ConsoleOutput(name);
		}
		else if(type == 'influxdb') {
			try {
				this.destinations[name] = new InfluxdbOutput(name, options);
			}
			catch(error) {
				logger.error(`destinations.${name}`, `Could not register influxdb destination: ${error}`)
			}
		}
		else {
			logger.error(`destinations.${name}`, `Invalid destination type '${type}' for destination '${name}'`);
		}
	}

	/** Called when a job wants to write data to a destination */
	async outputTo(destinationName: string, jobName: string, data: any, options: Record<string, any>) : Promise<boolean> {
		let target = this.destinations[destinationName];
		if(!target) {
			logger.error(`jobs.${jobName}`, `Trying to output data to a destination that does not exist: '${destinationName}'.`)
			return false;
		}

		return target.write(data, options);
	}

	shutdown() {
		Object.keys(this.jobs).forEach(key => this.jobs[key].stop());
	}
}

const scraper = new Scraper()

if(!!argv.config) {
	logger.info(``, `Loading config file ${argv.config}`);

	// Load configuration
	const doc = yaml.load(fs.readFileSync(argv.config, 'utf-8')) as Record<string, any>;

	// Log level
	logger.setLogLevel(argv['log-level'] ?? doc?.logLevel);

	// Register destinations
	if(!!doc?.destinations) {
		Object.entries(doc.destinations).forEach(([name, config]) => {
			scraper.registerDestination(name, config);
		});
	}

	// Create jobs
	if(!!doc?.jobs) {
		Object.entries(doc.jobs).forEach(([name, config]) => {
			scraper.addJob(name, config as JobConfig);
		});
	}
}


function shutdown() {
	scraper.shutdown();
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);