const _ = require('lodash');
// TODO: Update pasync dependency once timesLimit fix is published.
const pasync = require('pasync');
const XError = require('xerror');
const BreedingScheme = require('./breeding-scheme');
const utils = require('./utils');

class GenePool {
	constructor(selector, crossoverCount, copyCount, settings = {}) {
		this.selector = selector;
		this.crossoverCount = crossoverCount,
		this.copyCount = copyCount;
		this.settings = settings;
	}

	static getMaxCrossoverCount(generationSize, childCount) {
		let result = generationSize / childCount;
		if (Number.isInteger(result)) return result;
		throw new XError(
			XError.INVALID_ARGUMENT,
			'generationSize must be a multiple of childCount'
		);
	}

	static getLitterCounts(settings) {
		let maxCrossoverCount = this.getMaxCrossoverCount(
			settings.generationSize,
			settings.childCount
		);
		let crossoverCount = 0;
		let copyCount = 0;
		if (settings.compoundCrossover) {
			crossoverCount = maxCrossoverCount;
		} else {
			_.times(maxCrossoverCount, () => {
				if (utils.boolChance(settings.crossoverRate)) {
					crossoverCount += 1;
				} else {
					copyCount += 1;
				}
			});
		}
		return { crossoverCount, copyCount };
	}

	static create(settings) {
		let Selector = settings.selectorClass;
		let selector = new Selector(settings.selectorSettings);
		let { crossoverCount, copyCount } = this.getLitterCounts(settings);
		return new GenePool(selector, crossoverCount, copyCount, settings);
	}

	static fromPopulation(population) {
		let { async } = population.settings;
		if (!async || !async.add) return this.fromPopulationSync(population);
		return this.fromPopulationAsync(population);
	}

	static fromPopulationSync(population) {
		let pool = this.create(population.settings);
		for (let individual of population.individuals) {
			pool.selector.add(individual);
		}
		return pool;
	}

	static fromPopulationAsync(population) {
		let pool = this.create(population.settings);
		return pasync.eachLimit(
			population.individuals,
			population.settings.async.add,
			(individual) => pool.selector.add(individual)
		)
			.then(() => pool);
	}

	getSelectionCount() {
		let { settings, crossoverCount, copyCount } = this;
		let { parentCount, childCount } = settings;
		return (crossoverCount * parentCount) + (childCount * copyCount);
	}

	performSelections() {
		let { async } = this.settings;
		if (!async || !async.select) return this.performSelectionsSync();
		return this.performSelectionsAsync();
	}

	performSelectionsSync() {
		let { crossoverCount, copyCount, settings } = this;
		let { parentCount, childCount } = settings;
		let individuals = _.times(
			this.getSelectionCount(),
			() => this.selector.select()
		);
		let crossovers = _(individuals)
			.take(crossoverCount * parentCount)
			.chunk(parentCount)
			.value();
		let copies = _.takeRight(individuals, copyCount * childCount);
		return new BreedingScheme(crossovers, copies, settings);
	}

	performSelectionsAsync() {
		let { crossoverCount, copyCount, settings } = this;
		let { parentCount, childCount } = settings;
		return pasync.timesLimit(
			this.getSelectionCount(),
			settings.async.select,
			() => this.selector.select()
		)
			.then((individuals) => {
				let crossovers = _(individuals)
					.take(crossoverCount * parentCount)
					.chunk(parentCount)
					.value();
				let copies = _.takeRight(individuals, copyCount * childCount);
				return new BreedingScheme(crossovers, copies, settings);
			});
	}
}

module.exports = GenePool;
