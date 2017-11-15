const Runner = require('./runner');

/**
 * Internal utility functions for running genetic algorithms.
 * @module runUtils
 * @private
 */

/**
 * Runs a synchronous genetic algorithm.
 * @param {Object} settings - Settings object from ::run method.
 * @returns {Object} - Best chromosome object.
 */
exports.runSync = function(settings) {
	return Runner.createSync(settings).runSync();
};

/**
 * Runs an asynchronous genetic algorithm.
 * @param {Object} settings - Settings object from ::run method.
 * @returns {Promise<Object>} - Will resolve with best chromosome object.
 */
exports.runAsync = function(settings) {
	return Runner.createAsync(settings)
		.then((runner) => runner.runAsync());
};
