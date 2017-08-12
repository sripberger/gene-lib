const Selector = require('./selector');

class ArraySelector extends Selector {
	constructor(settings) {
		super(settings);
		this.individuals = [];
	}

	add(individual) {
		this.individuals.push(individual);
	}
}

module.exports = ArraySelector;
