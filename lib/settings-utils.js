const _ = require('lodash');
const { defaultRegistry } = require('./selector-registry');

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

exports.normalizeSelector = function(settings) {
	let { selector, selectorClass } = settings;
	let result = _.omit(settings, 'selector');
	if (selector && !selectorClass) {
		result.selectorClass = defaultRegistry.get(selector);
	}
	return result;
};

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

exports.normalizeAsync = function(settings) {
	let fromClasses = exports.getAsyncFromClasses(settings);
	if (!fromClasses) return settings;
	let result = _.omit(settings, 'async');
	result.async = _.defaults({}, settings.async, fromClasses);
	return result;
};

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

exports.validate = function(settings) {
	// TODO: Add validation checks.
	return settings;
};

exports.normalize = function(settings) {
	let withDefaults = exports.applyDefaults(settings);
	let selectorNormalized = exports.normalizeSelector(withDefaults);
	let asyncNormalized = exports.normalizeAsync(selectorNormalized);
	let chromosomeNormalized = exports.normalizeChromosome(asyncNormalized);
	return exports.validate(chromosomeNormalized);
};
