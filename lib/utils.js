const _ = require('lodash');
const TournamentSelector = require('./tournament-selector');
const Runner = require('./runner');

exports.normalizeSettings = function(settings) {
	let result = _.defaults({}, settings, {
		generationSize: 100,
		generationLimit: 10000,
		crossoverRate: 0,
		compoundCrossover: false,
		mutationRate: 0,
		selectorClass: TournamentSelector,
		selectorSettings: {}
	});

	let { individualClass } = result;
	if (individualClass) {
		result.createIndividual = individualClass.create.bind(individualClass);
	}

	return result;
};

exports.categorizeSettings = function(settings) {
	return {
		runnerSettings: _.pick(settings, [
			'generationLimit',
			'generationSize'
		]),
		generationSettings: _.pick(settings, [
			'crossoverRate',
			'compoundCrossover',
			'mutationRate'
		]),
		selectorClass: settings.selectorClass,
		selectorSettings: settings.selectorSettings,
		createIndividual: settings.createIndividual
	};
};

exports.transformSettings = function(settings) {
	return exports.categorizeSettings(exports.normalizeSettings(settings));
};

exports.run = function(settings) {
	let runner = Runner.create(exports.transformSettings(settings));
	runner.run();
	return runner.getBest();
};
