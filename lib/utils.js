const _ = require('lodash');

exports.boolChance = function(rate) {
	return Math.random() < rate;
};

exports.getCrossoverPoint = function(length) {
	return _.random(0, length);
};

exports.getCrossoverRange = function(length) {
	let [ a, b ] = _.times(2, () => exports.getCrossoverPoint(length));
	return (a < b) ? [ a, b ] : [ b, a ];
};

exports.getCrossoverIndices = function(length) {
	let indices = [];
	for (let i = 0; i < length; i += 1) {
		if (exports.boolChance(0.5)) indices.push(i);
	}
	return indices;
};

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

function resolvePmxItem(item, incomingCrossover, outgoingCrossover) {
	while (_.includes(incomingCrossover, item)) {
		item = outgoingCrossover[incomingCrossover.indexOf(item)];
	}
	return item;
}
