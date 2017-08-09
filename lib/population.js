const pasync = require('pasync');

class Population {
	constructor(individuals = []) {
		this.individuals = individuals;
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
