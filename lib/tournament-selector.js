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

	selectDeterministic() {
		return _.maxBy(
			this.getTournament(),
			(individual) => individual.getFitnessScore()
		) || null;
	}

	selectWeighted() {
		let tournament = this.getSortedTournament();
		let weights = TournamentSelector.getWeights(
			this.settings.baseWeight || 1,
			tournament.length
		);
		let random = Math.random();
		for (let i = 0; i < tournament.length; i += 1) {
			let individual = tournament[i];
			let weight = weights[i];
			if (random < weight) return individual;
			random -= weight;
		}
		return null;
	}

	select() {
		let { baseWeight } = this.settings;
		if (!baseWeight || baseWeight === 1) return this.selectDeterministic();
		return this.selectWeighted();
	}
}

module.exports = TournamentSelector;
