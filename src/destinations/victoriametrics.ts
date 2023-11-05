import { Output } from "./output";
import { logger } from '../logging';
import jp from 'jsonpath';
import axios from "axios";


type VictoriaMetricsOutputOptions = {
    url: string
    labels?: Record<string, string>,
}

type VictoriaMetricsWriteOptions = {
    labels?: Record<string, string>,
    metrics: {
        name: string,
        value: string // JSON path
        labels?: Record<string, string>
    }[],
}


export class VictoriaMetricsOutput extends Output {

    options: VictoriaMetricsOutputOptions

    constructor(name: string, disabled: boolean, options : VictoriaMetricsOutputOptions) {
		super(name, disabled)
        this.options = options;

        if(!options.url)
            throw new Error(`url must be specified in options for destination ${this.name}`);

        if(this.disabled)
			logger.warning(`destinations.${this.name}`, `Destination is disabled`)
    }

    async write(data: Record<string, any>, options: VictoriaMetricsWriteOptions): Promise<boolean> {

		if(this.disabled) {
			logger.warning(`destinations.${this.name}`, `Skip writing to output : disabled`)
			return true;
        }

        let lines = [];

        if(!options.metrics || options.metrics.length == 0)
            throw new Error(`No metric specified in options`);

        for(let m of options.metrics) {

            if(!m.name) throw new Error(`Metric name undefined`)
            if(!m.value) throw new Error(`'value' field should be defined for metric ${m.name}`)

            let value;
            const jpath = /^\$\{(.*)\}$/.exec(m.value)
            if(jpath && jpath[1] != '') {
                // This is a json path, resolve the value
                const result = jp.query(data, jpath[1]);

                if(result.length == 0)
                    continue
                else if(result.length != 1)
                    throw new Error(`Specified value '${value}' for metric '${m.name}' matches more than one entry in data`);
                
                value = result[0]
            }
            else
                throw new Error(`Invalid json path of value for metric '${m.name}'. Should be of format $\{<json-path>\}`)

            if(typeof(value) != 'number')
                value = Number(value)

            if(Number.isNaN(value))
                throw new Error(`Invalid value ${value} for metric '${m.name}'`)

            // See https://docs.victoriametrics.com/?highlight=remote%20write#json-line-format
            lines.push({
                metric: {
                    '__name__': m.name,
                    ...this.options.labels,
                    ...options.labels,
                    ...m.labels,
                },
                values: [ value ],
                timestamps: [ data['__timestamp_ms'] ]
            })
        }

        // Forward the lines to victoria metrics
        await axios.post(this.options.url + '/api/v1/import', lines.map(j => JSON.stringify(j)).join('\n'))

        return true
    }
}