const ArraySelector = require('../../lib/array-selector');
const Selector = require('../../lib/selector');
const TestIndividual = require('../lib/test-individual');

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

	it('creates empty individuals array', function() {
		let selector = new ArraySelector();

		expect(selector.individuals).to.deep.equal([]);
	});

	describe('#add', function() {
		it('pushes provided individual onto individuals array', function() {
			let selector = new ArraySelector();
			let foo = new TestIndividual('foo');
			let bar = new TestIndividual('bar');
			selector.individuals = [ foo ];

			selector.add(bar);

			expect(selector.individuals).to.deep.equal([ foo, bar ]);
		});
	});
});
