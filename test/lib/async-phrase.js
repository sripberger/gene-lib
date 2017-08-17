const Phrase = require('./phrase');

class AsyncPhrase extends Phrase {
	static create(target) {
		return Promise.resolve(super.create(target));
	}

	calculateFitness() {
		return Promise.resolve(super.calculateFitness());
	}

	mutate(rate) {
		return Promise.resolve(super.mutate(rate));
	}

	crossover(other, rate) {
		return Promise.resolve(super.crossover(other, rate));
	}
}

module.exports = AsyncPhrase;
