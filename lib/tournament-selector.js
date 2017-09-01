const ArraySelector = require('./array-selector');
const _ = require('lodash');

/**
 * Selector class for tournament selection.
 * @extends ArraySelector
 * @param {Object} [settings={}] - Selector configuration object. Will be passed
 *   from the `::run` method's settings.selectorSettings argument, if any.
 *   @param {Number} [settings.tournamentSize=2] - Number of individuals (k) to
 *     be selected at random from the population for each tournament.
 *   @param {Number} [settings.baseWeight=1] - Probability (p) of selecting the
 *     most fit individual from a tournament. Lower-fitness individuals will be
 *     selected with probabilities equal to p*((1-p))^n, where n is the number
 *     of ranks below first. To avoid unexpected behavior, this number should
 *     never be lower than 0.5.
 */
class TournamentSelector extends ArraySelector {
	/**
	 * Returns the probability of selecting each individual in a tournament,
	 * following the form p*((1-p))^n, where p is a base probability and n is
	 * the number of ranks below first. The final result will always be one
	 * minus the sum of the others.
	 * @static
	 * @param {number} base - Base probability (p).
	 * @param {number} count - Number of individuals in the tournament.
	 * @returns {Array<number>} - An array of selection probabilities, one for
	 *   each individual in the tournament.
	 */
	static getWeights(base, count) {
		let weights = [];
		for (let i = 0; i < count - 1; i += 1) {
			weights.push(base * Math.pow((1 - base), i));
		}
		weights.push(1 - _.sum(weights));
		return weights;
	}

	/**
	 * Returns a tournament as an array of individuals.
	 * @returns {Array<Object>} - A randomly-selected subset of elements from
	 *   this.individuals.
	 */
	getTournament() {
		return _.sampleSize(
			this.individuals,
			this.settings.tournamentSize || 2
		);
	}

	/**
	 * Returns a sorted tournament as an array of individuals.
	 * @returns {Array<Object>} - A randomly-selected subset of elements from
	 *   this.individuals, sorted by fitness, descending.
	 */
	getSortedTournament() {
		return _.orderBy(this.getTournament(), 'fitness', 'desc');
	}

	/**
	 * Performs deterministic selection, which always chooses the best
	 * individual from the tournament.
	 * @returns {Object|null} Selected individual, or null if the selector is
	 *   empty.
	 */
	selectDeterministic() {
		return _.maxBy(this.getTournament(), 'fitness') || null;
	}

	/**
	 * Performs weighted selection, which may potentially choose lower-fitness
	 * individuals from the tournament.
	 * @returns {Object|null} Selected individual, or null if the selector is
	 *   empty.
	 */
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

	/**
	 * Performs selection. Either deterministic or weighted selection will be
	 * used, depending on the baseWeight setting.
	 * @returns {Object|null} Selected individual, or null if the selector is
	 *   empty.
	 */
	select() {
		let { baseWeight } = this.settings;
		if (!baseWeight || baseWeight === 1) return this.selectDeterministic();
		return this.selectWeighted();
	}
}

module.exports = TournamentSelector;
