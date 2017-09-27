const _ = require('lodash');
const { defaultRegistry } = require('./selector-registry');

/**
 * Internal utilty functions for normalizing user-provided settings.
 * @name settingsUtils
 * @kind module
 * @private
 */

/**
 * Adds defaults to the provided settings object.
 * @memberof settingsUtils
 * @param {Object} settings - Settings object from the ::run method.
 * @returns {Object} - Copy of settings with defaults added.
 */
exports.applyDefaults = function(settings) {
	return _.defaults({}, settings, {
		generationLimit: Infinity,
		crossoverRate: 0,
		compoundCrossover: false,
		parentCount: 2,
		childCount: 2,
		mutationRate: 0,
		selector: 'tournament'
	});
};

/**
 * Normalizes the `selector` and `selectorClass` settings.
 * @memberof settingsUtils
 * @param {Object} settings - Settings object from the ::run method.
 * @returns {Object} - Copy of settings with `selector` property, if any,
 *   replaced by the equivalent `selectorClass` propety.
 */
exports.normalizeSelector = function(settings) {
	let { selector, selectorClass } = settings;
	let result = _.omit(settings, 'selector');
	if (selector && !selectorClass) {
		result.selectorClass = defaultRegistry.get(selector);
	}
	return result;
};

/**
 * Gets async configuation from the `individualClass` and `selectorClass`, if
 * any.
 * @memberof settingsUtils
 * @param {Object} settings - Settings object from the ::run method.
 * @returns {Object|null} - Merged async configuation, or null if there were
 *   none.
 */
exports.getAsyncFromClasses = function(settings) {
	let { selectorClass, chromosomeClass } = settings;
	let selectorAsync = selectorClass && selectorClass.async;
	let chromosomeAsync = chromosomeClass && chromosomeClass.async;
	if (!selectorAsync && !chromosomeAsync) return null;
	return _.assign(
		_.pick(selectorAsync, [ 'add', 'select' ]),
		_.pick(chromosomeAsync, [ 'create', 'fitness', 'crossover', 'mutate' ])
	);
};

/**
 * Normalizes the `async` setting and async configuation from providec classes.
 * @memberof settingsUtils
 * @param {Object} settings - Settings object from the ::run method.
 * @returns {Object} - Copy of settings with an `async` property merged from
 *   class configuation and any existing `async` property. Note that direct
 *   async configuation takes priority over any class-level configuation.
 */
exports.normalizeAsync = function(settings) {
	let fromClasses = exports.getAsyncFromClasses(settings);
	if (!fromClasses) return settings;
	let result = _.omit(settings, 'async');
	result.async = _.defaults({}, settings.async, fromClasses);
	return result;
};

/**
 * Normalizes chromosome creation settings.
 * @memberof settingsUtils
 * @param {Object} settings - Settings object from the :;run method.
 * @returns {Object} Copy of settings with `chromosomeClass`, if any, replaced
 *   with a `createChromosome` factory function bound to the chromosomeClass.
 *   Also, any `createArg` setting will be replaced with an equivalent
 *   single-element `createArgs` setting.
 */
exports.normalizeChromosome = function(settings) {
	let { chromosomeClass, createArg } = settings;
	let result = _.omit(settings, [ 'chromosomeClass', 'createArg' ]);
	if (chromosomeClass) {
		result.createChromosome = chromosomeClass.create.bind(chromosomeClass);
	}
	if (createArg) {
		result.createArgs = [ createArg ];
	}
	return result;
};

/**
 * Ensures existence of required settings, as well as internal consistency of
 * settings. Will throw if any problems are found.
 * @memberof settingsUtils
 * @param {Object} settings - Settings object from the :;run method.
 * @returns {Object} - Unchanged settings object.
 */
exports.validate = function(settings) {
	// TODO: Add validation checks.
	return settings;
};

/**
 * Normalizes user-provided settings into a single supported format. Will
 * throw if any required settings are missing, or if settings are internally
 * inconsistent.
 * @memberof settingsUtils
 * @param {Object} settings - Settings object from the :;run method.
 * @returns {Object} - Normalized settings object.
 */
exports.normalize = function(settings) {
	let withDefaults = exports.applyDefaults(settings);
	let selectorNormalized = exports.normalizeSelector(withDefaults);
	let asyncNormalized = exports.normalizeAsync(selectorNormalized);
	let chromosomeNormalized = exports.normalizeChromosome(asyncNormalized);
	return exports.validate(chromosomeNormalized);
};
