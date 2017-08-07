const RouletteSelector = require('../../lib/roulette-selector');
const ArraySelector = require('../../lib/array-selector');
const sinon = require('sinon');
const TestChromosome = require('../lib/test-chromosome');

describe('RouletteSelector', function() {
	let sandbox;

	beforeEach(function() {
		sandbox = sinon.sandbox.create();
	});

	afterEach(function() {
		sandbox.restore();
	});

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
		it('adds fitness to fitiness total', function() {
			let selector = new RouletteSelector();
			let foo = new TestChromosome('foo');
			selector.fitnessTotal = 2;
			sinon.stub(foo, 'getFitness').returns(3);
			sandbox.spy(ArraySelector.prototype, 'add');

			selector.add(foo);

			expect(ArraySelector.prototype.add).to.be.calledOnce;
			expect(ArraySelector.prototype.add).to.be.calledOn(selector);
			expect(ArraySelector.prototype.add).to.be.calledWith(foo);
			expect(foo.getFitness).to.be.calledOnce;
			expect(foo.getFitness).to.be.calledOn(foo);
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
			foo = new TestChromosome('foo');
			bar = new TestChromosome('bar');
			baz = new TestChromosome('baz');

			selector.chromosomes = [ foo, bar, baz ];

			sinon.stub(selector, 'spin').returns(12);
			sinon.stub(foo, 'getFitness').returns(3);
			sinon.stub(bar, 'getFitness').returns(4);
			sinon.stub(baz, 'getFitness').returns(5);
		});

		it('calls #spin and gets chromosome fitnesses', function() {
			selector.select();

			expect(selector.spin).to.be.calledOnce;
			expect(selector.spin).to.be.calledOn(selector);
			expect(foo.getFitness).to.be.calledOnce;
			expect(foo.getFitness).to.be.calledOn(foo);
			expect(bar.getFitness).to.be.calledOnce;
			expect(bar.getFitness).to.be.calledOn(bar);
			expect(baz.getFitness).to.be.calledOnce;
			expect(baz.getFitness).to.be.calledOn(baz);
		});

		it('returns chromosome based on spin result', function() {
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
			selector.chromosomes = [];

			expect(selector.select()).to.be.null;
		});
	});
});
