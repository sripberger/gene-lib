const Generation = require('../../lib/generation');
const sinon = require('sinon');
const Selector = require('../../lib/selector');
const utils = require('../../lib/utils');
const TestChromosome = require('../lib/test-chromosome');

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

	describe('::create', function() {
		it('returns an instance with provided selector class and settings', function() {
			let TestSelector = sinon.spy(function TestSelector() {});
			let selectorSettings = { foo: 'bar' };
			let generationSettings = { baz: 'qux' };

			let result = Generation.create(
				TestSelector,
				selectorSettings,
				generationSettings
			);

			expect(TestSelector).to.be.calledOnce;
			expect(TestSelector).to.be.calledWithNew;
			expect(TestSelector).to.be.calledWith(selectorSettings);
			expect(result).to.be.an.instanceof(Generation);
			expect(result.selector).to.equal(TestSelector.firstCall.returnValue);
			expect(result.settings).to.equal(generationSettings);
		});
	});

	describe('#add', function() {
		let selector, generation, foo, bar;

		beforeEach(function() {
			selector = new Selector();
			generation = new Generation(selector);
			foo = new TestChromosome('foo');
			bar = new TestChromosome('bar');
			sinon.stub(selector, 'add');
		});

		it('adds chromosome to selector', function() {
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

	describe('#populate', function() {
		it('adds factory results until provided size is reached', function() {
			let size = 1;
			let generation = new Generation();
			let factory = sinon.stub();
			let factoryArg = 'factory argument';
			let foo = new TestChromosome('foo');
			let bar = new TestChromosome('bar');
			let baz = new TestChromosome('baz');
			sinon.stub(generation, 'getSize').callsFake(() => size);
			sinon.stub(generation, 'add').callsFake(() => size += 1);
			factory
				.onFirstCall().returns(foo)
				.onSecondCall().returns(bar)
				.onThirdCall().returns(baz);

			generation.populate(4, factory, factoryArg);

			expect(generation.getSize).to.be.called;
			expect(generation.getSize).to.always.be.calledOn(generation);
			expect(factory).to.be.calledThrice;
			expect(factory).to.always.be.calledWith(factoryArg);
			expect(generation.add).to.be.calledThrice;
			expect(generation.add).to.always.be.calledOn(generation);
			expect(generation.add).to.be.calledWith(foo);
			expect(generation.add).to.be.calledWith(bar);
			expect(generation.add).to.be.calledWith(baz);
		});
	});

	describe('#getBest', function() {
		it('returns best chromosome from selector', function() {
			let selector = new Selector();
			let generation = new Generation(selector);
			let best = new TestChromosome('best');
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
			settings = { crossoverRate: 0.5 };
			generation = new Generation(selector, settings);
			foo = new TestChromosome('foo');
			bar = new TestChromosome('bar');
			fooBar = new TestChromosome('foo-bar');
			barFoo = new TestChromosome('bar-foo');

			sandbox.stub(selector, 'select')
				.onFirstCall().returns(foo)
				.onSecondCall().returns(bar);

			sandbox.stub(utils, 'boolChance');

			sandbox.stub(foo, 'crossover').returns([ fooBar, barFoo ]);
		});

		it('selects two mates', function() {
			generation.getUnmutatedOffspring();

			expect(selector.select).to.be.calledTwice;
			expect(selector.select).to.always.be.calledOn(selector);
		});

		context('compoundCrossover option is not set', function() {
			it('calls utils::boolChance with crossover rate', function() {
				generation.getUnmutatedOffspring();

				expect(utils.boolChance).to.be.calledOnce;
				expect(utils.boolChance).to.be.calledOn(utils);
				expect(utils.boolChance).to.be.calledWith(0.5);
			});

			context('utils::boolChance returns true', function() {
				beforeEach(function() {
					utils.boolChance.returns(true);
				});

				it('returns crossover of mates', function() {
					let result = generation.getUnmutatedOffspring();

					expect(foo.crossover).to.be.calledOnce;
					expect(foo.crossover).to.be.calledOn(foo);
					expect(foo.crossover).to.be.calledWith(bar, 0.5);
					expect(result).to.deep.equal([ fooBar, barFoo ]);
				});

				it('wraps single result in an array', function() {
					foo.crossover.returns(fooBar);

					let result = generation.getUnmutatedOffspring();

					expect(foo.crossover).to.be.calledWith(bar, 0.5);
					expect(result).to.deep.equal([ fooBar ]);
				});
			});

			context('utils::boolChance returns false', function() {
				it('returns unchanged mates', function() {
					utils.boolChance.returns(false);

					let result = generation.getUnmutatedOffspring();

					expect(result).to.deep.equal([ foo, bar ]);
				});
			});
		});

		context('compoundCrossover option is true', function() {
			beforeEach(function() {
				settings.compoundCrossover = true;
			});

			it('returns crossover without calling utils::boolChance', function() {
				let result = generation.getUnmutatedOffspring();

				expect(utils.boolChance).to.not.be.called;
				expect(foo.crossover).to.be.calledOnce;
				expect(foo.crossover).to.be.calledOn(foo);
				expect(foo.crossover).to.be.calledWith(bar, 0.5);
				expect(result).to.deep.equal([ fooBar, barFoo ]);
			});

			it('wraps single result in an array', function() {
				foo.crossover.returns(fooBar);

				let result = generation.getUnmutatedOffspring();

				expect(foo.crossover).to.be.calledWith(bar, 0.5);
				expect(result).to.deep.equal([ fooBar ]);
			});

			it('uses default crossover rate of zero', function() {
				delete settings.crossoverRate;

				generation.getUnmutatedOffspring();

				expect(foo.crossover).to.be.calledWith(bar, 0);
			});
		});
	});

	describe('#getOffspring', function() {
		let settings, generation, foo, bar, fooPrime, barPrime;

		beforeEach(function() {
			settings = { mutationRate: 0.1 };
			generation = new Generation(new Selector(), settings);
			foo = new TestChromosome('foo');
			bar = new TestChromosome('bar');
			fooPrime = new TestChromosome('foo-prime');
			barPrime = new TestChromosome('bar-prime');

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
