const settingsUtils = require('./settings-utils');
const runUtils = require('./run-utils');
const TournamentSelector = require('./tournament-selector');
const RouletteSelector = require('./roulette-selector');
const { defaultRegistry } = require('./selector-registry');
const utils = require('./utils');

exports.run = function(settings) {
	let normalizedSettings = settingsUtils.normalize(settings);
	if (!normalizedSettings.async) return runUtils.runSync(normalizedSettings);
	return runUtils.runAsync(normalizedSettings);
};

exports.registerSelector = function(key, selectorClass) {
	defaultRegistry.register(key, selectorClass);
};

// Register selectors
exports.registerSelector('tournament', TournamentSelector);
exports.registerSelector('roulette', RouletteSelector);

// Export library classes
exports.Chromosome =  require('./chromosome');
exports.CachingChromosome = require('./caching-chromosome');
exports.Selector = require('./selector');
exports.ArraySelector = require('./array-selector');
exports.TournamentSelector = TournamentSelector;
exports.RouletteSelector = RouletteSelector;

// Export utility functions
exports.getCrossoverPoint = utils.getCrossoverPoint;
exports.getCrossoverRange = utils.getCrossoverRange;
exports.getCrossoverIndices = utils.getCrossoverIndices;
exports.pmx = utils.pmx;
