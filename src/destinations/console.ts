
import { Output } from './output';

export class ConsoleOutput extends Output {

	override async write(data: Record<string, any>, options: Record<string, any>) : Promise<boolean> {
		console.log(JSON.stringify(data))
		return true;
	}
}