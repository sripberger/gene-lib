const _ = require('lodash');
const XError = require('xerror');
const { defaultRegistry } = require('./selector-registry');

/**
 * Internal utilty functions for normalizing user-provided settings.
 * @name settingsUtils
 * @kind module
 * @private
 */

// TODO: Docs
exports.addDefaultSelector = function(settings) {
	return _.defaults({}, settings, { selector: 'tournament' });
};

/**
 * Normalizes the `selector` and `selectorClass` settings.
 * @memberof settingsUtils
 * @param {Object} settings - Settings object from the ::run method.
 * @returns {Object} - Copy of settings with `selector` property replaced by the
 *   equivalent `selectorClass` propety, or deleted if an explicit
 *   `selectorClass` property already exists.
 */
exports.normalizeSelector = function(settings) {
	let { selector, selectorClass } = settings;
	let result = _.omit(settings, 'selector');
	if (!selectorClass) result.selectorClass = defaultRegistry.get(selector);
	return result;
};

exports.getSelectorClassSettings = function(settings) {
	let { selectorClass } = settings;
	return _.pick(selectorClass.settings, [
		'selectorSettings',
		'async.add',
		'async.select'
	]);
};

// TODO: Docs
exports.getChromosomeClassSettings = function(settings) {
	let { chromosomeClass } = settings;
	if (!chromosomeClass) return {};
	return _.pick(chromosomeClass.settings, [
		'solutionFitness',
		'crossoverRate',
		'manualCrossoverCheck',
		'parentCount',
		'childCount',
		'mutationRate',
		'async.create',
		'async.getFitness',
		'async.crossover',
		'async.mutate'
	]);
};

/**
 * Adds defaults to the provided settings object.
 * @memberof settingsUtils
 * @param {Object} settings - Settings object from the ::run method.
 * @returns {Object} - Copy of settings with defaults added.
 */
exports.applyDefaults = function(settings) {
	return _.defaultsDeep(
		{},
		settings,
		exports.getSelectorClassSettings(settings),
		exports.getChromosomeClassSettings(settings),
		{
			generationLimit: Infinity,
			solutionFitness: Infinity,
			crossoverRate: 0,
			manualCrossoverCheck: false,
			parentCount: 2,
			childCount: 2,
			mutationRate: 0,
			selector: 'tournament',
			selectorSettings: {}
		}
	);
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
		_.pick(chromosomeAsync, [
			'create',
			'getFitness',
			'crossover',
			'mutate'
		])
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
	// TODO: Add data objects to errors.
	let { createChromosome } = settings;
	if (!createChromosome) {
		throw new XError(
			XError.INVALID_ARGUMENT,
			'Either chromosomeClass or createChromosome is required.'
		);
	}
	if (!_.isFunction(createChromosome)) {
		throw new XError(
			XError.INVALID_ARGUMENT,
			'createChromosome must be a function.'
		);
	}

	let { selectorClass } = settings;
	if (!_.isFunction(selectorClass)) {
		throw new XError(
			XError.INVALID_ARGUMENT,
			'selectorClass must be a constructor.'
		);
	}

	let { generationSize } = settings;
	if (!_.isNumber(generationSize)) {
		throw new XError(
			XError.INVALID_ARGUMENT,
			'generationSize is required.'
		);
	}
	if (!_.isInteger(generationSize) || generationSize < 1) {
		throw new XError(
			XError.INVALID_ARGUMENT,
			'generationSize must be a positive integer.'
		);
	}

	let { generationLimit } = settings;
	if (!_.isNumber(generationLimit)) {
		throw new XError(
			XError.INVALID_ARGUMENT,
			'generationLimit must be a number.'
		);
	}

	let { solutionFitness } = settings;
	if (!_.isNumber(solutionFitness)) {
		throw new XError(
			XError.INVALID_ARGUMENT,
			'solutionFitness must be a number.'
		);
	}

	let { crossoverRate } = settings;
	if (!_.isNumber(crossoverRate)) {
		throw new XError(
			XError.INVALID_ARGUMENT,
			'crossoverRate must be a number.'
		);
	}

	let { parentCount } = settings;
	if (!_.isInteger(parentCount) || parentCount < 2) {
		throw new XError(
			XError.INVALID_ARGUMENT,
			'parentCount must be an integer greater than 1.'
		);
	}

	let { childCount } = settings;
	if (!_.isInteger(childCount) || childCount < 1) {
		throw new XError(
			XError.INVALID_ARGUMENT,
			'childCount must be a positive integer.'
		);
	}
	if (!_.isInteger(generationSize / childCount)) {
		throw new XError(
			XError.INVALID_ARGUMENT,
			'generationSize must be a multiple of childCount.'
		);
	}

	let { mutationRate } = settings;
	if (!_.isNumber(mutationRate)) {
		throw new XError(
			XError.INVALID_ARGUMENT,
			'mutationRate must be a number.'
		);
	}

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
	let defaultSelectorAdded = exports.addDefaultSelector(settings);
	let selectorNormalized = exports.normalizeSelector(defaultSelectorAdded);
	let withDefaults = exports.applyDefaults(selectorNormalized);
	let chromosomeNormalized = exports.normalizeChromosome(withDefaults);
	return exports.validate(chromosomeNormalized);
};
