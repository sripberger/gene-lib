const Chromosome = require('./chromosome');
const _ = require('lodash');
const XError = require('xerror');

/**
 * Another base class for chromosomes which caches the results of fitness
 * calculations internally. Use this class if you need to call `#getFitness` in
 * the other chromsome methods. See the Chromsome class for more information.
 */
class CachingChromosome extends Chromosome {
	/**
	 * Should calculate the fitness of the chromosome. You should override this
	 * method instead of `#getFitness.`
	 * @abstract
	 * @returns {number|Promise<number>} The fitness of the chromsome, or a
	 *   promise resolving with it. If a promise is to be returned, you must
	 *   set the async.fitness option.
	 */
	calculateFitness() {
		throw new XError(
			XError.UNSUPPORTED_OPERATION,
			'CachingChromosome subclasses must override #calculateFitness.'
		);
	}

	/**
	 * Calls `#calculateFitness` the first time it is invoked, and simply
	 * returns the same result for all future calls.
	 * @returns {number|Promise<number>} Result of `#calculateFitness`
	 */
	getFitness() {
		if (_.isNil(this._fitness)) this._fitness = this.calculateFitness();
		return this._fitness;
	}
}

module.exports = CachingChromosome;
