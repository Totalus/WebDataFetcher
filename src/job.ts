

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


class Job {
	constructor(name: string, options: JobOptions) {}

	/** Execute the job */
	run() {
		// Fetch inputs

		// Send to outputs
	}

}