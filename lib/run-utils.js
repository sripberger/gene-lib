const _ = require('lodash');
const TournamentSelector = require('./tournament-selector');
const Runner = require('./runner');

exports.normalizeSettings = function(settings) {
	let { chromosomeClass } = settings;
	let result = _.omit(settings, 'chromosomeClass');
	if (chromosomeClass) {
		result.createChromosome = chromosomeClass.create.bind(chromosomeClass);
	}
	return result;
};

exports.applyDefaultSettings = function(settings) {
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

exports.validateSettings = function() {
	// TODO
};

exports.processSettings = function(settings) {
	let normalized = exports.normalizeSettings(settings);
	let result = exports.applyDefaultSettings(normalized);
	exports.validateSettings(result);
	return result;
};

exports.run = function(settings) {
	return Runner.create(exports.processSettings(settings))
		.then((runner) => runner.run())
		.then((result) => result.chromosome);
};
