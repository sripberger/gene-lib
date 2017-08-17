const _ = require('lodash');
const pasync = require('pasync');
const Individual = require('./individual');

class Population {
	constructor(individuals = [], settings = {}) {
		this.individuals = individuals;
		this.settings = settings;
	}

	static create(settings) {
		let { async } = settings;
		if (!async || !async.create) return this.createSync(settings);
		return this.createAsync(settings);
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
			async.create,
			() => Individual.createAsync(createChromosome, createArg)
		)
			.then((individuals) => new Population(individuals, settings));
	}

	getBest() {
		return _.maxBy(this.individuals, 'fitness');
	}

	setFitnesses() {
		let { async } = this.settings;
		if (!async || !async.calculateFitness) return this.setFitnessesSync();
		return this.setFitnessesAsync();
	}

	setFitnessesSync() {
		for (let individual of this.individuals) {
			individual.setFitnessSync();
		}
		return this;
	}

	setFitnessesAsync() {
		return pasync.eachLimit(
			this.individuals,
			this.settings.async.calculateFitness,
			(individual) => individual.setFitnessAsync()
		)
			.then(() => this);
	}

	mutate() {
		let { async } = this.settings;
		if (!async || !async.mutate) return this.mutateSync();
		return this.mutateAsync();
	}

	mutateSync() {
		let { mutationRate } = this.settings;
		if (mutationRate === 0) return this;
		return new Population(
			this.individuals.map((i) => i.mutateSync(mutationRate)),
			this.settings
		);
	}

	mutateAsync() {
		let { mutationRate, async } = this.settings;
		if (mutationRate === 0) return Promise.resolve(this);
		return pasync.mapLimit(
			this.individuals,
			async.mutate,
			(individual) => individual.mutateAsync(mutationRate)
		)
			.then((mutants) => new Population(mutants, this.settings));
	}
}

module.exports = Population;
