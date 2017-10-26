const EventEmitter = require('events');
// TODO: Get pasync::setImmediate published and update dependency.
const pasync = require('pasync');
const GenePool = require('./gene-pool');
const Population = require('./population');

// TODO: Remove this monkey-patch once pasync dependency is updated.
pasync.setImmediate = function() {
 	return new Promise(function(resolve) {
 		setImmediate(function() {
 			resolve();
 		});
 	});
 };

/**
 * Maintains state for a genetic algorithm run.
 * @private
 * @param {Population} population - Initial population.
 * @param {Object} [settings={}] - Settings object from ::run method.
 */
class Runner extends EventEmitter {
	constructor(population, settings = {}) {
		super();
		this.population = population;
		this.settings = settings;
		this.generationCount = 0;
		this.solution = null;
		if (settings.onGeneration) this.on('generation', settings.onGeneration);
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
		if (solutionFitness === false) return;
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
	 * Gets an object representing the current state of the genetic algorithm.
	 * @returns {Object} - Contains the generation count, the best individual,
	 *   as well as an array of all individuals in the current generation.
	 */
	getState() {
		return {
			generationCount: this.generationCount,
			best: this.getBest(),
			individuals: this.population.individuals
		};
	}

	/**
	 * Emits the `generation` event, with an object representing the current
	 * state of the algorithm, as deterined by the #getState method.
	 * @returns {undefined}
	 */
	emitGeneration() {
		this.emit('generation', this.getState());
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
		if (this.solution) return;
		this.runGenerationSync();
		this.emitGeneration();
	}

	/**
	 * Checks for a solution, then runs a single asynchronous generation if no
	 * solution was found.
	 * @returns {Promise} - Will resolve when the operation is complete.
	 */
	runStepAsync() {
		this.checkForSolution();
		if (this.solution) return Promise.resolve();
		return this.runGenerationAsync()
			.then(() => {
				this.emitGeneration();
			});
	}

	/**
	 * Synchronously runs the entire genetic algorithm. Will stop when a
	 * solution is found, or when the generation count is exceeded. The entire
	 * operation will occur in a single event loop, blocking all execution
	 * until it is finished.
	 * @returns {Object} - Final state of the algorithm, as determined by the
	 *   #getState method.
	 */
	runSync() {
		this.emitGeneration();
		let { generationLimit } = this.settings;
		while(!this.solution && this.generationCount < generationLimit) {
			this.runStepSync();
		}
		return this.getState();
	}

	/**
	 * Asynchronously runs the entire genetic algorithm. Will stop when a
	 * solution is found, or when the generation count is exceeded. Each
	 * generation will be placed at the end of the event loop queue, allowing
	 * execution to be shared.
	 * @returns {Promise<Object>} - Will resolve with the final state of the
	 *   algorithm, as determined by the #getState method.
	 */
	runAsync() {
		this.emitGeneration();
		let { generationLimit } = this.settings;
		return pasync.whilst(
			() => !this.solution && this.generationCount < generationLimit,
			() => pasync.setImmediate()
				.then(() => this.runStepAsync())
		)
			.then(() => this.getState());
	}
}

module.exports = Runner;
