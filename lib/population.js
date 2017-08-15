const _ = require('lodash');
const pasync = require('pasync');
const Individual = require('./individual');

class Population {
	constructor(individuals = []) {
		this.individuals = individuals;
	}

	static create(size, chromosomeFactory, factoryArg) {
		return new Population(_.times(size, () => Individual.create(
			chromosomeFactory,
			factoryArg
		)));
	}

	static createAsync(size, chromosomeFactory, factoryArg, concurrency = 1) {
		return pasync.timesLimit(
			size,
			concurrency,
			() => Individual.createAsync(chromosomeFactory, factoryArg)
		)
			.then((individuals) => new Population(individuals));
	}

	mutate(rate) {
		return new Population(this.individuals.map((i) => i.mutate(rate)));
	}

	mutateAsync(rate, concurrency = 1) {
		return pasync.mapLimit(
			this.individuals,
			concurrency,
			(individual) => individual.mutateAsync(rate)
		)
			.then((mutants) => new Population(mutants));
	}

	setFitnesses() {
		for (let individual of this.individuals) {
			individual.setFitness();
		}
	}

	setFitnessesAsync(concurrency = 1) {
		return pasync.eachLimit(
			this.individuals,
			concurrency,
			(individual) => individual.setFitnessAsync()
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
