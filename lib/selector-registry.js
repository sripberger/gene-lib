const XError = require('xerror');

/**
 * Stores registered selector classes.
 * @private
 * @property {SelectorRegistry} defaultRegistry - Singleton instance.
 */
class SelectorRegistry {
	constructor() {
		this.classes = {};
	}

	/**
	 * Registers a new selector class.
	 * @param {String} key - Registration key. Will throw if key is already
	 *   registered.
	 * @param {Function} selectorClass - Selector class constructor.
	 * @returns {undefined}s
	 */
	register(key, selectorClass) {
		if (this.classes[key]) {
			throw new XError(
				XError.INVALID_ARGUMENT,
				`Selector key '${key}' is already registered.`
			);
		}
		this.classes[key] = selectorClass;
	}

	/**
	 * Gets the selector class for the provided.
	 * @param {String} key - Registration key. Will throw if not registered.
	 * @returns {Function} - Selector class constructor.
	 */
	get(key) {
		let selectorClass = this.classes[key];
		if (selectorClass) return selectorClass;
		throw new XError(
			XError.INVALID_ARGUMENT,
			`Selector key '${key}' is not registered.`
		);
	}

	/**
	 * Removes all keys and clases from the registry.
	 * @returns {undefined}
	 */
	clear() {
		this.classes = {};
	}
}

SelectorRegistry.defaultRegistry = new SelectorRegistry();

module.exports = SelectorRegistry;
