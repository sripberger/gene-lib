const _ = require('lodash');
const pasync = require('pasync');
const Individual = require('./individual');

class Population {
	constructor(individuals = [], settings = {}) {
		this.individuals = individuals;
		this.settings = settings;
	}

	static createSync(settings) {
		let { generationSize, createChromosome, createArg } = settings;
		let individuals = _.times(
			generationSize,
			() => Individual.createSync(createChromosome, createArg)
		);
		return new Population(individuals, settings);
	}

	static createAsync(settings) {
		let { generationSize, createChromosome, createArg, async } = settings;
		return pasync.timesLimit(
			generationSize,
			async.creation,
			() => Individual.createAsync(createChromosome, createArg)
		)
			.then((individuals) => new Population(individuals, settings));
	}

	mutate() {
		let { async } = this.settings;
		if (!async || !async.mutation) return this.mutateSync();
		return this.mutateAsync();
	}

	mutateSync() {
		let { mutationRate } = this.settings;
		let mutants = this.individuals.map((i) => i.mutateSync(mutationRate));
		return new Population(mutants, this.settings);
	}

	mutateAsync() {
		return pasync.mapLimit(
			this.individuals,
			this.settings.async.mutation,
			(individual) => individual.mutateAsync(this.settings.mutationRate)
		)
			.then((mutants) => new Population(mutants, this.settings));
	}

	setFitnesses() {
		let { async } = this.settings;
		if (!async || !async.fitness) {
			this.setFitnessesSync();
		} else {
			return this.setFitnessesAsync();
		}
	}

	setFitnessesSync() {
		for (let individual of this.individuals) {
			individual.setFitnessSync();
		}
	}

	setFitnessesAsync() {
		return pasync.eachLimit(
			this.individuals,
			this.settings.async.fitness,
			(individual) => individual.setFitnessAsync()
		);
	}

	getBest() {
		return _.maxBy(this.individuals, 'fitness');
	}
}

module.exports = Population;
