const _ = require('lodash');
// TODO: Update pasync dependency once timesLimit fix is published.
const pasync = require('pasync');
const XError = require('xerror');
const Population = require('./population');
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

	static create(selector, settings) {
		let { crossoverCount, copyCount } = this.getLitterCounts(settings);
		return new GenePool(selector, crossoverCount, copyCount, settings);
	}

	static fromPopulation(population, settings) {
		return population.toSelector(
			settings.selectorClass,
			settings.selectorSettings,
			settings.addConcurrency
		)
			.then((selector) => this.create(selector, settings));
	}

	getSelectionCount() {
		let { settings, crossoverCount, copyCount } = this;
		let { parentCount, childCount } = settings;
		return (crossoverCount * parentCount) + (childCount * copyCount);
	}

	performSelections() {
		return pasync.timesLimit(
			this.getSelectionCount(),
			this.settings.selectionConcurrency || 1,
			() => this.selector.select()
		)
			.then((individuals) => {
				return {
					crossovers: _(individuals)
						.take(this.crossoverCount)
						.chunk(this.settings.parentCount)
						.value(),
					copies: _.takeRight(individuals, this.copyCount)
				};
			});
	}

	getUnmutatedOffpsring() {
		let { crossoverRate, crossoverConcurrency } = this.settings;
		return this.performSelections()
			.then(({ crossovers, copies }) => {
				return pasync.mapLimit(
					crossovers,
					crossoverConcurrency,
					(crossover) => {
						let individual = _.head(crossover);
						let others = _.tail(crossover);
						return individual.crossover(others, crossoverRate);
					}
				)
					.then((results) => {
						let offspring = _.concat(copies, _.flatten(results));
						return new Population(offspring);
					});
			});
	}

	getUnscoredOffspring() {
		let { mutationRate, mutationConcurrency } = this.settings;
		return this.getUnmutatedOffpsring()
			.then((offspring) => {
				if (mutationRate === 0) return offspring;
				return offspring.mutate(mutationRate, mutationConcurrency);
			});
	}

	getOffspring() {
		let { fitnessConcurrency } = this.settings;
		return this.getUnscoredOffspring()
			.then((offpsring) => {
				return offpsring.setFitnesses(fitnessConcurrency)
					.then(() => offpsring);
			});
	}
}

module.exports = GenePool;
