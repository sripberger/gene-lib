const _ = require('lodash');
const boolChance = require('bool-chance');
const pasync = require('pasync');
const BreedingScheme = require('./breeding-scheme');
const resultSchemas = require('./result-schemas/selector');
const addSchema = resultSchemas.add;
const selectSchema = resultSchemas.select;

/**
 * Stores individuals between fitness calculation and selection for breeding.
 * Contains logic for performing the selections and producing a BreedingScheme.
 * @private
 * @param {Selector} selector - Selctor instance containing individuals.
 * @param {number} crossoverCount - Number of crossover operations that will
 *   occur.
 * @param {number} copyCount - Number of copy operations that will occur.
 * @param {Object} [settings={}] - Settings object from ::run method.
 */
class GenePool {
	constructor(selector, crossoverCount, copyCount, settings = {}) {
		this.selector = selector;
		this.crossoverCount = crossoverCount,
		this.copyCount = copyCount;
		this.settings = settings;
	}

	/**
	 * Gets the largest possible number of crossver operations per generation.
	 * @static
	 * @param {number} generationSize - Size of a generation, from settings.
	 * @param {number} childCount - Number of children produced per crossover,
	 *   from settings.
	 * @returns {number} - Generation size divided by child count.
	 */
	static getMaxCrossoverCount(generationSize, childCount) {
		return generationSize / childCount;
	}

	/**
	 * Gets counts for crossover and copy operations, determined randomly
	 * based on the crossover rate.
	 * @static
	 * @param {Object} settings - Settings object from ::run method.
	 * @returns {Object} - An object with two integer properties:
	 *   `crossoverCount` and `copyCount`.
	 */
	static getLitterCounts(settings) {
		let maxCrossoverCount = this.getMaxCrossoverCount(
			settings.generationSize,
			settings.childCount
		);
		let crossoverCount = 0;
		let copyCount = 0;
		if (settings.manualCrossoverCheck) {
			crossoverCount = maxCrossoverCount;
		} else {
			_.times(maxCrossoverCount, () => {
				if (boolChance.get(settings.crossoverRate)) {
					crossoverCount += 1;
				} else {
					copyCount += 1;
				}
			});
		}
		return { crossoverCount, copyCount };
	}

	/**
	 * Creates a new, empty instance from the provided settings object.
	 * @static
	 * @param {Object} settings - Settings object from ::run method.
	 * @returns {GenePool} - Created instance.
	 */
	static create(settings) {
		let Selector = settings.selectorClass;
		let selector = new Selector(settings.selectorSettings);
		let { crossoverCount, copyCount } = this.getLitterCounts(settings);
		return new GenePool(selector, crossoverCount, copyCount, settings);
	}

	/**
	 * Creates a new instance from the provided Population, using the
	 * population's settings object and adding all individuals to the selector.
	 * This operation will be either synchronous or asynchronous, depending on
	 * the async.add setting.
	 * @static
	 * @param {Population} population - Source Population instance.
	 * @returns {GenePool|Promise<GenePool>} - Created instance, or a Promise
	 *   resolving with one.
	 */
	static fromPopulation(population) {
		let { async } = population.settings;
		if (!async || !async.add) return this.fromPopulationSync(population);
		return this.fromPopulationAsync(population);
	}

	/**
	 * Synchronously creates a new instance from the provided Population
	 * instance.
	 * @static
	 * @param {Population} population - Source Population instance.
	 * @returns {GenePool} - Created instance.
	 */
	static fromPopulationSync(population) {
		let pool = this.create(population.settings);
		let { selector } = pool;
		for (let individual of population.individuals) {
			addSchema.validateSync(selector.add(individual));
		}
		return pool;
	}

	/**
	 * Asynchronously Creates a new instance from the provided Population.
	 * @static
	 * @param {Population} population - Source Population instance.
	 * @returns {Promise<GenePool>} - Will resolve with the created instance.
	 */
	static fromPopulationAsync(population) {
		let pool = this.create(population.settings);
		let { selector } = pool;
		return pasync.eachLimit(
			population.individuals,
			population.settings.async.add,
			(individual) => addSchema.validateAsync(selector.add(individual))
		)
			.then(() => pool);
	}

	/**
	 * Gets the number of individuals that must be selected for breeding.
	 * @returns {number} - Selection total, based on the litter counts as well
	 * as the childCount and parentCount settings.
	 */
	getSelectionCount() {
		let { settings, crossoverCount, copyCount } = this;
		let { parentCount, childCount } = settings;
		return (crossoverCount * parentCount) + (childCount * copyCount);
	}

	/**
	 * Performs all selections for this generation, producing a new
	 * BreedingScheme instance. This operation will be either synchronous or
	 * asynchronous depending on the async.select setting.
	 * @returns {BreedingScheme|Promise<BreedingScheme>} - Resulting
	 *   BreedingScheme instance, or a promise resolving with one.
	 */
	performSelections() {
		let { async } = this.settings;
		if (!async || !async.select) return this.performSelectionsSync();
		return this.performSelectionsAsync();
	}

	/**
	 * Synchronously performs all selections for this generation.
	 * @returns {BreedingScheme} - Resulting BreedingScheme instance.
	 */
	performSelectionsSync() {
		let { crossoverCount, copyCount, settings } = this;
		let { parentCount, childCount } = settings;
		let individuals = _.times(
			this.getSelectionCount(),
			() => selectSchema.validateSync(this.selector.select())
		);
		let crossovers = _(individuals)
			.take(crossoverCount * parentCount)
			.chunk(parentCount)
			.value();
		let copies = _.takeRight(individuals, copyCount * childCount);
		return new BreedingScheme(crossovers, copies, settings);
	}

	/**
	 * Asynchronously performs all selections for this generation.
	 * @returns {Promise<BreedingScheme>} - Will resolve with the resulting
	 *   BreedingScheme instance.
	 */
	performSelectionsAsync() {
		let { crossoverCount, copyCount, settings } = this;
		let { parentCount, childCount } = settings;
		return pasync.timesLimit(
			this.getSelectionCount(),
			settings.async.select,
			() => selectSchema.validateAsync(this.selector.select())
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
