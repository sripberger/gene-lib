const pasync = require('pasync');
const GenePool = require('./gene-pool');
const Population = require('./population');

class Runner {
	constructor(population, settings = {}) {
		this.population = population;
		this.settings = settings;
		this.generationCount = 0;
		this.solution = null;
	}

	static createSync(settings) {
		return new Runner(
			Population.createSync(settings).setFitnessesSync(),
			settings
		);
	}

	static createAsync(settings) {
		return Promise.resolve(Population.create(settings))
			.then((population) => population.setFitnesses())
			.then((population) => new Runner(population, settings));
	}

	checkForSolution() {
		let best = this.population.getBest();
		if (best.fitness === Infinity) this.solution = best;
	}

	getBest() {
		return this.solution || this.population.getBest();
	}

	runGenerationSync() {
		this.population = GenePool.fromPopulationSync(this.population)
			.performSelectionsSync()
			.performCrossoversSync()
			.mutateSync()
			.setFitnessesSync();
		this.generationCount += 1;
	}

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

	runStepSync() {
		this.checkForSolution();
		if (!this.solution) this.runGenerationSync();
	}

	runStepAsync() {
		this.checkForSolution();
		if (this.solution) return Promise.resolve();
		return this.runGenerationAsync();
	}

	runSync() {
		let { generationLimit } = this.settings;
		while(!this.solution && this.generationCount < generationLimit) {
			this.runStepSync();
		}
		return this.getBest();
	}

	runAsync() {
		let { generationLimit } = this.settings;
		return pasync.whilst(
			() => !this.solution && this.generationCount < generationLimit,
			() => this.runStepAsync()
		)
			.then(() => this.getBest());
	}
}

module.exports = Runner;
