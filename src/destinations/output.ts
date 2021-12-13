
export class Output {

	name: string

	constructor(name: string) {
		this.name = name;
	}

	async write(data: Record<string, any>, options: Record<string, any>) : Promise<boolean> {
		return true;
	}
}