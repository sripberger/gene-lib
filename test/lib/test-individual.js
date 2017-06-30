const XError = require('xerror');

class TestIndividual {
	constructor(id) {
		this.id = id;
	}

	getFitnessScore() {
		throw new XError(XError.NOT_IMPLEMENTED);
	}

	isSolution() {
		throw new XError(XError.NOT_IMPLEMENTED);
	}

	crossover() {
		throw new XError(XError.NOT_IMPLEMENTED);
	}

	mutate() {
		throw new XError(XError.NOT_IMPLEMENTED);
	}
}

module.exports = TestIndividual;
