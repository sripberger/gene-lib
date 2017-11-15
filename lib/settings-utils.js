const _ = require('lodash');
const XError = require('xerror');
const { defaultRegistry } = require('./selector-registry');

/**
 * Internal utilty functions for normalizing user-provided settings.
 * @name settingsUtils
 * @kind module
 * @private
 */

/**
 * Applys the default 'selector' property to settings.
 * @memberof settingsUtils
 * @param {Object} settings - Settings object from the ::run method.
 * @returns {Object} - Copy of settings a `selector` property of 'tournament'
 *   added, if it did not already have a `selector` property.
 */
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

/**
 * Gets class-level settings from the selectorClass.
 * @memberof settingsUtils
 * @param {Object} settings - Settings object from the ::run method.
 * @returns {Object} - Supported selector-class-level settings from the
 *   selectorClass, if any. Returns an empty object, otherwise.
 */
exports.getSelectorClassSettings = function(settings) {
	let { selectorClass } = settings;
	let classSettings = selectorClass.settings || {};
	let { defaults } = classSettings;
	let result = _.pick(classSettings, [ 'async.add', 'async.select' ]);
	if (defaults) result.selectorSettings = defaults;
	return result;
};

/**
 * Gets class-level settings from the chromosomeClass.
 * @memberof settingsUtils
 * @param {Object} settings - Settings object from the ::run method.
 * @returns {Object} - Supported chromosome-class-level settings from the
 *   chromosomeClass, if any. Returns an empty object, otherwise.
 */
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
 * Normalizes the `async` setting.
 * @memberof settingsUtils
 * @param {Object} settings - Settings object from the ::run method.
 * @returns {Object} - Copy of settings with async setting normalized.
 */
exports.normalizeAsync = function(settings) {
	let { async } = settings;
	let result = _.omit(settings, 'async');
	if (async) {
		result.async = _(async)
			.mapValues((value) => {
				if (_.isNumber(value)) return value;
				if (value) return 1;
			})
			.pickBy()
			.value();
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
	let { createChromosome } = settings;
	if (!createChromosome) {
		throw new XError(
			XError.INVALID_ARGUMENT,
			'Either chromosomeClass or createChromosome is required.',
			{ settings }
		);
	}
	if (!_.isFunction(createChromosome)) {
		throw new XError(
			XError.INVALID_ARGUMENT,
			'createChromosome must be a function.',
			{ createChromosome }
		);
	}

	let { selectorClass } = settings;
	if (!_.isFunction(selectorClass)) {
		throw new XError(
			XError.INVALID_ARGUMENT,
			'selectorClass must be a constructor.',
			{ selectorClass }
		);
	}

	let { generationSize } = settings;
	if (!_.isNumber(generationSize)) {
		throw new XError(
			XError.INVALID_ARGUMENT,
			'generationSize is required.',
			{ settings }
		);
	}
	if (!_.isInteger(generationSize) || generationSize < 1) {
		throw new XError(
			XError.INVALID_ARGUMENT,
			'generationSize must be a positive integer.',
			{ generationSize }
		);
	}

	let { generationLimit } = settings;
	if (!_.isNumber(generationLimit)) {
		throw new XError(
			XError.INVALID_ARGUMENT,
			'generationLimit must be a number.',
			{ generationLimit }
		);
	}

	let { solutionFitness } = settings;
	if (!_.isNumber(solutionFitness) && solutionFitness !== false) {
		throw new XError(
			XError.INVALID_ARGUMENT,
			'solutionFitness must be a number or false.',
			{ solutionFitness }
		);
	}

	let { crossoverRate } = settings;
	if (!_.isNumber(crossoverRate)) {
		throw new XError(
			XError.INVALID_ARGUMENT,
			'crossoverRate must be a number.',
			{ crossoverRate }
		);
	}

	let { parentCount } = settings;
	if (!_.isInteger(parentCount) || parentCount < 2) {
		throw new XError(
			XError.INVALID_ARGUMENT,
			'parentCount must be an integer greater than 1.',
			{ parentCount }
		);
	}

	let { childCount } = settings;
	if (!_.isInteger(childCount) || childCount < 1) {
		throw new XError(
			XError.INVALID_ARGUMENT,
			'childCount must be a positive integer.',
			{ childCount }
		);
	}
	if (!_.isInteger(generationSize / childCount)) {
		throw new XError(
			XError.INVALID_ARGUMENT,
			'generationSize must be a multiple of childCount.',
			{ generationSize, childCount }
		);
	}

	let { mutationRate } = settings;
	if (!_.isNumber(mutationRate)) {
		throw new XError(
			XError.INVALID_ARGUMENT,
			'mutationRate must be a number.',
			{ mutationRate }
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
	let asyncNormalized = exports.normalizeAsync(chromosomeNormalized);
	return exports.validate(asyncNormalized);
};
