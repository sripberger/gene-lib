const _ = require('lodash');
const Generation = require('./generation');

class Runner {
	constructor(generation, settings = {}) {
		this.generation = generation;
		this.settings = settings;
		this.oldGeneration = null;
		this.generationCount = 0;
		this.solution = null;
	}

	static create(settings) {
		let { runnerSettings } = settings;
		let generation = Generation.create(
			settings.selectorClass,
			settings.selectorSettings,
			settings.generationSettings
		);
		generation.populate(
			runnerSettings.generationSize,
			settings.createIndividual,
			settings.createArg
		);
		return new Runner(generation, runnerSettings);
	}

	checkForSolution() {
		let best = this.generation.getBest();
		if (best.isSolution()) this.solution = best;
	}

	startNewGeneration() {
		this.oldGeneration = this.generation;
		this.generation = this.oldGeneration.getNext();
		this.generationCount += 1;
	}

	runStep() {
		let offspring = this.oldGeneration.getOffspring();
		this.generation.add(...offspring);
		this.solution = _.find(offspring, (o) => o.isSolution()) || null;
	}

	populateNewGeneration() {
		while (
			!this.solution &&
			this.generation.getSize() < this.settings.generationSize
		) {
			this.runStep();
		}
	}

	runGeneration() {
		this.startNewGeneration();
		this.populateNewGeneration();
	}

	run() {
		this.checkForSolution();
		let { generationLimit } = this.settings;
		if (!_.isNumber(generationLimit)) generationLimit = Infinity;
		while(!this.solution && this.generationCount < generationLimit) {
			this.runGeneration();
		}
	}

	getBest() {
		return this.solution || this.generation.getBest();
	}
}

module.exports = Runner;
