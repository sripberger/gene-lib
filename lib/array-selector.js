const Selector = require('./selector');
const _ = require('lodash');

class ArraySelector extends Selector {
	constructor(settings) {
		super(settings);
		this.individuals = [];
	}

	add(individual) {
		this.individuals.push(individual);
	}

	getSize() {
		return this.individuals.length;
	}

	getBest() {
		return _.maxBy(
			this.individuals,
			(individual) => individual.getFitnessScore()
		) || null;
	}
}

module.exports = ArraySelector;
