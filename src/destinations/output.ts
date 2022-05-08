
export class Output {

	name: string
	disabled: boolean

	constructor(name: string, disabled: boolean) {
		this.name = name;
		this.disabled = disabled
	}

	async write(data: Record<string, any>, options: Record<string, any>) : Promise<boolean> {
		return true;
	}
}