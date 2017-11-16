const _ = require('lodash');

/**
 * Wrapper class that provides a consistent interface for working with user-
 * provided chromosome objects.
 * @private
 * @param {Object} chromosome - Wrapped chromosome object.
 */
class Individual {
	constructor(chromosome) {
		this.chromosome = chromosome;
	}

	/**
	 * Synchronously creates a new instance using the provided chromosome
	 * factory function and arguments.
	 * @static
	 * @param {Function} createChromosome - A function that should return a
	 *   chromosome object for the instance.
	 * @param {Array} [createArgs=[]] - Arguments for the create function.
	 * @returns {Individual} - Created instance.
	 */
	static createSync(createChromosome, createArgs = []) {
		return new Individual(createChromosome(...createArgs));
	}

	/**
	 * Asynchronously creates a new instance using the provided chromosome
	 * factory function and arguments.
	 * @static
	 * @param {Function} createChromosome - A function that should return a
	 *   chromosome object for the instance, or a promise resolving with one.
	 * @param {Array} [createArgs=[]] - Arguments for the create function.
	 * @returns {Promise<Individual>} - Will reoslve with the created instance.
	 */
	static createAsync(createChromosome, createArgs = []) {
		return createChromosome(...createArgs)
			.then((chromosome) => new Individual(chromosome));
	}

	/**
	 * Synchronously gets the fitness from the chromosome and sets it to the
	 * instance's `fitness` property. If it has already been set-- say, if this
	 * individual was copied from a previous generation, this method does
	 * nothing.
	 * @returns {undefined}
	 */
	setFitnessSync() {
		if (_.isNil(this.fitness)) this.fitness = this.chromosome.getFitness();
	}

	/**
	 * Asynchronously gets the fitness from the chromosome and sets it to the
	 * instance's `fitness` property. If it has already been set-- say, if this
	 * individual was copied from a previous generation, this method will
	 * resolve without doing anything.
	 * @returns {Promise} - Will resolve when the operation is complete.
	 */
	setFitnessAsync() {
		if (!_.isNil(this.fitness)) return Promise.resolve();
		return this.chromosome.getFitness()
			.then((fitness) => {
				this.fitness = fitness;
			});
	}

	/**
	 * Performs a synchronous crossover operation.
	 * @param {Array<Individual>} others - Other parent Individuals for the
	 *   crossover. Will usually contain just one, but if the user increased
	 *   the parentCount beyond 2, it will comtain more.
	 * @param {number} rate - Crossover rate, from settings.
	 * @returns {Array<Individual>} - Resulting Individuals.
	 */
	crossoverSync(others, rate) {
		let { chromosome } = this;
		let otherChromosomes = _.map(others, 'chromosome');
		let result = chromosome.crossover(...otherChromosomes, rate);
		let children = (_.isArray(result)) ? result : [ result ];
		return children.map((c) => new Individual(c));
	}

	/**
	 * Performs an asynchronous crossover operation.
	 * @param {Array<Individual>} others - Other parent Individuals for the
	 *   crossover. Will usually contain just one, but if the user increased
	 *   the parentCount beyond 2, it will comtain more.
	 * @param {number} rate - Crossover rate, from settings.
	 * @returns {Promise<Array>} - Will resolve with resulting Individuals.
	 */
	crossoverAsync(others, rate) {
		let { chromosome } = this;
		let otherChromosomes = _.map(others, 'chromosome');
		return chromosome.crossover(...otherChromosomes, rate)
			.then((result) => {
				let children = (_.isArray(result)) ? result : [ result ];
				return children.map((c) => new Individual(c));
			});
	}

	/**
	 * Performs a synchronous mutation operation.
	 * @param {number} rate - Mutation rate, from settings.
	 * @returns {Individual} - Mutated Individual.
	 */
	mutateSync(rate) {
		return new Individual(this.chromosome.mutate(rate));
	}

	/**
	 * Performs an asynchronous mutation operation.
	 * @param {number} rate - Mutation rate, from settings.
	 * @returns {Promise<Individual>} - Will resolve with the mutated
	 *   Individual.
	 */
	mutateAsync(rate) {
		return this.chromosome.mutate(rate)
			.then((mutant) => new Individual(mutant));
	}
}

module.exports = Individual;
