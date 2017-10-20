const geneLib = require('../../lib');
const Phrase = require('../lib/phrase');
const AsyncPhrase = require('../lib/async-phrase');
const AsyncSelector = require('../lib/async-selector');

describe('Phrase Solver', function() {
	const target = 'hello, world!';

	it('works with deterministic binary tournament selection', function() {
		return geneLib.run({
			generationSize: 100,
			generationLimit: 1000,
			chromosomeClass: Phrase,
			createArg: target
		})
			.then((result) => {
				expect(result.best.chromosome.str).to.equal(target);
			});
	});

	it('works with weighted ternary tournament selection', function() {
		return geneLib.run({
			generationSize: 100,
			generationLimit: 1000,
			chromosomeClass: Phrase,
			createArg: target,
			selectorSettings: {
				tournamentSize: 3,
				baseWeight: 0.75
			}
		})
			.then((result) => {
				expect(result.best.chromosome.str).to.equal(target);
			});
	});

	it('works with roulette selection', function() {
		return geneLib.run({
			generationSize: 100,
			generationLimit: 1000,
			chromosomeClass: Phrase,
			createArg: target,
			selector: 'roulette'
		})
			.then((result) => {
				expect(result.best.chromosome.str).to.equal(target);
			});
	});

	it('works with asynchronous component operations', function() {
		return geneLib.run({
			generationSize: 100,
			generationLimit: 1000,
			chromosomeClass: AsyncPhrase,
			createArg: target,
			selectorClass: AsyncSelector
		})
			.then((result) => {
				expect(result.best.chromosome.str).to.equal(target);
			});
	});

	it('supports onGeneration hook', function() {
		let generationCounts = [];
		return geneLib.run({
			generationSize: 100,
			generationLimit: 5,
			chromosomeClass: Phrase,
			createArg: target,
			solutionFitness: false,
			onGeneration: (state) => {
				generationCounts.push(state.generationCount);
			}
		})
			.then(() => {
				expect(generationCounts).to.deep.equal([ 0, 1, 2, 3, 4, 5 ]);
			});
	});

	it('supports fully synchronous operation', function() {
		let result = geneLib.runSync({
			generationSize: 100,
			generationLimit: 1000,
			chromosomeClass: Phrase,
			createArg: target
		});

		expect(result.best.chromosome.str).to.equal(target);
	});
});
