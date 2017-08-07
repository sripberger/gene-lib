const XError = require('xerror');
const _ = require('lodash');

class Chromosome {
	static create() {
		throw new XError(XError.UNSUPPORTED_OPERATION);
	}

	calculateFitness() {
		throw new XError(XError.UNSUPPORTED_OPERATION);
	}

	getFitness() {
		if (!_.isNumber(this._fitness)) {
			this._fitness = this.calculateFitness();
		}
		return this._fitness;
	}

	isSolution() {
		return this.getFitness() === Infinity;
	}

	crossover(other) {
		return [ this, other ];
	}

	mutate() {
		return this;
	}
}

module.exports = Chromosome;
