const _ = require('lodash');
const boolChance = require('bool-chance');

// Function names here are provided explicitly to prevent documentation.js
// from mistakenly inferring @memberof tags.

/**
 * Gets a random chromosome index between zero and length.
 * @function getRandomIndex
 * @param {number} length - Length of the chromosome.
 * @returns {number} A random integer in [0, length]
 */
exports.getRandomIndex = function(length) {
	return _.random(0, length);
};

/**
 * Gets two random chromosome indices, a start and an end.
 * @function getRandomRange
 * @param {number} length - Length of the chromosome.
 * @returns {Array<number>} Contains two random integers in [0, length]. For
 *   convenience, the lesser of the two will always be the first.
 *
 */
exports.getRandomRange = function(length) {
	let [ a, b ] = _.times(2, () => exports.getRandomIndex(length));
	return (a < b) ? [ a, b ] : [ b, a ];
};

/**
 * Gets an array of random chromosome indices.
 * @function getRandomIndices
 * @param {number} length - Length of the chromosome.
 * @param {boolean} [pick=false] - Set to true to pick a set number of possible
 *   indices based on the provided ratio.
 * @param {number} [ratio=0.5] - Probability of an individual index being
 *   selected, or ratio of possible indices that will be selected (rounded
 *   down).
 * @returns {Arrray<number>} Contains a random set of integers in [0, length].
 */
exports.getRandomIndices = function(length, pick = false, ratio = 0.5) {
	let indices = _.range(length);
	if (_.isNumber(pick)) {
		ratio = pick;
		pick = false;
	}
	if (pick) return _.sampleSize(indices, Math.floor(length * ratio));
	return indices.filter(() => boolChance.get(ratio));
};

/**
 * Performs a single-point crossover between two arrays or strings.
 * @function singlePointCrossover
 * @param {Array|String} left - Left parent.
 * @param {Array|String} right - Right parent.
 * @returns {Array<Array|String>} -  Will contain two children, of the same
 *   type as `left`.
 */
exports.singlePointCrossover = function(left, right) {
	let point = exports.getRandomIndex(left.length);
	return simpleCrossover(left, right, (i) => i >= point);
};

/**
 * Performs a two-point crossover between two arrays or strings.
 * @function twoPointCrossover
 * @param {Array|String} left - Left parent.
 * @param {Array|String} right - Right parent.
 * @returns {Array<Array|String>} -  Will contain two children, of the same
 *   type as `left`.
 */
exports.twoPointCrossover = function(left, right) {
	let range = exports.getRandomRange(left.length);
	return simpleCrossover(left, right, (i) => _.inRange(i, ...range));
};

/**
 * Performs a uniform crossover between two arrays or strings.
 * @function uniformCrossover
 * @param {Array|String} left - Left parent.
 * @param {Array|String} right - Right parent.
 * @param {boolean} [pick=false] - Set to true to pick a set number of possible
 *   crossover indices based on the provided ratio.
 * @param {number} [ratio=0.5] - Probability of an individual index being
 *   selected for crossover, or ratio of possible indices that will be selected
 *   (rounded down).
 * @returns {Array<Array|String>} -  Will contain two children, of the same
 *   type as `left`.
 */
exports.uniformCrossover = function(left, right, pick, ratio) {
	let indices = exports.getRandomIndices(left.length, pick, ratio);
	return simpleCrossover(left, right, (i) => _.includes(indices, i));
};

/**
 * Performs a partially-matched crossover between two arrays or strings. Note
 * that '===' is used for equality comparisons in this operation, so if your
 * parent arrays contain objects, make sure they're references to the same
 * objects.
 * @function pmx
 * @param {Array|String} left - Left parent.
 * @param {Array|String} right - Right parent.
 * @returns {Arrray<Array|String>} - Will contain two children, of the same type
 *   as `left`.
 */
exports.pmx = function(left, right) {
	let range = exports.getRandomRange(left.length);
	let leftSlice = left.slice(...range);
	let rightSlice = right.slice(...range);
	let children = [ [], [] ];
	for (let i = 0; i < left.length; i += 1) {
		if (_.inRange(i, ...range)) {
			// Copy items directly from opposite-side parent.
			children[0].push(right[i]);
			children[1].push(left[i]);
		} else {
			// Use relationship between slices to prevent repeats.
			children[0].push(resolvePmxItem(left[i], rightSlice, leftSlice));
			children[1].push(resolvePmxItem(right[i], leftSlice, rightSlice));
		}
	}
	return convertChildren(children, left);
};


/**
 * Internal helper function for ensuring crossover children are returned as the
 * same type as their parents.
 * @private
 * @param {Array} children - Array of children to potentially convert.
 * @param {Array|String} parent - Sample parent.
 * @returns {Array<Array|String>} - If the sample parent is a string, will be an
 *   array of converted child strings. Otherwise, will be the `children`
 *   argument directly.
 */
function convertChildren(children, parent) {
	return (_.isString(parent)) ? children.map((c) => c.join('')) : children;
}

/**
 * Internal helper function for performing simple crossovers, such that
 * repetitions of values are allowed in the child sequences.
 * @private
 * @param {Array|String} left - Left parent.
 * @param {Array|String} right - Right parent.
 * @param {Function} shouldCrossover - Receives the index of an item. If true
 *   is returned, the items at that index will switch sides in the children.
 * @returns {Array<Array|String>} - An array containing the two children, of
 *   the same time as `left`.
 */
function simpleCrossover(left, right, shouldCrossover) {
	let children = [ [], [] ];
	for (let i = 0; i < left.length; i += 1) {
		if (shouldCrossover(i)) {
			// Copy items directly from opposite-side parent.
			children[0].push(right[i]);
			children[1].push(left[i]);
		} else {
			// Copy items directly from same-side parent.
			children[0].push(left[i]);
			children[1].push(right[i]);
		}
	}
	return convertChildren(children, left);
}

/**
 * Internal helper function for resolving a partially-matched crossover. Uses
 * the relationship between two crossover slices to prevent repeats in the
 * child sequence.
 * @private
 * @param {*} item - Item to resolve.
 * @param {Array} incomingSlice - Crossover slice that is being moved into this
 *   child.
 * @param {Array} outgoingSlice - Crossover slice that is being replaced by the
 *   incoming slice.
 * @returns {*} - An item which does not appear in the incomingCrossover but
 *   does appear in the outgoing crossover.
 */
function resolvePmxItem(item, incomingSlice, outgoingSlice) {
	while (_.includes(incomingSlice, item)) {
		item = outgoingSlice[incomingSlice.indexOf(item)];
	}
	return item;
}
