
// Color codes : https://stackoverflow.com/a/41407246
const Reset = "\x1b[0m"
const Bright = "\x1b[1m"
const Dim = "\x1b[2m"
const Reverse = "\x1b[7m"
const Hidden = "\x1b[8m"
 
const FgBlack = "\x1b[30m"
const FgRed = "\x1b[31m"
const FgGreen = "\x1b[32m"
const FgYellow = "\x1b[33m"
const FgBlue = "\x1b[34m"
const FgMagenta = "\x1b[35m"
const FgCyan = "\x1b[36m"
const FgWhite = "\x1b[37m"
 
const BgBlack = "\x1b[40m"
const BgRed = "\x1b[41m"
const BgGreen = "\x1b[42m"
const BgYellow = "\x1b[43m"
const BgBlue = "\x1b[44m"
const BgMagenta = "\x1b[45m"
const BgCyan = "\x1b[46m"
const BgWhite = "\x1b[47m"


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
			logger.log(`${BgRed + FgBlack}ERROR${Reset}`, scope, message);
	},
	
	info: (scope: string, message: string) => {
		if(logger.logLevel >= 3)
			logger.log(`${BgWhite + FgBlack}INFO ${Reset}`, scope, message);
	},
	
	debug: (scope: string, message: string) => {
		if(logger.logLevel >= 4)
			logger.log(`DEBUG`, scope, message);
	},

	warning: (scope: string, message: string) => {
		if(logger.logLevel >= 2)
			logger.log(`${BgYellow + FgBlack}WARN ${Reset}`, scope, message);
	},

	log: (level: string, scope: string, message: string) => {
		if(!!scope)
			console.log(`${level} (${scope}) ${message}`);
		else
			console.log(`${level} ${message}`);
	}
}