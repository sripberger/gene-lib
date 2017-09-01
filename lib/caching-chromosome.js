const Chromosome = require('./chromosome');
const _ = require('lodash');
const XError = require('xerror');

class CachingChromosome extends Chromosome {
	calculateFitness() {
		throw new XError(XError.UNSUPPORTED_OPERATION);
	}

	getFitness() {
		if (_.isNil(this._fitness)) {
			this._fitness = this.calculateFitness();
		}
		return this._fitness;
	}
}

module.exports = CachingChromosome;
