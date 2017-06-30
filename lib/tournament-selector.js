const ArraySelector = require('./array-selector');
const _ = require('lodash');

class TournamentSelector extends ArraySelector {
	getTournament() {
		return _.sampleSize(this.individuals, this.settings.sampleSize || 2);
	}

	select() {
		return _.maxBy(
			this.getTournament(),
			(individual) => individual.getFitnessScore()
		) || null;
	}
}

module.exports = TournamentSelector;
