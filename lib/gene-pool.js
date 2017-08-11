const _ = require('lodash');
const pasync = require('pasync');
const XError = require('xerror');
const Population = require('./population');
const utils = require('./utils');

class GenePool {
	constructor(selector, settings = {}) {
		this.selector = selector;
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
		let { generationSize, childCount, crossoverRate } = settings;
		let crossoverCount = 0;
		let copyCount = 0;
		_.times(this.getMaxCrossoverCount(generationSize, childCount), () => {
			if (utils.boolChance(crossoverRate)) {
				crossoverCount += 1;
			} else {
				copyCount += 1;
			}
		});
		return { crossoverCount, copyCount };
	}

	static create(selector, settings) {
		return new GenePool(
			selector,
			_(settings)
				.omit('generationSize')
				.assign(this.getLitterCounts(settings))
				.value()
		);
	}

	getSelectionCount() {
		let { settings } = this;
		let { crossoverCount, parentCount, childCount, copyCount } = settings;
		return (crossoverCount * parentCount) + (childCount * copyCount);
	}

	performSelections() {
		return pasync.timesLimit(
			this.getSelectionCount(),
			this.settings.selectionConcurrency,
			() => this.selector.select()
		)
			.then((individuals) => {
				return {
					crossovers: _(individuals)
						.take(this.settings.crossoverCount)
						.chunk(this.settings.parentCount)
						.value(),
					copies: _.takeRight(individuals, this.settings.copyCount)
				};
			});
	}

	getUnmutatedOffpsring() {
		let { crossoverRate, crossoverConcurrency } = this.settings;
		let { crossovers, copies } = this.performSelections();
		return pasync.mapLimit(
			crossovers,
			crossoverConcurrency,
			(crossover) => {
				let individual = _.head(crossover);
				let others = _.tail(crossover);
				return individual.crossover(others, crossoverRate);
			}
		)
			.then((crossoverResults) => {
				let offspring = _.concat(copies, _.flatten(crossoverResults));
				return new Population(offspring);
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
