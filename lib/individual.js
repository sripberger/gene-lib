const _ = require('lodash');

class Individual {
	constructor(chromosome) {
		this.chromosome = chromosome;
	}

	static createSync(chromosomeFactory, factoryArg) {
		return new Individual(chromosomeFactory(factoryArg));
	}

	static createAsync(chromosomeFactory, factoryArg) {
		return chromosomeFactory(factoryArg)
			.then((chromosome) => new Individual(chromosome));
	}

	setFitnessSync() {
		this.fitness = this.chromosome.getFitness();
	}

	setFitnessAsync() {
		return this.chromosome.getFitness()
			.then((fitness) => {
				this.fitness = fitness;
			});
	}

	isSolution() {
		return this.chromosome.isSolution();
	}

	crossoverSync(others, rate) {
		let { chromosome } = this;
		let otherChromosomes = _.map(others, 'chromosome');
		let result = chromosome.crossover(...otherChromosomes, rate);
		let children = (_.isArray(result)) ? result : [ result ];
		return children.map((c) => new Individual(c));
	}

	crossoverAsync(others, rate) {
		let { chromosome } = this;
		let otherChromosomes = _.map(others, 'chromosome');
		return chromosome.crossover(...otherChromosomes, rate)
			.then((result) => {
				let children = (_.isArray(result)) ? result : [ result ];
				return children.map((c) => new Individual(c));
			});
	}

	mutateSync(rate) {
		return new Individual(this.chromosome.mutate(rate));
	}

	mutateAsync(rate) {
		return Promise.resolve(this.chromosome.mutate(rate))
			.then((mutant) => new Individual(mutant));
	}
}

module.exports = Individual;
