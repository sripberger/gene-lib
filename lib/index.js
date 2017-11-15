const _ = require('lodash');

// Export core methods.
_.assign(exports, require('./core'));

// Export utility methods.
_.assign(exports, require('./utils'));

// Export public classes.
exports.Chromosome =  require('./chromosome');
exports.CachingChromosome = require('./caching-chromosome');
exports.Selector = require('./selector');
exports.ArraySelector = require('./array-selector');
exports.TournamentSelector = require('./tournament-selector');
exports.RouletteSelector = require('./roulette-selector');

// Register selectors.
exports.registerSelector('tournament', exports.TournamentSelector);
exports.registerSelector('roulette', exports.RouletteSelector);
