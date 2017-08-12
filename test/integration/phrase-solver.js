const geneLib = require('../../lib');
const { TournamentSelector, RouletteSelector } = geneLib;
const Phrase = require('../lib/phrase');

describe('Phrase Solver', function() {
	const target = 'hello, world!';

	it('works with deterministic binary tournament selection', function() {
		return geneLib.run({
			generationSize: 100,
			generationLimit: 1000,
			crossoverRate: 0.2,
			mutationRate: 0.05,
			chromosomeClass: Phrase,
			createArg: target,
			selectorClass: TournamentSelector
		})
			.then((result) => {
				expect(result.str).to.equal(target);
			});
	});

	it('works with weighted ternary tournament selection', function() {
		return geneLib.run({
			generationSize: 100,
			generationLimit: 1000,
			crossoverRate: 0.2,
			mutationRate: 0.05,
			chromosomeClass: Phrase,
			createArg: target,
			selectorClass: TournamentSelector,
			selectorSettings: {
				tournamentSize: 3,
				baseWeight: 0.75
			}
		})
			.then((result) => {
				expect(result.str).to.equal(target);
			});
	});

	it('works with roulette selection', function() {
		return geneLib.run({
			generationSize: 100,
			generationLimit: 1000,
			crossoverRate: 0.2,
			mutationRate: 0.05,
			chromosomeClass: Phrase,
			createArg: target,
			selectorClass: RouletteSelector
		})
			.then((result) => {
				expect(result.str).to.equal(target);
			});
	});
});
