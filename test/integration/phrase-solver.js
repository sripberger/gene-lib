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
			chromosomeClass: Phrase,
			createArg: target
		});

		expect(result.best.chromosome.str).to.equal(target);
	});

	it('works with weighted ternary tournament selection', function() {
		let result = geneLib.run({
			generationSize: 100,
			generationLimit: 1000,
			chromosomeClass: Phrase,
			createArg: target,
			selectorSettings: {
				tournamentSize: 3,
				baseWeight: 0.75
			}
		});

		expect(result.best.chromosome.str).to.equal(target);
	});

	it('works with roulette selection', function() {
		let result = geneLib.run({
			generationSize: 100,
			generationLimit: 1000,
			chromosomeClass: Phrase,
			createArg: target,
			selector: 'roulette'
		});

		expect(result.best.chromosome.str).to.equal(target);
	});

	it('works with asynchronous operations', function() {
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

	it('works asynchronously with synchronous operations', function() {
		return geneLib.run({
			generationSize: 100,
			generationLimit: 1000,
			chromosomeClass: Phrase,
			createArg: target,
			async: {}
		})
			.then((result) => {
				expect(result.best.chromosome.str).to.equal(target);
			});
	});
});
