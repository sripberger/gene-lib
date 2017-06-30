const XError = require('xerror');

class Individual {
	getFitnessScore() {
		throw new XError(XError.UNSUPPORTED_OPERATION);
	}

	isSolution() {
		throw new XError(XError.UNSUPPORTED_OPERATION);
	}

	crossover() {
		throw new XError(XError.UNSUPPORTED_OPERATION);
	}

	mutate() {
		throw new XError(XError.UNSUPPORTED_OPERATION);
	}
}

module.exports = Individual;
