
import * as yargs from 'yargs';
import * as yaml from 'js-yaml';
import * as fs from 'fs';

const argv = yargs
	.option('config', {
		alias: 'c',
		type: 'string'
	})
	.help()
	.alias('help', 'h')
	.argv;

class Scraper {

	constructor() {

	}

	addJob(name: string, options: any) : boolean {
		return true;
	}
	
	listJobs(): Array<string> {
		return [];
	}
	
	registerDestination(name: string, options: any) {
		
	}
	
}


const scraper = new Scraper()

if(!!argv.config) {
	// Load configuration
	const doc = yaml.load(fs.readFileSync(argv.config, 'utf-8')) as Record<string, any>;

	console.log(doc);

	// Register destinations
	if(!!doc?.destination) {
		Object.entries(doc.destination).forEach(([name, opt]) => {
			scraper.registerDestination(name, opt);
		});
	}

	// Create jobs
	if(!!doc?.jobs) {
		Object.entries(doc.jobs).forEach(([name, opt]) => {
			scraper.addJob(name, opt);
		});
	}
}

