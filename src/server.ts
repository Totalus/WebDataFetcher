
import * as yargs from 'yargs';

const argv = yargs
	.option('config', {
		alias: 'c',
		type: 'string'
	})
	.help()
	.alias('help', 'h')
	.argv;

class Scraper {

	constructor() {}
	// storages : Output[]

	addJob(name: string, options: any) : boolean {
		return true;
	}
	
	listJobs(): Array<string> {
		return [];
	}
	
	registerOutput(name: string, options: any) {
		
	}
	
}


const scraper = new Scraper()

if(!!argv.config) {
	// Load configuration

	// Create outputs

	// Create jobs

}

