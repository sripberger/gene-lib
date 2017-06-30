const _ = require('lodash');

class Generation {
	constructor(selector, settings = {}) {
		this.selector = selector;
		this.settings = settings;
	}

	add(...individuals) {
		individuals.forEach((individual) => this.selector.add(individual));
	}

	getSize() {
		return this.selector.getSize();
	}

	getBest() {
		return this.selector.getBest();
	}

	getUnmutatedOffspring() {
		let parents = _.times(2, () => this.selector.select());
		let crossoverRate = this.settings.crossoverRate || 0;
		let offspring =  parents[0].crossover(parents[1], crossoverRate);
		return (_.isArray(offspring)) ? offspring : [ offspring ];
	}

	getOffspring() {
		let children = this.getUnmutatedOffspring();
		let mutationRate = this.settings.mutationRate || 0;
		return _.map(children, (child) => child.mutate(mutationRate));
	}

	getNext() {
		return new Generation(this.selector.getNext(), this.settings);
	}
}

module.exports = Generation;
