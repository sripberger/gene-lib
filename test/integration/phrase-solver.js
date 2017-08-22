const geneLib = require('../../lib');
const Phrase = require('../lib/phrase');
const AsyncPhrase = require('../lib/async-phrase');
const AsyncSelector = require('../lib/async-selector');

describe('Phrase Solver', function() {
	const target = 'hello, world!';

	it('works with deterministic binary tournament selection', function() {
		let result = geneLib.run({
			generationSize: 100,
			generationLimit: 1000,
			crossoverRate: 0.2,
			mutationRate: 0.05,
			chromosomeClass: Phrase,
			createArg: target,
			selector: 'tournament'
		});

		expect(result.str).to.equal(target);
	});

	it('works with weighted ternary tournament selection', function() {
		let result = geneLib.run({
			generationSize: 100,
			generationLimit: 1000,
			crossoverRate: 0.2,
			mutationRate: 0.05,
			chromosomeClass: Phrase,
			createArg: target,
			selector: 'tournament',
			selectorSettings: {
				tournamentSize: 3,
				baseWeight: 0.75
			}
		});

		expect(result.str).to.equal(target);
	});

	it('works with roulette selection', function() {
		let result = geneLib.run({
			generationSize: 100,
			generationLimit: 1000,
			crossoverRate: 0.2,
			mutationRate: 0.05,
			chromosomeClass: Phrase,
			createArg: target,
			selector: 'roulette'
		});

		expect(result.str).to.equal(target);
	});

	it('works with asynchronous operations', function() {
		return geneLib.run({
			generationSize: 100,
			generationLimit: 1000,
			crossoverRate: 0.2,
			mutationRate: 0.05,
			chromosomeClass: AsyncPhrase,
			createArg: target,
			selectorClass: AsyncSelector
		})
			.then((result) => {
				expect(result.str).to.equal(target);
			});
	});

	it('works asynchronously with synchronous operations', function() {
		return geneLib.run({
			generationSize: 100,
			generationLimit: 1000,
			crossoverRate: 0.2,
			mutationRate: 0.05,
			chromosomeClass: Phrase,
			createArg: target,
			selector: 'tournament',
			async: {}
		})
			.then((result) => {
				expect(result.str).to.equal(target);
			});
	});
});
