const Phrase = require('./phrase');

class AsyncPhrase extends Phrase {
	static get async() {
		return {
			create: 1,
			fitness: 1,
			mutate: 1,
			crossover: 1
		};
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
