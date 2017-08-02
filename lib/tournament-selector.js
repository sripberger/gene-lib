const ArraySelector = require('./array-selector');
const _ = require('lodash');

class TournamentSelector extends ArraySelector {
	static getWeights(base, count) {
		let weights = [];
		for (let i = 0; i < count - 1; i += 1) {
			weights.push(base * Math.pow((1 - base), i));
		}
		weights.push(1 - _.sum(weights));
		return weights;
	}

	getTournament() {
		return _.sampleSize(
			this.individuals,
			this.settings.tournamentSize || 2
		);
	}

	getSortedTournament() {
		return _.orderBy(
			this.getTournament(),
			(individual) => individual.getFitnessScore(),
			'desc'
		);
	}

	select() {
		return _.maxBy(
			this.getTournament(),
			(individual) => individual.getFitnessScore()
		) || null;
	}
}

module.exports = TournamentSelector;
