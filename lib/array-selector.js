const Selector = require('./selector');

class ArraySelector extends Selector {
	constructor(settings) {
		super(settings);
		this.chromosomes = [];
	}

	add(chromosome) {
		this.chromosomes.push(chromosome);
	}
}

module.exports = ArraySelector;
