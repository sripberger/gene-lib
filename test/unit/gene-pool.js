const GenePool = require('../../lib/gene-pool');
const sinon = require('sinon');
const _ = require('lodash');
const pasync = require('pasync');
const XError = require('xerror');
const Population = require('../../lib/population');
const Selector = require('../../lib/selector');
const utils = require('../../lib/utils');
const TestIndividual = require('../lib/test-individual');
const TestSelector = require('../lib/test-selector');

describe('GenePool', function() {
	let sandbox;

	beforeEach(function() {
		sandbox = sinon.sandbox.create();
	});

	afterEach(function() {
		sandbox.restore();
	});

	it('stores provided selector and settings', function() {
		let selector = new Selector();
		let settings = { foo: 'bar' };

		let pool = new GenePool(selector, settings);

		expect(pool.selector).to.equal(selector);
		expect(pool.settings).to.equal(settings);
	});

	it('defaults to empty settings object', function() {
		let selector = new Selector();

		let pool = new GenePool(selector);

		expect(pool.selector).to.equal(selector);
		expect(pool.settings).to.deep.equal({});
	});

	describe('::getMaxCrossoverCount', function() {
		it('returns generation size divided by child count', function() {
			expect(GenePool.getMaxCrossoverCount(12, 2)).to.equal(6);
			expect(GenePool.getMaxCrossoverCount(15, 3)).to.equal(5);
		});

		it('throws if generation size is not a multiple of child count', function() {
			expect(() => GenePool.getMaxCrossoverCount(10, 3))
				.to.throw(XError).that.satisfies((err) => {
					expect(err.code).to.equal(XError.INVALID_ARGUMENT);
					expect(err.message).to.equal(
						'generationSize must be a multiple of childCount'
					);
					return true;
				});
		});
	});

	describe('::getLitterCounts', function() {
		it('returns crossover and copy counts created using utils::boolChance', function() {
			let settings = {
				generationSize: 10,
				childCount: 2,
				crossoverRate: 0.2
			};
			sandbox.stub(GenePool, 'getMaxCrossoverCount').returns(5);
			sandbox.stub(utils, 'boolChance')
				.returns(false)
				.onCall(1).returns(true)
				.onCall(4).returns(true);

			let result = GenePool.getLitterCounts(settings);

			expect(GenePool.getMaxCrossoverCount).to.be.calledOnce;
			expect(GenePool.getMaxCrossoverCount).to.be.calledOn(
				GenePool
			);
			expect(GenePool.getMaxCrossoverCount).to.be.calledWith(
				settings.generationSize,
				settings.childCount
			);
			expect(utils.boolChance).to.have.callCount(5);
			expect(utils.boolChance).to.always.be.calledOn(utils);
			expect(utils.boolChance).to.always.be.calledWith(
				settings.crossoverRate
			);
			expect(result).to.deep.equal({
				crossoverCount: 2,
				copyCount: 3
			});
		});
	});

	describe('::create', function() {
		it('replaces generationSize with litter counts for new instance', function() {
			let selector = new Selector();
			let settings = {
				foo: 'bar',
				generationSize: 100
			};
			sandbox.stub(GenePool, 'getLitterCounts').returns({
				crossoverCount: 4,
				copyCount: 16
			});

			let result = GenePool.create(selector, settings);

			expect(GenePool.getLitterCounts).to.be.calledOnce;
			expect(GenePool.getLitterCounts).to.be.calledOn(GenePool);
			expect(GenePool.getLitterCounts).to.be.calledWith(settings);
			expect(result).to.be.an.instanceof(GenePool);
			expect(result.selector).to.equal(selector);
			expect(result.settings).to.deep.equal({
				foo: 'bar',
				crossoverCount: 4,
				copyCount: 16,
			});
		});
	});

	describe('::fromPopulation', function() {
		it('creates a GenePool from a population based on provided settings', function() {
			let population = new Population();
			let settings = {
				selectorClass: TestSelector,
				selectorSettings: { foo: 'bar' },
				addConcurrency: 4,
				baz: 'qux'
			};
			let selector = new TestSelector();
			let pool = new GenePool();
			sinon.stub(population, 'toSelector').resolves(selector);
			sandbox.stub(GenePool, 'create').returns(pool);

			return GenePool.fromPopulation(population, settings)
				.then((result) => {
					expect(population.toSelector).to.be.calledOnce;
					expect(population.toSelector).to.be.calledOn(population);
					expect(population.toSelector).to.be.calledWith(
						settings.selectorClass,
						settings.selectorSettings,
						settings.addConcurrency
					);
					expect(GenePool.create).to.be.calledOnce;
					expect(GenePool.create).to.be.calledOn(GenePool);
					expect(GenePool.create).to.be.calledWith(
						selector,
						{ baz: 'qux' }
					);
					expect(result).to.equal(pool);
				});
		});
	});

	describe('#getSelectionCount', function() {
		it('returns total number of individuals to be selected', function() {
			let selector = new Selector();
			let pool = new GenePool(selector, {
				parentCount: 2,
				childCount: 2,
				crossoverCount: 10,
				copyCount: 40
			});
			let otherScheme = new GenePool(selector, {
				parentCount: 3,
				childCount: 5,
				crossoverCount: 4,
				copyCount: 16
			});

			expect(pool.getSelectionCount()).to.equal(100);
			expect(otherScheme.getSelectionCount()).to.equal(92);
		});
	});

	describe('#performSelections', function() {
		let selector, pool, individuals;

		beforeEach(function() {
			selector = new Selector();
			pool = new GenePool(selector, {
				selectionConcurrency: 3,
				parentCount: 2,
				crossoverCount: 4,
				copyCount: 2,
			});
			individuals = _.times(6, (i) => new TestIndividual(i));

			sinon.stub(pool, 'getSelectionCount').returns(6);
			sandbox.stub(pasync, 'timesLimit').resolves(individuals);
		});

		it('resolves with organized pasync::timesLimit results', function() {
			return pool.performSelections()
				.then((result) => {
					expect(pool.getSelectionCount).to.be.calledOnce;
					expect(pool.getSelectionCount).to.be.calledOn(pool);
					expect(pasync.timesLimit).to.be.calledOnce;
					expect(pasync.timesLimit).to.be.calledOn(pasync);
					expect(pasync.timesLimit).to.be.calledWith(
						6,
						pool.settings.selectionConcurrency,
						sinon.match.func
					);
					expect(result).to.deep.equal({
						crossovers: [
							[ individuals[0], individuals[1] ],
							[ individuals[2], individuals[3] ]
						],
						copies: [ individuals[4], individuals[5] ]
					});
				});
		});

		describe('iteratee', function() {
			let iteratee;

			beforeEach(function() {
				return pool.performSelections()
					.then(() => {
						iteratee = pasync.timesLimit.firstCall.args[2];
					});
			});

			it('returns result of selector#select', function() {
				let [ individual ] = individuals;
				sinon.stub(selector, 'select').returns(individual);

				let result = iteratee();

				expect(selector.select).to.be.calledOnce;
				expect(selector.select).to.be.calledOn(selector);
				expect(result).to.equal(individual);
			});
		});
	});

	describe('#getUnmutatedOffpsring', function() {
		let pool, individuals, crossovers;

		beforeEach(function() {
			pool = new GenePool(new Selector(), {
				crossoverConcurrency: 2,
				crossoverRate: 4,
				childCount: 2
			});
			individuals = _.times(10, (i) => new TestIndividual(i));
			crossovers = [
				[ individuals[0], individuals[1] ],
				[ individuals[2], individuals[3] ]
			];

			sinon.stub(pool, 'performSelections').returns({
				crossovers,
				copies: [ individuals[4], individuals[5] ]
			});
			sandbox.stub(pasync, 'mapLimit').resolves([
				[ individuals[6], individuals[7] ],
				[ individuals[8], individuals[9] ]
			]);
		});

		it('combines all crossover and copy results into one population', function() {
			return pool.getUnmutatedOffpsring()
				.then((result) => {
					expect(pool.performSelections).to.be.calledOnce;
					expect(pool.performSelections).to.be.calledOn(pool);
					expect(pasync.mapLimit).to.be.calledOnce;
					expect(pasync.mapLimit).to.be.calledOn(pasync);
					expect(pasync.mapLimit).to.be.calledWith(
						crossovers,
						pool.settings.crossoverConcurrency,
						sinon.match.func
					);
					expect(result).to.be.an.instanceof(Population);
					expect(result.individuals).to.deep.equal([
						individuals[4],
						individuals[5],
						individuals[6],
						individuals[7],
						individuals[8],
						individuals[9]
					]);
				});
		});

		describe('iteratee', function () {
			let iteratee;

			beforeEach(function() {
				return pool.getUnmutatedOffpsring()
					.then(() => {
						iteratee = pasync.mapLimit.firstCall.args[2];
					});
			});

			it('resolves with result of Individual#crossover', function() {
				let foo = new TestIndividual('foo');
				let bar = new TestIndividual('bar');
				let baz = new TestIndividual('baz');
				let fooBar = new TestIndividual('foo-bar');
				let barFoo = new TestIndividual('bar-foo');
				let crossoverResult = [ fooBar, barFoo ];
				sinon.stub(foo, 'crossover').resolves(crossoverResult);


				return iteratee([ foo, bar, baz ])
					.then((result) => {
						expect(foo.crossover).to.be.calledOnce;
						expect(foo.crossover).to.be.calledOn(foo);
						expect(foo.crossover).to.be.calledWith(
							[ bar, baz ],
							pool.settings.crossoverRate
						);
						expect(result).to.equal(crossoverResult);
					});
			});
		});
	});

	describe('#getUnscoredOffspring', function() {
		let pool, unmutated, mutants;

		beforeEach(function() {
			let foo = new TestIndividual('foo');
			let bar = new TestIndividual('bar');
			let fooPrime = new TestIndividual('foo-prime');
			let barPrime = new TestIndividual('bar-prime');

			pool = new GenePool(new Selector(), {
				mutationRate: 0.01,
				mutationConcurrency: 4
			});
			unmutated = new Population([ foo, bar ]);
			mutants = new Population([ fooPrime, barPrime ]);

			sinon.stub(pool, 'getUnmutatedOffpsring').resolves(unmutated);
			sinon.stub(unmutated, 'mutate').resolves(mutants);
		});

		it('resolves with mutated offspring', function() {
			return pool.getUnscoredOffspring()
				.then((result) => {
					expect(pool.getUnmutatedOffpsring).to.be.calledOnce;
					expect(pool.getUnmutatedOffpsring).to.be.calledOn(pool);
					expect(unmutated.mutate).to.be.calledOnce;
					expect(unmutated.mutate).to.be.calledOn(unmutated);
					expect(unmutated.mutate).to.be.calledWith(
						pool.settings.mutationRate,
						pool.settings.mutationConcurrency
					);
					expect(result).to.equal(mutants);
				});
		});

		it('skips mutation if mutation rate is zero', function() {
			pool.settings.mutationRate = 0;

			return pool.getUnscoredOffspring()
				.then((result) => {
					expect(pool.getUnmutatedOffpsring).to.be.calledOnce;
					expect(pool.getUnmutatedOffpsring).to.be.calledOn(pool);
					expect(unmutated.mutate).to.not.be.called;
					expect(result).to.equal(unmutated);
				});
		});
	});

	describe('#getOffspring', function() {
		it('resolves with scored offpsring', function() {
			let foo = new TestIndividual('foo');
			let bar = new TestIndividual('bar');
			let pool = new GenePool(new Selector(), { fitnessConcurrency: 4 });
			let offspring = new Population([ foo, bar ]);
			sinon.stub(pool, 'getUnscoredOffspring').resolves(offspring);
			sinon.stub(offspring, 'setFitnesses').resolves();

			return pool.getOffspring()
				.then((result) => {
					expect(pool.getUnscoredOffspring).to.be.calledOnce;
					expect(pool.getUnscoredOffspring).to.be.calledOn(pool);
					expect(offspring.setFitnesses).to.be.calledOnce;
					expect(offspring.setFitnesses).to.be.calledOn(offspring);
					expect(offspring.setFitnesses).to.be.calledWith(
						pool.settings.fitnessConcurrency
					);
					expect(result).to.equal(offspring);

					// Test rejection to ensure we aren't resolving early.
					offspring.setFitnesses.rejects();
					return pool.getOffspring()
						.then(() => {
							throw new Error('Promise should have rejected');
						}, () => {});
				});
		});
	});
});
