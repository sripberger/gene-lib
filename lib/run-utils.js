const Runner = require('./runner');

/**
 * Internal utility functions for running genetic algorithms.
 * @name runUtils
 * @kind module
 * @private
 */

/**
 * Runs a synchronous genetic algorithm.
 * @memberof runUtils
 * @param {Object} settings - Settings object from ::run method.
 * @returns {Object} - Best chromosome object.
 */
exports.runSync = function(settings) {
	return Runner.createSync(settings).runSync().chromosome;
};

/**
 * Runs an asynchronous genetic algorithm.
 * @memberof runUtils
 * @param {Object} settings - Settings object from ::run method.
 * @returns {Promise<Object>} - Will resolve with best chromosome object.
 */
exports.runAsync = function(settings) {
	return Runner.createAsync(settings)
		.then((runner) => runner.runAsync())
		.then((best) => best.chromosome);
};
