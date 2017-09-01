const ArraySelector = require('./array-selector');

/**
 * Selector class for fitness-proportional (roulette) selection.
 * @extends ArraySelector
 * @param {Object} [settings={}] - Selector configuration object. Will be passed
 *  from the `::run` method's settings.selectorSettings argument, if any.
 */
class RouletteSelector extends ArraySelector {
	constructor(settings) {
		super(settings);
		this.fitnessTotal = 0;
	}

	/**
	 * Adds the provided individual to the individuals array and updates
	 * the fitnessTotal.
	 * @param {Object} individual - Individual to add to the selector.
	 *   @param {number} individual.fitness - Individual's fitness.
	 *   @param {Object} individual.chromosome - Individual's chromosome.
	 * @returns {undefined}
	 */
	add(individual) {
		super.add(individual);
		this.fitnessTotal += individual.fitness;
	}

	/**
	 * Gets a random float to map to a selected individual based on fitnesses.
	 * @returns {number} A random float in [0, fitnessTotal)
	 */
	spin() {
		return this.fitnessTotal * Math.random();
	}

	/**
	 * Performs selection by calling #spin and mapping the result to an
	 * individual.
	 * @returns {Individual|null} Selected individual, or null if the selector
	 *   is empty.
	 */
	select() {
		let spinResult = this.spin();
		for (let individual of this.individuals) {
			let { fitness } = individual;
			if (spinResult < fitness) return individual;
			spinResult -= fitness;
		}
		return null;
	}
}

module.exports = RouletteSelector;
