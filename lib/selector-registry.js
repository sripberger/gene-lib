const XError = require('xerror');

class SelectorRegistry {
	constructor() {
		this.classes = {};
	}

	register(key, selectorClass) {
		if (this.classes[key]) {
			throw new XError(
				XError.INVALID_ARGUMENT,
				`Selector key '${key}' is already registered.`
			);
		}
		this.classes[key] = selectorClass;
	}

	get(key) {
		let selectorClass = this.classes[key];
		if (selectorClass) return selectorClass;
		throw new XError(
			XError.INVALID_ARGUMENT,
			`Selector key '${key}' is not registered.`
		);
	}

	clear() {
		this.classes = {};
	}
}

SelectorRegistry.defaultRegistry = new SelectorRegistry();

module.exports = SelectorRegistry;
