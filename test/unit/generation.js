const Generation = require('../../lib/generation');
const sinon = require('sinon');
const Selector = require('../../lib/selector');
const Individual = require('../lib/individual');

describe('Generation', function() {
	let sandbox;

	beforeEach(function() {
		sandbox = sinon.sandbox.create();
	});

	afterEach(function() {
		sandbox.restore();
	});

	it('stores provided selector and settings object', function() {
		let selector = new Selector();
		let settings = { foo: 'bar' };

		let generation = new Generation(selector, settings);

		expect(generation.selector).to.equal(selector);
		expect(generation.settings).to.equal(settings);
	});

	it('defaults to an empty settings object', function() {
		let selector = new Selector();

		let generation = new Generation(selector);

		expect(generation.selector).to.equal(selector);
		expect(generation.settings).to.deep.equal({});
	});

	describe('#add', function() {
		let selector, generation, foo, bar;

		beforeEach(function() {
			selector = new Selector();
			generation = new Generation(selector);
			foo = new Individual('foo');
			bar = new Individual('bar');
			sinon.stub(selector, 'add');
		});

		it('adds individual to selector', function() {
			generation.add(foo);

			expect(selector.add).to.be.calledOnce;
			expect(selector.add).to.be.calledOn(selector);
			expect(selector.add).to.be.calledWithExactly(foo);
		});

		it('supports multiple arguments', function() {
			generation.add(foo, bar);

			expect(selector.add).to.be.calledTwice;
			expect(selector.add).to.always.be.calledOn(selector);
			expect(selector.add).to.be.calledWithExactly(foo);
			expect(selector.add).to.be.calledWithExactly(bar);
		});
	});

	describe('#getSize', function() {
		it('returns selector size', function() {
			let selector = new Selector();
			let generation = new Generation(selector);
			let selectorSize = 42;
			sinon.stub(selector, 'getSize').returns(selectorSize);

			let result = generation.getSize();

			expect(selector.getSize).to.be.calledOnce;
			expect(selector.getSize).to.be.calledOn(selector);
			expect(result).to.equal(selectorSize);
		});
	});

	describe('#getBest', function() {
		it('returns best individual from selector', function() {
			let selector = new Selector();
			let generation = new Generation(selector);
			let best = new Individual('best');
			sinon.stub(selector, 'getBest').returns(best);

			let result = generation.getBest();

			expect(selector.getBest).to.be.calledOnce;
			expect(selector.getBest).to.be.calledOn(selector);
			expect(result).to.equal(best);
		});
	});

	describe('#getUnmutatedOffspring', function() {
		let selector, settings, generation, foo, bar, fooBar, barFoo;

		beforeEach(function() {
			selector = new Selector();
			settings = { crossoverRate: 0.7 };
			generation = new Generation(selector, settings);
			foo = new Individual('foo');
			bar = new Individual('bar');
			fooBar = new Individual('foo-bar');
			barFoo = new Individual('bar-foo');

			sandbox.stub(selector, 'select')
				.onFirstCall().returns(foo)
				.onSecondCall().returns(bar);

			sandbox.stub(foo, 'crossover').returns([ fooBar, barFoo ]);
		});

		it('creates offspring from two selected mates', function() {
			let result = generation.getUnmutatedOffspring();

			expect(selector.select).to.be.calledTwice;
			expect(selector.select).to.always.be.calledOn(selector);
			expect(foo.crossover).to.be.calledOnce;
			expect(foo.crossover).to.be.calledOn(foo);
			expect(foo.crossover).to.be.calledWith(bar, settings.crossoverRate);
			expect(result).to.deep.equal([ fooBar, barFoo ]);
		});

		it('uses default crossover rate of 0', function() {
			delete settings.crossoverRate;

			let result = generation.getUnmutatedOffspring();

			expect(selector.select).to.be.calledTwice;
			expect(selector.select).to.always.be.calledOn(selector);
			expect(foo.crossover).to.be.calledOnce;
			expect(foo.crossover).to.be.calledOn(foo);
			expect(foo.crossover).to.be.calledWith(bar, 0);
			expect(result).to.deep.equal([ fooBar, barFoo ]);
		});

		it('returns single offspring in an array', function() {
			foo.crossover.returns(fooBar);

			let result = generation.getUnmutatedOffspring();

			expect(selector.select).to.be.calledTwice;
			expect(selector.select).to.always.be.calledOn(selector);
			expect(foo.crossover).to.be.calledOnce;
			expect(foo.crossover).to.be.calledOn(foo);
			expect(foo.crossover).to.be.calledWith(bar, settings.crossoverRate);
			expect(result).to.deep.equal([ fooBar ]);
		});
	});

	describe('#getOffspring', function() {
		let settings, generation, foo, bar, fooPrime, barPrime;

		beforeEach(function() {
			settings = { mutationRate: 0.1 };
			generation = new Generation(new Selector(), settings);
			foo = new Individual('foo');
			bar = new Individual('bar');
			fooPrime = new Individual('foo-prime');
			barPrime = new Individual('bar-prime');

			sandbox.stub(generation, 'getUnmutatedOffspring')
				.returns([ foo, bar ]);

			sandbox.stub(foo, 'mutate').returns(fooPrime);
			sandbox.stub(bar, 'mutate').returns(barPrime);
		});

		it('returns mutated offspring', function() {
			let result = generation.getOffspring();

			expect(generation.getUnmutatedOffspring).to.be.calledOnce;
			expect(generation.getUnmutatedOffspring).to.be.calledOn(generation);
			expect(foo.mutate).to.be.calledOnce;
			expect(foo.mutate).to.be.calledOn(foo);
			expect(foo.mutate).to.be.calledWith(settings.mutationRate);
			expect(bar.mutate).to.be.calledOnce;
			expect(bar.mutate).to.be.calledOn(bar);
			expect(bar.mutate).to.be.calledWith(settings.mutationRate);
			expect(result).to.deep.equal([ fooPrime, barPrime ]);
		});

		it('uses default mutation rate of 0', function() {
			delete settings.mutationRate;

			let result = generation.getOffspring();

			expect(generation.getUnmutatedOffspring).to.be.calledOnce;
			expect(generation.getUnmutatedOffspring).to.be.calledOn(generation);
			expect(foo.mutate).to.be.calledOnce;
			expect(foo.mutate).to.be.calledOn(foo);
			expect(foo.mutate).to.be.calledWith(0);
			expect(bar.mutate).to.be.calledOnce;
			expect(bar.mutate).to.be.calledOn(bar);
			expect(bar.mutate).to.be.calledWith(0);
			expect(result).to.deep.equal([ fooPrime, barPrime ]);
		});
	});

	describe('#getNext', function() {
		it('returns a new generation with next selector and same settings', function() {
			let settings = { foo: 'bar' };
			let selector = new Selector();
			let generation = new Generation(selector, settings);
			let nextSelector = new Selector();
			sinon.stub(selector, 'getNext').returns(nextSelector);

			let result = generation.getNext();

			expect(selector.getNext).to.be.calledOnce;
			expect(selector.getNext).to.be.calledOn(selector);
			expect(result).to.be.an.instanceof(Generation);
			expect(result.selector).to.equal(nextSelector);
			expect(result.settings).to.equal(settings);
		});
	});
});
