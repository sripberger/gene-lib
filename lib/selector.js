const XError = require('xerror');

/**
 * Base Selector class. Extend this to implement a custom selection method.
 * @param {Object} [settings={}] - Selector configuration object. Will be passed
 *  from the `::run` or '::runSync' method's settings.selectorSettings argument,
 *  if any.
 * @property {Object} [selectorSettings] - Set to provide default values for the
 *  settings object.
 * @property {Object} [async] - Set to specify asynchronous operations. Selector
 *   classes with this property set cannot be used with the `::runSync` method.
 *   @property {number|boolean} [async.add] - Maximum concurrency of
 *     asynchronous `#add` operations. `true` is interpeted as `1`. If set,
 *     `#add` must return a promise to signify when the operation is complete.
 *   @property {number|boolean} [async.select] - Maximum concurrency of
 *     asynchronous `#select` operations. `true` is interpeted as `1`. If set,
 *     `#select` must return a promise. Otherwise, it must return a single
 *     individual as normal.
 */
class Selector {
	constructor(settings = {}) {
		this.settings = settings;
	}

	/**
	 * Before selection begins, all individuals in the parent generation will
	 * be added to a selector using this method. You must override it to store
	 * the individuals in a manner appropriate for your selection
	 * method.
	 * @abstract
	 * @param {Object} individual - Individual to add to the selector.
	 *   @param {number} individual.fitness - Individual's fitness.
	 *   @param {Object} individual.chromosome - Individual's chromosome.
	 * @returns {undefined|Promise} Return a promise and set aysnc.add if the
	 *   add operation is asynchronous.
	 */
	add() {
		throw new XError(
			XError.UNSUPPORTED_OPERATION,
			'Selector subclass must override the #add method.'
		);
	}

	/**
	 * Once all potential parent individuals are added to the selector, parents
	 * will be selected using this method. You must override it to return a
	 * single individual from the stored potentials.
	 * @abstract
	 * @returns {Object|Promise<Object>} A single individual, or a promise that
	 *   resolves with one if the select operation is asynchronous. In this
	 *   case, make sure you set async.select.
	 */
	select() {
		throw new XError(
			XError.UNSUPPORTED_OPERATION,
			'Selector subclass must override the #select method.'
		);
	}
}

module.exports = Selector;
