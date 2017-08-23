const XError = require('xerror');
const _ = require('lodash');

class Chromosome {
	static isChromosome(obj) {
		return (typeof obj.getFitness === 'function');
	}

	static create() {
		throw new XError(XError.UNSUPPORTED_OPERATION);
	}

	calculateFitness() {
		throw new XError(XError.UNSUPPORTED_OPERATION);
	}

	getFitness() {
		if (_.isNil(this._fitness)) {
			this._fitness = this.calculateFitness();
		}
		return this._fitness;
	}

	crossover() {
		throw new XError(XError.UNSUPPORTED_OPERATION);
	}

	mutate() {
		throw new XError(XError.UNSUPPORTED_OPERATION);
	}
}

module.exports = Chromosome;
