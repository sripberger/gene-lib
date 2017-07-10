const geneLib = require('../../lib');
const Phrase = require('../lib/phrase');

describe('gene-lib', function() {
	it('should work as a phrase solver', function() {
		let target = 'hello, world!';

		let result = geneLib.run({
			generationSize: 100,
			generationLimit: 1000,
			crossoverRate: 0.2,
			mutationRate: 0.05,
			individualClass: Phrase,
			createArg: target
		});

		expect(result.str).to.equal(target);
	});
});
