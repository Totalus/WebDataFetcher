
import { JSDOM } from 'jsdom';
import { simplifyString } from './utils.js';

export function scrapeElement(htmlElement, template) {
	let t = template;

	if(typeof(t) === 'string') {
		let element = htmlElement.querySelector(t);
		return simplifyString(element?.textContent) ?? null;
	}
	else if(typeof(t) === 'object' && !Array.isArray(t)) {
		if('cssSelector' in t) {
			let element = htmlElement.querySelector(t.cssSelector);

			if('attribute' in t)
				return element.attributes.getNamedItem(t.attribute)?.value ?? null;
			else
				return scrapeElement(element, t.template);
		}
		else {
			let result = {};
			for(let tag in template)
				result[tag] = scrapeElement(htmlElement, template[tag]);

			// console.log('object template with tags:', Object.keys(template));
			return result;
		}
	}
	else if(typeof(t) === 'object' && Array.isArray(t)) {
		// console.log('array template', template);
		let list = [];
		t = t[0];

		if(typeof(t) === 'string') {
			let elements = htmlElement.querySelectorAll(t);

			for(let el of elements) {
				list.push(simplifyString(el?.textContent) ?? null);
			}
		}
		else if(typeof(t) === 'object' && !Array.isArray(t)) {
			if('cssSelector' in t) {
				let elements = htmlElement.querySelectorAll(t.cssSelector);

				if('attribute' in t) {
					for(let el of elements)
						list.push(el.attributes.getNamedItem(t.attribute)?.value ?? null);
				}
				else if('ordered' in t) {
					let item = {};

					for(let i = 0; i < elements.length;) {
						let el = elements[i];
						let foundMatch = true;
						for(let o of t.ordered) {
							let value = null;
							if('template' in o) {
								value = scrapeElement(el, o.template);
							}
							else if('tag' in o && el.tagName === o.tag.toUpperCase()) {
								value = el?.textContent;
							}

							if(!value)
								continue;

							foundMatch = true;
							item[o.key] = value;
							
							if(i++ < elements.length)
								el = elements[i];
							else
								break;
						}

						if(!foundMatch)
							i++;

						list.push(item);
						item = {};
					}
				}
				else {
					for(let el of elements) {
						list.push(scrapeElement(el, t.template));
					}
				}
			}
			else {
				let temp = {};
				for(let key in t)
					temp[key] = [t[key]]; // Convert as list

				let data = scrapeElement(htmlElement, temp);

				let count = -1;
				for(let key in data) {
					if(count === -1)
						count = data[key].length;
					else
						count = data[key].length < count ? data[key].length : count;
				}

				for(let i = 0; i < count; i++) {
					let obj = {};
					for(let key in data) {
						obj[key] = data[key][i];
					}

					list.push(obj);
				}
			}
		}

		return list;
	}

	return null;
}



export function scrapeUrl(url, template) {
	return new Promise(async (resolve, reject) => {

		const dom = await JSDOM.fromURL(url).catch(err => console.log('caught error', err));

		if(!dom)
			return reject(new ServerError("Could not load URL"));

		resolve(scrapeElement(dom.window.document, template));
	});
}
