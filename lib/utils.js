const _ = require('lodash');
const TournamentSelector = require('./tournament-selector');
const Runner = require('./runner');

exports.normalizeSettings = function(settings) {
	let result = _.defaults({}, settings, {
		generationSize: 100,
		generationLimit: 10000,
		crossoverRate: 0,
		compoundCrossover: false,
		mutationRate: 0,
		selectorClass: TournamentSelector,
		selectorSettings: {}
	});

	let { individualClass } = result;
	if (individualClass) {
		result.createIndividual = individualClass.create.bind(individualClass);
	}

	return result;
};

exports.categorizeSettings = function(settings) {
	return {
		runnerSettings: _.pick(settings, [
			'generationLimit',
			'generationSize'
		]),
		generationSettings: _.pick(settings, [
			'crossoverRate',
			'compoundCrossover',
			'mutationRate'
		]),
		selectorClass: settings.selectorClass,
		selectorSettings: settings.selectorSettings,
		createIndividual: settings.createIndividual,
		createArg: settings.createArg
	};
};

exports.transformSettings = function(settings) {
	return exports.categorizeSettings(exports.normalizeSettings(settings));
};

exports.run = function(settings) {
	let runner = Runner.create(exports.transformSettings(settings));
	runner.run();
	return runner.getBest();
};


exports.getCrossoverRange = function(length) {
	let a = _.random(0, length);
	let b = _.random(0, length);
	return (a < b) ? [ a, b ] : [ b, a ];
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
