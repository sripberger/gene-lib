const _ = require('lodash');
const pasync = require('pasync');
const Population = require('./population');

/**
 * Stores individuals between selection and crossover operations.
 * Contains logic for performing the crossovers and producing a new Population.
 * @private
 * @param {Array<Array>} crossovers - Array of individuals selected for crossover.
 * @param {Array<Individual>} copies - Array of individuals selected for direct copying.
 * @param {Object} settings - Settings object from ::run method.
 */
class BreedingScheme {
	constructor(crossovers = [], copies = [], settings = {}) {
		this.crossovers = crossovers;
		this.copies = copies;
		this.settings = settings;
	}

	/**
	 * Performs crossovers synchronously or asynchronously, depending on the
	 * async.crossover setting.
	 * @returns {Population|Promise<Population>} - Population containing copies
	 *   and crossover results, or a promise resolving with one.
	 */
	performCrossovers() {
		let { async } = this.settings;
		if (!async || !async.crossover) return this.performCrossoversSync();
		return this.performCrossoversAsync();
	}

	/**
	 * Performs crossovers synchronously.
	 * @returns {Population} - Population containing copies and crossover
	 *   results.
	 */
	performCrossoversSync() {
		let { crossovers, copies, settings } = this;
		let { crossoverRate } = settings;
		let crossoverResults = crossovers.map((crossover) => {
			let individual = _.head(crossover);
			let others = _.tail(crossover);
			return individual.crossoverSync(others, crossoverRate);
		});
		let offspring = _.concat(copies, _.flatten(crossoverResults));
		return new Population(offspring, settings);
	}

	/**
	 * Performs crossovers asynchronously.
	 * @returns {Promise<Population>} - Promise that will resolve with a
	 *   population containing copies and crossover results.
	 */
	performCrossoversAsync() {
		let { crossovers, copies, settings } = this;
		let { crossoverRate, async } = settings;
		return pasync.mapLimit(
			crossovers,
			async.crossover,
			(crossover) => {
				let individual = _.head(crossover);
				let others = _.tail(crossover);
				return individual.crossoverAsync(others, crossoverRate);
			}
		)
			.then((crossoverResults) => {
				let offspring = _.concat(copies, _.flatten(crossoverResults));
				return new Population(offspring, settings);
			});
	}
}

module.exports = BreedingScheme;
