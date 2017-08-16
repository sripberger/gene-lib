const _ = require('lodash');
const TournamentSelector = require('./tournament-selector');

exports.normalize = function(settings) {
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

exports.process = function(settings) {
	let normalized = exports.normalize(settings);
	let withDefaults = exports.applyDefaults(normalized);
	return exports.validate(withDefaults);
};
