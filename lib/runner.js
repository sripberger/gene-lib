const pasync = require('pasync');
const GenePool = require('./gene-pool');
const Population = require('./population');

/**
 * Maintains state for a genetic algorithm run.
 * @private
 * @param {Population} population - Initial population.
 * @param {Object} [settings={}] - Settings object from ::run method.
 */
class Runner {
	constructor(population, settings = {}) {
		this.population = population;
		this.settings = settings;
		this.generationCount = 0;
		this.solution = null;
	}

	/**
	 * Synchronously creates a new runner based on the provided settings.
	 * @param {Object} settings - Settings object from ::run method.
	 * @returns {Runner} Created instance.
	 */
	static createSync(settings) {
		return new Runner(
			Population.createSync(settings).setFitnessesSync(),
			settings
		);
	}

	/**
	 * Asynchronously creates a new runner based on the provided settings.
	 * @param {Object} settings - Settings object from ::run method.
	 * @returns {Promise<Runner>} Will resolve with the created instance.
	 */
	static createAsync(settings) {
		return Promise.resolve(Population.create(settings))
			.then((population) => population.setFitnesses())
			.then((population) => new Runner(population, settings));
	}

	/**
	 * Checks if the current best individual is a solution. If so, stores it
	 * on the `solution` property.
	 * @returns {undefined}
	 */
	checkForSolution() {
		let { solutionFitness } = this.settings;
		let best = this.population.getBest();
		if (best.fitness >= solutionFitness) this.solution = best;
	}

	/**
	 * Get the current best individual.
	 * @returns {Individual} - The solution, or the current best individual
	 * if no solution has been found.
	 */
	getBest() {
		return this.solution || this.population.getBest();
	}

	/**
	 * Gets the result of the genetic algorithm.
	 * @returns {Object} - Contains the best individual, as well as an array of
	 *   all individuals in the final generation.
	 */
	getResult() {
		return {
			best: this.getBest(),
			individuals: this.population.individuals
		};
	}

	/**
	 * Synchronously runs a single generation.
	 * @returns {undefined}
	 */
	runGenerationSync() {
		this.population = GenePool.fromPopulationSync(this.population)
			.performSelectionsSync()
			.performCrossoversSync()
			.mutateSync()
			.setFitnessesSync();
		this.generationCount += 1;
	}

	/**
	 * Asynchronously runs a single generation.
	 * @returns {Promise} - Will resolve when the operation is complete.
	 */
	runGenerationAsync() {
		return Promise.resolve(GenePool.fromPopulation(this.population))
			.then((pool) => pool.performSelections())
			.then((scheme) => scheme.performCrossovers())
			.then((offspring) => offspring.mutate())
			.then((mutants) => mutants.setFitnesses())
			.then((mutants) => {
				this.population = mutants;
				this.generationCount += 1;
			});
	}

	/**
	 * Checks for a solution, then runs a single synchronous generation if no
	 * solution was found.
	 * @returns {undefined}
	 */
	runStepSync() {
		this.checkForSolution();
		if (!this.solution) this.runGenerationSync();
	}

	/**
	 * Checks for a solution, then runs a single asynchronous generation if no
	 * solution was found.
	 * @returns {Promise} - Will resolve when the operation is complete.
	 */
	runStepAsync() {
		this.checkForSolution();
		if (this.solution) return Promise.resolve();
		return this.runGenerationAsync();
	}

	/**
	 * Synchronously runs the entire genetic algorithm. Will stop when a
	 * solution is found, or when the generation count is exceeded.
	 * @returns {Object} - Result of the algorithm, as determined by the
	 *   #getResult method.
	 */
	runSync() {
		let { generationLimit } = this.settings;
		while(!this.solution && this.generationCount < generationLimit) {
			this.runStepSync();
		}
		return this.getResult();
	}

	/**
	 * Asynchronously runs the entire genetic algorithm. Will stop when a
	 * solution is found, or when the generation count is exceeded.
	 * @returns {Promise<Object>} - Will resolve with the result of the
	 *   algorithm, as determined by the #getResult method.
	 */
	runAsync() {
		let { generationLimit } = this.settings;
		return pasync.whilst(
			() => !this.solution && this.generationCount < generationLimit,
			() => this.runStepAsync()
		)
			.then(() => this.getResult());
	}
}

module.exports = Runner;
