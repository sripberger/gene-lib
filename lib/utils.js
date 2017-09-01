const _ = require('lodash');
const boolChance = require('bool-chance');

/**
 * Gets a random chromosome index for a single-point crossover.
 * @param {number} length - Length of the chromosome.
 * @returns {number} A random integer in [0, length]
 */
exports.getCrossoverPoint = function(length) {
	return _.random(0, length);
};

/**
 * Gets two random chromosome indices for two-point crossover.
 * @param {number} length - Length of the chromosome.
 * @returns {Array<number>} Contains two random integers in [0, length]. For
 *   convenience, the lesser of the two will always be the first.
 *
 */
exports.getCrossoverRange = function(length) {
	let [ a, b ] = _.times(2, () => exports.getCrossoverPoint(length));
	return (a < b) ? [ a, b ] : [ b, a ];
};

/**
 * Gets an array of chromosome indices for multi-point crossover.
 * @param {number} length - Length of the chromosome.
 * @returns {Arrray<number>} Contains a random set of indices in [0, length].
 *   The probability of a given index being in this result is 0.5.
 */
exports.getCrossoverIndices = function(length) {
	let indices = [];
	for (let i = 0; i < length; i += 1) {
		if (boolChance.get(0.5)) indices.push(i);
	}
	return indices;
};

/**
 * Performs a partially-mapped crossover between two parent arrays. Note that
 * '===' is used for equality comparisons in this operation, so if your parent
 * arrays contain objects, make sure they're references to the same objects.
 * @param {Array} left - A parent array.
 * @param {Array} right - Another parent array.
 * @returns {Arrray<Array>} - Array containing the two resulting child arrays.
 */
exports.pmx = function(left, right) {
	let [ start, end ] = exports.getCrossoverRange(left.length);
	let leftCrossover = left.slice(start, end);
	let rightCrossover = right.slice(start, end);
	let leftChild = [];
	let rightChild = [];
	for (let i = 0; i < left.length; i += 1) {
		let leftItem, rightItem;
		if (i >= start && i < end) {
			// Copy items directly from opposite crossover slice.
			let crossoverIndex = i - start;
			leftItem = rightCrossover[crossoverIndex];
			rightItem = leftCrossover[crossoverIndex];
		} else {
			// Use relationship between crossover slices to prevent repeats.
			leftItem = resolvePmxItem(left[i], rightCrossover, leftCrossover);
			rightItem = resolvePmxItem(right[i], leftCrossover, rightCrossover);
		}
		leftChild.push(leftItem);
		rightChild.push(rightItem);
	}
	return [ leftChild, rightChild ];
};

/**
 * Internal helper function for resolving a partially-mapped crossover. Uses
 * the relationship between two crossover slices to prevent repeats in the
 * child sequence.
 * @private
 * @param {*} item - Item to resolve.
 * @param {Array} incomingCrossover - Crossover slice that is being moved into
 *   this child.
 * @param {Array} outgoingCrossover - Crossover slice that is being replaced by
 *   the incoming slice.
 * @returns {*} - An item which does not appear in the incomingCrossover but
 *   does appear in the outgoing crossover.
 */
function resolvePmxItem(item, incomingCrossover, outgoingCrossover) {
	while (_.includes(incomingCrossover, item)) {
		item = outgoingCrossover[incomingCrossover.indexOf(item)];
	}
	return item;
}
