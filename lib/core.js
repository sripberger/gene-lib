const _ = require('lodash');
const XError = require('xerror');
const settingsUtils = require('./settings-utils');
const runUtils = require('./run-utils');
const { defaultRegistry } = require('./selector-registry');

// Function names here are provided explicitly to prevent documentation.js
// from mistakenly inferring @memberof tags.

/**
 * Runs a genetic algorithm with the provided settings. Processing for each
 * generation will be placed at the end of the event loop queue, allowing
 * execution to be shared even if none of the algorithm's component operations
 * are asynchronous.
 * @function run
 * @param {Object} settings - Algorithm settings object.
 *   @param {Function} [settings.chromosomeClass] - Chromosome class
 *     constructor. Must implement the `::create` method.
 *   @param {Function} [settings.createChromosome] - Alternative to
 *     `chromosomeClass`. A simple factory function which should return a
 *     chromosome object with each invocation.
 *   @param {*} [settings.createArg] - Argument for the `::create` method or
 *     `createChromosome` function.
 *   @param {Array} [settings.createArgs] - Alternative to `createArg` which
 *     allows for multiple arguments.
 *   @param {String} [settings.selector='tournament'] - Selection method. Uses
 *     the selector class registered for the provided key.
 *   @param {Function} [settings.selectorClass] - Alternative to `selector`.
 *     Allows the selector class constructor to be provided directly.
 *   @param {Object} [settings.selectorSettings={}] - Settings object which
 *     will be provided to selector class instances. See the documentation for
 *     the selector class you're using for more information.
 *   @param {number} settings.generationSize - Number of individuals per
 *     generation.
 *   @param {number} [settings.generationLimit=Infinity] - Maximum number of
 *     generations. If not set, the algorithm will continue until at least one
 *     individual's fitness meets or exceeds `solutionFitness`.
 *   @param {number|false} [settings.solutionFitness=Infinity] - When an
 *     individual's fitness meets or exceeds this number, it will be considered
 *     a solution, causing the algorithm to stop. To disable this behavior, set
 *     this to false.
 *   @param {number} [settings.crossoverRate=0] - Fraction of individuals in
 *     each generation that should be produced through crossover operations,
 *     on average. If set, chromosome objects must implement the `#crossover`
 *     method.
 *   @param {boolean} [settings.manualCrossoverCheck=false] - Set to true to
 *     forgo gene-lib's crossover rate checks, allowing you to handle them
 *     manually in the `#crossover` method. This is similar to setting the
 *     `crossoverRate` to 1, though it allows the `#crossover` method to still
 *     receive a `crossoverRate` that isn't necessarily 1 as an argument.
 *   @param {number} [settings.parentCount=2] - The number of parents to be
 *     selected for each crossover operation. It must be at least two. Any
 *     parents beyond the first two will appear as additional arguments to the
 *     #crossover method, before the final `rate` argument.
 *   @param {number} [settings.childCount=2] - The number of children to be
 *     produced by each crossover operation. Your #crossover method must always
 *     return an array of children with length equal to this number. If you set
 *     it to 1, you may instead return a single child without needing to wrap
 *     it in an array.
 *   @param {number} [settings.mutationRate=0] - Fractional rate of mutation.
 *     If set, your chromosome objects must implement the `#mutate` method.
 *     Unlike crossover, mutation rate-checking can only be handled manually
 *     in the `#mutate` method itself. This setting will simply be provided as
 *     an argument to that method.
 *   @param {Function} [settings.onGeneration] - Will be invoked at the end of
 *       each generation. Receives an object argument detailing the current
 *       state of the algorithm, in the same format as the end result object.
 *   @param {Object} [settings.async] - Used to specify asynchronous operations.
 *     @param {number} [settings.async.create] - Maximum number of simultaneous
 *       chromosome creation operations. If set, your `::create` method or
 *       `createChromosome` function must return a Promise.
 *     @param {number} [settings.async.getFitness] - Maximum number of
 *       simultaneous fitness calculation operations. If set, your chromosome's
 *       `#getFitness` method must return a Promise.
 *     @param {number} [settings.async.add] - Maximum number of simultaneous
 *       add-to-selector operations. If set, your selector's '#add' method must
 *       return a Promise.
 *     @param {number} [settings.async.select] - Maximum number of simultaneous
 *       selection operations. If set, your selector's '#select' operation must
 *       return a Promise.
 *     @param {number} [settings.async.crossover] - Maximum number of
 *       simultaneous crossover operations. If set, your chromosome's
 *       `#crossover` method must return a Promise.
 *     @param {number} [settings.async.mutate] - Maximum number of simultaneous
 *       mutation operations. If set, your chromosome's `#mutate` method must
 *       return a Promise.
 *   @returns {Promise<Object>} - Will resolve with the an object containing the
 *      final state of the algorithm, with 'generationCount', 'best', and
 *      'individuals' properties.
 */
exports.run = function(settings) {
	return runUtils.runAsync(settingsUtils.normalize(settings));
};

/**
 * Runs a genetic algorithm with the provided settings, forcing all operations
 * to take place in a single event loop. Use of this method is not recommended
 * as part of an application that responds to requests, as it blocks execution
 * completely until finished, preventing any other requests from being handled.
 * @function runSync
 * @param {Object} settings - Algorithm settings object. These are the same as
 *   for `::run`, except that `settings.async` is not supported and will cause
 *   this method to throw, if present.
 * @returns {Object} - Contains the final state of the algorithm, with
 *   'generationCount', 'best', and 'individuals' properties.
 */
exports.runSync = function(settings) {
	let normalizedSettings = settingsUtils.normalize(settings);
	if (normalizedSettings.async) {
		throw new XError(
			XError.INVALID_ARGUMENT,
			'::runSync does not allow asynchronous operations.',
			_.pick(normalizedSettings, 'async')
		);
	}
	return runUtils.runSync(normalizedSettings);
};

/**
 * Registers a new class for use with the `settings.selector` ::run argument.
 * @function registerSelector
 * @param {String} key - Selector setting value. Must not already be registered.
 * @param {Function} selectorClass - Selector class constructor.
 * @returns {undefined}
 */
exports.registerSelector = function(key, selectorClass) {
	defaultRegistry.register(key, selectorClass);
};
