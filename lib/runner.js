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

	static create(settings) {
		return Population.create(
			settings.generationSize,
			settings.createChromosome,
			settings.createArg,
			settings.createConcurrency
		)
			.then((population) => {
				return population.setFitnesses(settings.fitnessConcurrency)
					.then(() => new Runner(population, settings));
			});
	}

	checkForSolution() {
		let best = this.population.getBest();
		return best.isSolution()
			.then((isSolution) => {
				if (isSolution) this.solution = best;
			});
	}

	runGeneration() {
		return GenePool.fromPopulation(this.population, this.settings)
			.then((genePool) => genePool.getOffspring())
			.then((offspring) => {
				this.population = offspring;
				this.generationCount += 1;
			});
	}

	runStep() {
		return this.checkForSolution()
			.then(() => {
				if (!this.solution) return this.runGeneration();
			});
	}

	getBest() {
		return this.solution || this.population.getBest();
	}

	run() {
		let { generationLimit } = this.settings;
		return pasync.whilst(
			() => !this.solution && this.generationCount < generationLimit,
			() => this.runStep()
		)
			.then(() => this.getBest());
	}
}

module.exports = Runner;
