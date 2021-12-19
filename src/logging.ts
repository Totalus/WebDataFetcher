


export const logger = {

	logLevel: 3,
	// 0 = No logging
	// 1 = Error
	// 2 = Warning
	// 3 = Info
	// 4 = Debug

	setLogLevel: (level: string) => {
		switch(level.toLowerCase()) {
			case "debug": logger.logLevel = 4; break;
			case "info": logger.logLevel = 3; break;
			
			case "warn":
			case "warning":
					logger.logLevel = 2; break;
					
			case "error": logger.logLevel = 1; break;
			case "none": logger.logLevel = 0; break;

			default:
				logger.logLevel = 3;
		}
	},

	error: (scope: string, message: string) => {
		if(logger.logLevel >= 1)
		logger.log("ERROR", scope, message);
	},
	
	info: (scope: string, message: string) => {
		if(logger.logLevel >= 3)
		logger.log("INFO ", scope, message);
	},
	
	debug: (scope: string, message: string) => {
		if(logger.logLevel >= 4)
			logger.log("DEBUG", scope, message);
	},

	warning: (scope: string, message: string) => {
		if(logger.logLevel >= 2)			
			logger.log("WARN ", scope, message);
	},

	log: (level: string, scope: string, message: string) => {
		console.log(`${level} [${scope}] ${message}`);
	}
}