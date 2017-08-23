const RouletteSelector = require('../../lib/roulette-selector');
const ArraySelector = require('../../lib/array-selector');
const sinon = require('sinon');
const TestIndividual = require('../lib/test-individual');

describe('RouletteSelector', function() {
	it('extends ArraySelector', function() {
		let selector = new RouletteSelector();

		expect(selector).to.be.an.instanceof(ArraySelector);
		expect(selector.settings).to.deep.equal({});
	});

	it('supports settings argument', function() {
		let settings = { foo: 'bar' };

		let selector = new RouletteSelector(settings);

		expect(selector.settings).to.equal(settings);
	});

	it('sets initial fitnessTotal to zero', function() {
		let selector = new RouletteSelector();

		expect(selector.fitnessTotal).to.equal(0);
	});

	describe('#add', function() {
		it('adds individual fitness to fitness total', function() {
			let selector = new RouletteSelector();
			let foo = new TestIndividual('foo');
			foo.fitness = 3;
			selector.fitnessTotal = 2;
			sandbox.spy(ArraySelector.prototype, 'add');

			selector.add(foo);

			expect(ArraySelector.prototype.add).to.be.calledOnce;
			expect(ArraySelector.prototype.add).to.be.calledOn(selector);
			expect(ArraySelector.prototype.add).to.be.calledWith(foo);
			expect(selector.fitnessTotal).to.equal(5);
		});
	});

	describe('#spin', function() {
		it('returns product of fitnessTotal and random float in [0, 1)', function() {
			let selector = new RouletteSelector();
			selector.fitnessTotal = 4;
			sandbox.stub(Math, 'random').returns(0.75);

			let result = selector.spin();

			expect(Math.random).to.be.calledOnce;
			expect(Math.random).to.be.calledOn(Math);
			expect(result).to.equal(3);
		});
	});

	describe('#select', function() {
		let selector, foo, bar, baz;

		beforeEach(function() {
			selector = new RouletteSelector();
			foo = new TestIndividual('foo');
			bar = new TestIndividual('bar');
			baz = new TestIndividual('baz');

			selector.individuals = [ foo, bar, baz ];
			foo.fitness = 3;
			bar.fitness = 4;
			baz.fitness = 5;

			sinon.stub(selector, 'spin').returns(12);
		});

		it('calls #spin', function() {
			selector.select();

			expect(selector.spin).to.be.calledOnce;
			expect(selector.spin).to.be.calledOn(selector);
		});

		it('returns individual based on spin result', function() {
			selector.spin
				.onCall(0).returns(2.9)
				.onCall(1).returns(3)
				.onCall(2).returns(6.9)
				.onCall(3).returns(7);

			expect(selector.select()).to.equal(foo);
			expect(selector.select()).to.equal(bar);
			expect(selector.select()).to.equal(bar);
			expect(selector.select()).to.equal(baz);
		});

		it('returns null if selector is empty', function() {
			selector.individuals = [];

			expect(selector.select()).to.be.null;
		});
	});
});
