const _ = require('lodash');
const pasync = require('pasync');
const Individual = require('./individual');

/**
 * Wraps an array of individuals. Contains methods for operations across the
 * entire array, including fitness score calculation and mutation.
 * @private
 * @param {Array<Individual>} individuals - Array of individuals.
 * @param {Object} [settings={}] - Settings object from ::run method.
 */
class Population {
	constructor(individuals = [], settings = {}) {
		this.individuals = individuals;
		this.settings = settings;
	}

	/**
	 * Creates a population based on the provided settings. This method is used
	 * to create the initial population, and it will either be synchronous or
	 * asynchronous depending on the async.create setting.
	 * @param {Object} settings - Settings object from ::run method.
	 * @returns {Population|Promise<Population>} - Created instance, or a
	 *   promise resolving with one.
	 */
	static create(settings) {
		let { async } = settings;
		if (!async || !async.create) return this.createSync(settings);
		return this.createAsync(settings);
	}

	/**
	 * Synchrnously creates a population based on the provided settings.
	 * @param {Object} settings - Settings object from ::run method.
	 * @returns {Population} - Created instance.
	 */
	static createSync(settings) {
		let { generationSize, createChromosome, createArgs } = settings;
		let individuals = _.times(
			generationSize,
			() => Individual.createSync(createChromosome, createArgs)
		);
		return new Population(individuals, settings);
	}

	/**
	 * Asynchrnously creates a population based on the provided settings.
	 * @param {Object} settings - Settings object from ::run method.
	 * @returns {Promise<Population>} - Will resolve with the created instance.
	 */
	static createAsync(settings) {
		let { generationSize, createChromosome, createArgs, async } = settings;
		return pasync.timesLimit(
			generationSize,
			async.create,
			() => Individual.createAsync(createChromosome, createArgs)
		)
			.then((individuals) => new Population(individuals, settings));
	}

	/**
	 * Gets the highest-fitness individual from the population.
	 * @returns {Individual} - Individual with the highest fitness.
	 */
	getBest() {
		return _.maxBy(this.individuals, 'fitness');
	}

	/**
	 * Ensures the fitness property is set on every individual in the
	 * population. This will be done synchronously or asynchronous depending on
	 * the aysnc.fitness setting.
	 * @returns {Population|Promise<Population>} - The same population instance,
	 *   or a promise that will resolve with it once the operation is complete.
	 */
	setFitnesses() {
		let { async } = this.settings;
		if (!async || !async.getFitness) return this.setFitnessesSync();
		return this.setFitnessesAsync();
	}

	/**
	 * Synchronously ensures the fitness property is set on every individual in
	 * the population.
	 * @returns {Population} - The same population instance.
	 */
	setFitnessesSync() {
		for (let individual of this.individuals) {
			individual.setFitnessSync();
		}
		return this;
	}

	/**
	 * Asynchrnously ensures the fitness property is set on every individual in
	 * the population.
	 * @returns {Promise<Population>} - Will resolve with the instance once the
	 *   operation is complete.
	 */
	setFitnessesAsync() {
		return pasync.eachLimit(
			this.individuals,
			this.settings.async.getFitness,
			(individual) => individual.setFitnessAsync()
		)
			.then(() => this);
	}

	/**
	 * Performs a mutation operation across the entire population. Will be
	 * synchronous or asynchronous, depending on the async.mutate setting.
	 * @returns {Population|Promise<Population>} - Mutated population, or a
	 *   promise resolving with one.
	 */
	mutate() {
		let { async } = this.settings;
		if (!async || !async.mutate) return this.mutateSync();
		return this.mutateAsync();
	}

	/**
	 * Synchronously performs a mutation operation across the entire population.
	 * @returns {Population} - Mutated population.
	 */
	mutateSync() {
		let { mutationRate } = this.settings;
		if (mutationRate === 0) return this;
		return new Population(
			this.individuals.map((i) => i.mutateSync(mutationRate)),
			this.settings
		);
	}

	/**
	 * Asynchronously performs a mutation operation across the entire
	 *   population.
	 * @returns {Promise<Population>} - Will resolve with a mutated population.
	 */
	mutateAsync() {
		let { mutationRate, async } = this.settings;
		if (mutationRate === 0) return Promise.resolve(this);
		return pasync.mapLimit(
			this.individuals,
			async.mutate,
			(individual) => individual.mutateAsync(mutationRate)
		)
			.then((mutants) => new Population(mutants, this.settings));
	}
}

module.exports = Population;
