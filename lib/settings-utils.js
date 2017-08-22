const _ = require('lodash');
const TournamentSelector = require('./tournament-selector');

exports.getAsyncFromClasses = function(settings) {
	let { selectorClass, chromosomeClass } = settings;
	let selectorAsync = selectorClass && selectorClass.async;
	let chromosomeAsync = chromosomeClass && chromosomeClass.async;
	if (!selectorAsync && !chromosomeAsync) return null;
	return _.assign(
		_.pick(selectorAsync, [
			'add',
			'select'
		]),
		_.pick(chromosomeAsync, [
			'create',
			'calculateFitness',
			'crossover',
			'mutate'
		])
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
	let { chromosomeClass } = settings;
	let result = _.omit(settings, 'chromosomeClass');
	if (chromosomeClass) {
		result.createChromosome = chromosomeClass.create.bind(chromosomeClass);
	}
	return result;
};

exports.applyDefaults = function(settings) {
	return _.defaults({}, settings, {
		generationLimit: Infinity,
		crossoverRate: 0,
		compoundCrossover: false,
		parentCount: 2,
		childCount: 2,
		mutationRate: 0,
		selectorClass: TournamentSelector
	});
};

exports.validate = function(settings) {
	// TODO: Add validation checks.
	return settings;
};

exports.normalize = function(settings) {
	let asyncNormalized = exports.normalizeAsync(settings);
	let chromosomeNormalized = exports.normalizeChromosome(asyncNormalized);
	let withDefaults = exports.applyDefaults(chromosomeNormalized);
	return exports.validate(withDefaults);
};
