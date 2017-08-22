const utils = require('./utils');
const TournamentSelector = require('./tournament-selector');
const RouletteSelector = require('./roulette-selector');
const { defaultRegistry } = require('./selector-registry');

// Export classes
exports.Chromosome =  require('./chromosome');
exports.Selector = require('./selector');
exports.ArraySelector = require('./array-selector');
exports.TournamentSelector = TournamentSelector;
exports.RouletteSelector = RouletteSelector;

// Register selectors
defaultRegistry.register('tournament', TournamentSelector);
defaultRegistry.register('roulette', RouletteSelector);

// Export run function
exports.run = require('./run-utils').run;

// Export utility functions
exports.getCrossoverPoint = utils.getCrossoverPoint;
exports.getCrossoverRange = utils.getCrossoverRange;
exports.getCrossoverIndices = utils.getCrossoverIndices;
exports.pmx = utils.pmx;
