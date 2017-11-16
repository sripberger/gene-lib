const _ = require('lodash');
const XError = require('xerror');

/**
 * Base class for chromosomes. It is not necessary for your chromosome objects
 * to inherit from this class. They must, however, implement its instance
 * methods.
 * @property {Object} [async] - Set to specify asynchronous operations.
 *   Chromosome classes with this property set cannot be used with the
 *   `::runSync` method.
 *   @property {number|boolean} [async.getFitness] - Maximum concurrency of
 *     asynchronous `#getFitness` operations. `true` is interpeted as `1`.
 *     If set, `#getFitness` must return a promise. Otherwise, it must return a
 *     number as normal.
 *   @property {number|boolean} [async.crossover] - Maximum concurrency of
 *     asynchronous `#crossover` operations. `true` is interpeted as `1`. If
 *     set, `#crossover` must return a promise. Otherwise, it must return a
 *     single child or array of children as normal.
 *   @property {number} [async.mutate] - Maximum concurrency of asynchronous
 *     `#mutate' operations. `true` is interpeted as `1`. If set, `#mutate` must
 *     return a promise. Otherwise, it must return a single mutant chromosome as
 *     normal.
 */
class Chromosome {
	/**
	 * Performs a duck-type check on an object, to ensure it implements the
	 * required chromosome methods.
	 * @param {Object} obj - Object to check.
	 * @returns {boolean} True if the object is a chromosome, false otherwise.
	 */
	static isChromosome(obj) {
		return !!obj && _.isFunction(obj.getFitness);
	}

	/**
	 * Should create a new chromosome for the initial population, potentially
	 * using the provided arguments. You must implement this method if and only
	 * if you're using the `::run` method's settings.chromosomeClass option.
	 * @abstract
	 * @param {...*} args - Arguments provided by the `::run` method's
	 *   settings.createArg or settings.createArgs options.
	 * @returns {Object|Promise<Object>} A chromosome object, or a promise that
	 *   resolves with one. If a promise is to be returned, you must set the
	 *   async.create option.
	 */
	static create() {
		throw new XError(
			XError.UNSUPPORTED_OPERATION,
			'Chromosome ::create method not implemented. Override it, or ' +
			'replace your chromosomeClass setting with a createChromosome ' +
			'setting.'
		);
	}

	/**
	 * Should get the fitness of the chromosome. Normally this method will
	 * only be called once for a given chromsome. The result will be cached
	 * internally in gene-lib. If you need access to the fitness in one of the
	 * other chromsome methods, however, and still wish to make sure not to
	 * perform calculations multiple times, consider using the CachingChromsome
	 * class.
	 * @abstract
	 * @returns {number|Promise<number>} The fitness of the chromsome, or a
	 *   promise resolving with it. If a promise is to be returned, you must
	 *   set the async.getFitness option.
	 */
	getFitness() {
		throw new XError(
			XError.UNSUPPORTED_OPERATION,
			'Chromsome subclasses must override #getFitness'
		);
	}

	/**
	 * Should return the result of a crossover operation, without changing any
	 * parents. You must implement this method if and only if the
	 * settings.crossoverRate is greater than zero, or the
	 * settings.manualCrossoverCheck option is set.
	 * @abstract
	 * @param {...Object} others - Other parent chromosome objects. The number
	 *   of them will equal settings.parentCount
	 * @param {number} rate - Crossover rate given by settings.crossoverRate.
	 *   Crossovers are already rate-checked internally, so there is usually no
	 *   need to use this argument, but it is included just in case.
	 * @returns {Object|Array<Object>|Promise<Object>|Promise<Array>} A single
	 *   child, an array of children, or a promise that resolves with either.
	 *   The length of the result must match settings.childCount. If a promise
	 *   is to be returned, you must set the async.crossover option.
	 */
	crossover() {
		throw new XError(
			XError.UNSUPPORTED_OPERATION,
			'Chromsome subclasses must override #crossover if there is a ' +
			'nonzero crossover rate.'
		);
	}

	/**
	 * Should return the result of a mutation operation, without changing the
	 * original. You must implement this method if and only if the
	 * settings.mutationRate is greater than zero.
	 * @abstract
	 * @param {number} rate - Mutation rate given by settings.mutationRate.
	 * @returns {Object|Promise<Object>} A mutant chromosome, or a promise that
	 *   resolves with one. if a promise is to be returned, you must set the
	 *   async.mutate option.
	 */
	mutate() {
		throw new XError(
			XError.UNSUPPORTED_OPERATION,
			'Chromsome subclasses must override #mutate if there is a ' +
			'nonzero mutation rate.'
		);
	}
}

module.exports = Chromosome;
