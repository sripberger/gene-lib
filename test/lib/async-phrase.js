const _ = require('lodash');
const Phrase = require('./phrase');

class AsyncPhrase extends Phrase {
	static get settings() {
		return _.assign({}, super.settings, {
			async: {
				create: true,
				getFitness: true,
				mutate: true,
				crossover: true
			}
		});
	}

	static create(target) {
		return Promise.resolve(super.create(target));
	}

	getFitness() {
		return Promise.resolve(super.getFitness());
	}

	mutate(rate) {
		return Promise.resolve(super.mutate(rate));
	}

	crossover(other, rate) {
		return Promise.resolve(super.crossover(other, rate));
	}
}

module.exports = AsyncPhrase;
