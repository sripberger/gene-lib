const XError = require('xerror');
const _ = require('lodash');

class Individual {
	static create() {
		throw new XError(XError.UNSUPPORTED_OPERATION);
	}

	calculateFitnessScore() {
		throw new XError(XError.UNSUPPORTED_OPERATION);
	}

	getFitnessScore() {
		if (!_.isNumber(this._fitnessScore)) {
			this._fitnessScore = this.calculateFitnessScore();
		}
		return this._fitnessScore;
	}

	isSolution() {
		return this.getFitnessScore() === Infinity;
	}

	crossover() {
		throw new XError(XError.UNSUPPORTED_OPERATION);
	}

	mutate() {
		throw new XError(XError.UNSUPPORTED_OPERATION);
	}
}

module.exports = Individual;
