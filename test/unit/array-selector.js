const ArraySelector = require('../../lib/array-selector');
const Selector = require('../../lib/selector');
const TestChromosome = require('../lib/test-chromosome');

describe('ArraySelector', function() {
	it('extends Selector', function() {
		let selector = new ArraySelector();

		expect(selector).to.be.an.instanceof(Selector);
		expect(selector.settings).to.deep.equal({});
	});

	it('supports settings argument', function() {
		let settings = { foo: 'bar' };

		let selector = new ArraySelector(settings);

		expect(selector.settings).to.equal(settings);
	});

	it('creates empty chromosomes array', function() {
		let selector = new ArraySelector();

		expect(selector.chromosomes).to.deep.equal([]);
	});

	describe('#add', function() {
		it('pushes provided chromosome onto chromosomes array', function() {
			let selector = new ArraySelector();
			let foo = new TestChromosome('foo');
			let bar = new TestChromosome('bar');
			selector.chromosomes = [ foo ];

			selector.add(bar);

			expect(selector.chromosomes).to.deep.equal([ foo, bar ]);
		});
	});
});
