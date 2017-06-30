const _ = require('lodash');

class Runner {
	constructor(generation, generationLimit = Infinity) {
		this.generation = generation;
		this.generationLimit = generationLimit;
		this.oldGeneration = null;
		this.generationCount = 0;
		this.solution = null;
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

	populateGeneration() {
		let targetSize = this.oldGeneration.getSize();
		while (!this.solution && this.generation.getSize() < targetSize) {
			this.runStep();
		}
	}

	runGeneration() {
		this.startNewGeneration();
		this.populateGeneration();
	}

	run() {
		this.checkForSolution();
		while(!this.solution && this.generationCount < this.generationLimit) {
			this.runGeneration();
		}
	}

	getBest() {
		return this.solution || this.generation.getBest();
	}
}

module.exports = Runner;
