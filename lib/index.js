const settingsUtils = require('./settings-utils');
const runUtils = require('./run-utils');
const TournamentSelector = require('./tournament-selector');
const RouletteSelector = require('./roulette-selector');
const { defaultRegistry } = require('./selector-registry');
const utils = require('./utils');

// TODO: Better error messages for async configuration mistakes.

/**
 * Runs a genetic algorithm with the provided settings.
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
 *   @param {number} [settings.solutionFitness=Infinity] - When an individual's
 *     fitness meets or exceeds this number, it will be considered a solution,
 *     causing the algorithm to stop.
 *   @param {number} [settings.crossoverRate=0] - Fraction of individuals in
 *     each generation that should be produced through crossover operations,
 *     on average. If set, chromosome objects must implement the `#crossover`
 *     method.
 *   @param {boolean} [settings.compoundCrossover=false] - Set to true in order
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
 *   @param {Object} [settings.async] - Used to specify asynchronous operation.
 *     If set, `::run` will return a Promise, instead of the result directly.
 *     @param {number} [settings.async.create] - Maximum number of simultaneous
 *       chromosome creation operations. If set, your `::create` method or
 *       `createChromosome` function must return a Promise.
 *     @param {number} [settings.async.fitness] - Maximum number of simultaneous
 *       fitness calculation operations. If set, your chromosome's `#getFitness`
 *       method must return a Promise.
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
 *   @returns {Object|Promise<Object>} - The best chromosome object produced by
 *      the algorithm, or a Promise resolving with it. `::run` will return a
 *      Promise if and only if `settings.async` is set, or if either the
 *      chromsome class or the selector class have their own async properties
 *      set.
 */
exports.run = function(settings) {
	let normalizedSettings = settingsUtils.normalize(settings);
	if (!normalizedSettings.async) return runUtils.runSync(normalizedSettings);
	return runUtils.runAsync(normalizedSettings);
};

/**
 * Registers a new class for use with the `settings.selector` ::run argument.
 * @param {String} key - Selector setting value. Must not already be registered.
 * @param {Function} selectorClass - Selector class constructor.
 * @returns {undefined}
 */
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
