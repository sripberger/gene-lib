const _ = require('lodash');

class Generation {
	constructor(selector, settings = {}) {
		this.selector = selector;
		this.settings = settings;
	}

	static create(Selector, selectorSettings, generationSettings) {
		return new Generation(
			new Selector(selectorSettings),
			generationSettings
		);
	}

	add(...individuals) {
		individuals.forEach((individual) => this.selector.add(individual));
	}

	getSize() {
		return this.selector.getSize();
	}

	populate(size, factory, factoryArg) {
		while(this.getSize() < size) {
			this.add(factory(factoryArg));
		}
	}

	getBest() {
		return this.selector.getBest();
	}

	getUnmutatedOffspring() {
		let mates = _.times(2, () => this.selector.select());
		let crossoverRate = this.settings.crossoverRate || 0;
		let { compoundCrossover } = this.settings;
		if (compoundCrossover || _.random(0, 1, true) < crossoverRate) {
			let offspring =  mates[0].crossover(mates[1], crossoverRate);
			return (_.isArray(offspring)) ? offspring : [ offspring ];
		}
		return mates;
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
