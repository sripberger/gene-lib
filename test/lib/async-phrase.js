const _ = require('lodash');
const Phrase = require('./phrase');

class AsyncPhrase extends Phrase {
	static get settings() {
		return _.assign({}, super.settings, {
			async: {
				create: true,
				getFitness: true,
				crossover: true,
				mutate: true
			}
		});
	}

	static create(target) {
		return Promise.resolve(super.create(target));
	}

	getFitness() {
		return Promise.resolve(super.getFitness());
	}

	crossover(other, rate) {
		return Promise.resolve(super.crossover(other, rate));
	}

	mutate(rate) {
		return Promise.resolve(super.mutate(rate));
	}
}

module.exports = AsyncPhrase;
