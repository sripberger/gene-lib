const _ = require('lodash');
const TournamentSelector = require('./tournament-selector');
const Runner = require('./runner');

exports.normalizeSettings = function(settings) {
	let result = _.defaults({}, settings, {
		generationSize: 100,
		generationLimit: 10000,
		crossoverRate: 0,
		compoundCrossover: false,
		parentCount: 2,
		childCount: 2,
		mutationRate: 0,
		selectorClass: TournamentSelector,
		selectorSettings: {}
	});

	let { chromosomeClass } = result;
	if (chromosomeClass) {
		result.createChromosome = chromosomeClass.create.bind(chromosomeClass);
	}

	return result;
};

exports.run = function(settings) {
	return Runner.create(exports.normalizeSettings(settings))
		.then((runner) => runner.run())
		.then((result) => result.chromosome);
};
