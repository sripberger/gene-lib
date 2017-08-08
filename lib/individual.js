const _ = require('lodash');
const utils = require('./utils');

class Individual {
	constructor(chromosome) {
		this.chromosome = chromosome;
	}

	setFitness() {
		return Promise.resolve(this.chromosome.getFitness())
			.then((fitness) => {
				this.fitness = fitness;
			});
	}

	crossover(other, rate) {
		let { chromosome } = this;
		return Promise.resolve(chromosome.crossover(other.chromosome, rate))
			.then((result) => {
				let offspring = (_.isArray(result)) ? result : [ result ];
				return offspring.map((o) => new Individual(o));
			});
	}

	checkedCrossover(other, rate, compound) {
		if (compound || utils.boolChance(rate)) {
			return this.crossover(other, rate);
		}
		return Promise.resolve([ this, other ]);
	}

	mutate(rate) {
		return Promise.resolve(this.chromosome.mutate(rate))
			.then((mutant) => new Individual(mutant));
	}
}

module.exports = Individual;
