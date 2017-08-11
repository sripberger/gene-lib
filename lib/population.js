const _ = require('lodash');
const pasync = require('pasync');
const Individual = require('./individual');

class Population {
	constructor(individuals = []) {
		this.individuals = individuals;
	}

	static create(size, factory, factoryArg, concurrency = 1) {
		return pasync.timesLimit(size, concurrency, () => {
			return Promise.resolve(factory(factoryArg))
				.then((chromosome) => new Individual(chromosome));
		})
			.then((individuals) => new Population(individuals));
	}

	mutate(rate, concurrency = 1) {
		return pasync.mapLimit(
			this.individuals,
			concurrency,
			(individual) => individual.mutate(rate)
		)
			.then((mutants) => new Population(mutants));
	}

	setFitnesses(concurrency = 1) {
		return pasync.eachLimit(
			this.individuals,
			concurrency,
			(individual) => individual.setFitness()
		);
	}

	getBest() {
		return _.maxBy(this.individuals, 'fitness');
	}

	toSelector(Selector, settings, concurrency = 1) {
		let selector = new Selector(settings);
		return pasync.eachLimit(
			this.individuals,
			concurrency,
			(individual) => selector.add(individual)
		)
			.then(() => selector);
	}
}

module.exports = Population;
