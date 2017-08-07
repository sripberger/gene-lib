const Selector = require('./selector');
const _ = require('lodash');

class ArraySelector extends Selector {
	constructor(settings) {
		super(settings);
		this.chromosomes = [];
	}

	add(chromosome) {
		this.chromosomes.push(chromosome);
	}

	getSize() {
		return this.chromosomes.length;
	}

	getBest() {
		return _.maxBy(
			this.chromosomes,
			(chromosome) => chromosome.getFitnessScore()
		) || null;
	}
}

module.exports = ArraySelector;
