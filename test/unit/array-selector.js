const ArraySelector = require('../../lib/array-selector');
const Selector = require('../../lib/selector');
const TestIndividual = require('../lib/test-individual');
const sinon = require('sinon');

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

	describe('#getSize', function() {
		it('returns length of individuals array', function() {
			let selector = new ArraySelector();
			selector.individuals = [
				new TestIndividual('foo'),
				new TestIndividual('bar'),
				new TestIndividual('baz')
			];

			expect(selector.getSize()).to.equal(3);
		});
	});

	describe('#getBest', function() {
		let selector;

		beforeEach(function() {
			selector = new ArraySelector();
		});

		it('returns highest-scoring individual', function() {
			let foo = new TestIndividual('foo');
			let bar = new TestIndividual('bar');
			let baz = new TestIndividual('baz');
			sinon.stub(foo, 'getFitnessScore').returns(8);
			sinon.stub(bar, 'getFitnessScore').returns(10);
			sinon.stub(baz, 'getFitnessScore').returns(9);
			selector.individuals = [ foo, bar, baz ];

			let result = selector.getBest();

			expect(foo.getFitnessScore).to.be.called;
			expect(foo.getFitnessScore).to.always.be.calledOn(foo);
			expect(bar.getFitnessScore).to.be.called;
			expect(bar.getFitnessScore).to.always.be.calledOn(bar);
			expect(baz.getFitnessScore).to.be.called;
			expect(baz.getFitnessScore).to.always.be.calledOn(baz);
			expect(result).to.equal(bar);
		});

		it('returns null if individuals array is empty', function() {
			expect(selector.getBest()).to.be.null;
		});
	});
});
