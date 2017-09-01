const Selector = require('./selector');

/**
 * Base class for selectors that store individuals in an array, which will be
 * available at this.individuals. See the Selector class for more information.
 * @param {Object} [settings={}] - Selector configuration object. Will be passed
 *  from the `::run` method's settings.selectorSettings argument, if any.
 * @extends Selector
 */
class ArraySelector extends Selector {
	constructor(settings) {
		super(settings);
		this.individuals = [];
	}

	/**
	 * Adds the provided individual to the individuals array.
	 * @param {Object} individual - Individual to add to the selector.
	 *   @param {number} individual.fitness - Individual's fitness.
	 *   @param {Object} individual.chromosome - Individual's chromosome.
	 * @returns {undefined}
	 */
	add(individual) {
		this.individuals.push(individual);
	}
}

module.exports = ArraySelector;
