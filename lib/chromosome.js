const XError = require('xerror');

class Chromosome {
	static isChromosome(obj) {
		return (typeof obj.getFitness === 'function');
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
