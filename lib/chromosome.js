const _ = require('lodash');
const XError = require('xerror');

class Chromosome {
	static isChromosome(obj) {
		return _(obj)
			.pick([ 'getFitness', 'crossover', 'mutate' ])
			.every((item) => typeof item === 'function');
	}

	static create() {
		throw new XError(XError.UNSUPPORTED_OPERATION);
	}

	getFitness() {
		throw new XError(XError.UNSUPPORTED_OPERATION);
	}

	crossover() {
		throw new XError(XError.UNSUPPORTED_OPERATION);
	}

	mutate() {
		throw new XError(XError.UNSUPPORTED_OPERATION);
	}
}

module.exports = Chromosome;
