const _ = require('lodash');

class Individual {
	constructor(chromosome) {
		this.chromosome = chromosome;
	}

	static create(chromosomeFactory, factoryArg) {
		return Promise.resolve(chromosomeFactory(factoryArg))
			.then((chromosome) => new Individual(chromosome));
	}

	setFitness() {
		return Promise.resolve(this.chromosome.getFitness())
			.then((fitness) => {
				this.fitness = fitness;
			});
	}

	isSolution() {
		return Promise.resolve(this.chromosome.isSolution());
	}

	crossover(others, rate) {
		let { chromosome } = this;
		let otherChromosomes = _.map(others, 'chromosome');
		return Promise.resolve(chromosome.crossover(...otherChromosomes, rate))
			.then((result) => {
				let children = (_.isArray(result)) ? result : [ result ];
				return children.map((c) => new Individual(c));
			});
	}

	mutate(rate) {
		return Promise.resolve(this.chromosome.mutate(rate))
			.then((mutant) => new Individual(mutant));
	}
}

module.exports = Individual;
