const GenePool = require('../../lib/gene-pool');
const sinon = require('sinon');
const _ = require('lodash');
const pasync = require('pasync');
const XError = require('xerror');
const BreedingScheme = require('../../lib/breeding-scheme');
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

	it('stores provided selector, litter counts, and settings object', function() {
		let crossoverCount = 10;
		let copyCount = 50;
		let selector = new Selector();
		let settings = { foo: 'bar' };

		let pool = new GenePool(selector, crossoverCount, copyCount, settings);

		expect(pool.selector).to.equal(selector);
		expect(pool.crossoverCount).to.equal(crossoverCount);
		expect(pool.copyCount).to.equal(copyCount);
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
		let settings;

		beforeEach(function() {
			settings = {
				generationSize: 10,
				childCount: 2,
				crossoverRate: 0.2
			};

			sandbox.stub(GenePool, 'getMaxCrossoverCount').returns(5);
			sandbox.stub(utils, 'boolChance');
		});

		it('returns crossover and copy counts created using utils::boolChance', function() {
			utils.boolChance.returns(false)
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

		it('supports compoundCrossover setting', function() {
			settings.compoundCrossover = true;

			let result = GenePool.getLitterCounts(settings);

			expect(utils.boolChance).to.not.be.called;
			expect(result).to.deep.equal({
				crossoverCount: 5,
				copyCount: 0
			});
		});
	});

	describe('::create', function() {
		it('creates selector and calculates litter counts for a new instance', function() {
			let selectorSettings = { foo: 'bar' };
			let settings = {
				selectorClass: TestSelector,
				selectorSettings
			};
			sandbox.stub(GenePool, 'getLitterCounts').returns({
				crossoverCount: 4,
				copyCount: 16
			});
			let result = GenePool.create(settings);


			expect(GenePool.getLitterCounts).to.be.calledOnce;
			expect(GenePool.getLitterCounts).to.be.calledOn(GenePool);
			expect(GenePool.getLitterCounts).to.be.calledWith(settings);
			expect(result).to.be.an.instanceof(GenePool);
			expect(result.selector).to.be.an.instanceof(TestSelector);
			expect(result.selector.settings).to.equal(selectorSettings);
			expect(result.crossoverCount).to.equal(4);
			expect(result.copyCount).to.equal(16);
			expect(result.settings).to.equal(settings);
		});
	});

	describe('::fromPopulation', function() {
		let settings, population, pool;

		beforeEach(function() {
			settings = {};
			population = new Population([], settings);
			pool = new GenePool();
			sandbox.stub(GenePool, 'fromPopulationSync').returns(pool);
			sandbox.stub(GenePool, 'fromPopulationAsync').resolves(pool);
		});

		context('settings.async is not set', function() {
			it('returns result of ::fromPopulationSync', function() {
				let result = GenePool.fromPopulation(population);

				expect(GenePool.fromPopulationSync).to.be.calledOnce;
				expect(GenePool.fromPopulationSync).to.be.calledOn(GenePool);
				expect(GenePool.fromPopulationSync).to.be.calledWith(population);
				expect(result).to.equal(pool);
			});
		});

		context('settings.async.add is not set', function() {
			it('returns result of ::fromPopulationSync', function() {
				settings.async = {};

				let result = GenePool.fromPopulation(population);

				expect(GenePool.fromPopulationSync).to.be.calledOnce;
				expect(GenePool.fromPopulationSync).to.be.calledOn(GenePool);
				expect(GenePool.fromPopulationSync).to.be.calledWith(population);
				expect(result).to.equal(pool);
			});
		});

		context('settings.async.add is set', function() {
			it('resolves with result of ::fromPopulationSync', function() {
				settings.async = { add: 1 };

				return GenePool.fromPopulation(population)
					.then((result) => {
						expect(GenePool.fromPopulationAsync).to.be.calledOnce;
						expect(GenePool.fromPopulationAsync).to.be.calledOn(
							GenePool
						);
						expect(GenePool.fromPopulationAsync).to.be.calledWith(
							population
						);
						expect(result).to.equal(pool);
					});
			});
		});
	});

	describe('::fromPopulationSync', function() {
		it('creates a GenePool and adds individuals to selector', function() {
			let foo = new TestIndividual('foo');
			let bar = new TestIndividual('bar');
			let population = new Population([ foo, bar ], { baz: 'qux' });
			let selector = new Selector();
			let pool = new GenePool(selector);
			sandbox.stub(GenePool, 'create').returns(pool);
			sinon.stub(selector, 'add');

			let result = GenePool.fromPopulationSync(population);

			expect(GenePool.create).to.be.calledOnce;
			expect(GenePool.create).to.be.calledOn(GenePool);
			expect(GenePool.create).to.be.calledWith(population.settings);
			expect(selector.add).to.be.calledTwice;
			expect(selector.add).to.always.be.calledOn(selector);
			expect(selector.add).to.be.calledWith(foo);
			expect(selector.add).to.be.calledWith(bar);
			expect(result).to.equal(pool);
		});
	});

	describe('::fromPopulationAsync', function() {
		let population, selector, pool;

		beforeEach(function() {
			let foo = new TestIndividual('foo');
			let bar = new TestIndividual('bar');

			population = new Population([ foo, bar ], { async: { add: 1 } });
			selector = new Selector();
			pool = new GenePool(selector);

			sandbox.stub(GenePool, 'create').returns(pool);
			sandbox.stub(pasync, 'eachLimit').resolves();
		});

		it('creates a GenePool and iterates indivduals with pasync::eachLimit', function() {
			return GenePool.fromPopulationAsync(population)
				.then((result) => {
					expect(GenePool.create).to.be.calledOnce;
					expect(GenePool.create).to.be.calledOn(GenePool);
					expect(GenePool.create).to.be.calledWith(
						population.settings
					);
					expect(pasync.eachLimit).to.be.calledOnce;
					expect(pasync.eachLimit).to.be.calledOn(pasync);
					expect(pasync.eachLimit).to.be.calledWith(
						population.individuals,
						population.settings.async.add,
						sinon.match.func
					);
					expect(result).to.equal(pool);
				})
				.then(() => {
					// Test rejection to ensure we aren't resolving early.
					pasync.eachLimit.rejects();
					return GenePool.fromPopulationAsync(population)
						.then(() => {
							throw new Error('Promise should have rejected.');
						}, () => {});
				});
		});

		describe('iteratee', function() {
			let iteratee;

			beforeEach(function() {
				return GenePool.fromPopulationAsync(population)
					.then(() => {
						iteratee = pasync.eachLimit.firstCall.args[2];
					});
			});

			it('resolves with result of selector#add', function() {
				let [ foo ] = population.individuals;
				sinon.stub(selector, 'add').resolves();

				return iteratee(foo)
					.then(() => {
						expect(selector.add).to.be.calledOnce;
						expect(selector.add).to.be.calledOn(selector);
						expect(selector.add).to.be.calledWith(foo);
					}).then(() => {
						// Test rejection to ensure we aren't resolving early.
						selector.add.rejects();
						return iteratee(foo)
							.then(() => {
								throw new Error('Promise should have rejected.');
							}, () => {});
					});
			});
		});
	});

	describe('#getSelectionCount', function() {
		it('returns total number of individuals to be selected', function() {
			let selector = new Selector();
			let pool = new GenePool(selector, 10, 40, {
				parentCount: 2,
				childCount: 2,
			});
			let otherScheme = new GenePool(selector, 4, 16, {
				parentCount: 3,
				childCount: 5,
			});

			expect(pool.getSelectionCount()).to.equal(100);
			expect(otherScheme.getSelectionCount()).to.equal(92);
		});
	});

	describe('#performSelections', function() {
		let pool, scheme;

		beforeEach(function() {
			pool = new GenePool();
			scheme = new BreedingScheme();

			sinon.stub(pool, 'performSelectionsSync').returns(scheme);
			sinon.stub(pool, 'performSelectionsAsync').resolves(scheme);
		});

		context('settings.async is not set', function() {
			it('returns result of ::fromPopulationSync', function() {
				let result = pool.performSelections();

				expect(pool.performSelectionsSync).to.be.calledOnce;
				expect(pool.performSelectionsSync).to.be.calledOn(pool);
				expect(result).to.equal(scheme);
			});
		});

		context('settings.async.select is not set', function() {
			it('returns result of ::fromPopulationSync', function() {
				pool.settings.async = {};

				let result = pool.performSelections();

				expect(pool.performSelectionsSync).to.be.calledOnce;
				expect(pool.performSelectionsSync).to.be.calledOn(pool);
				expect(result).to.equal(scheme);
			});
		});

		context('settings.async.select is set', function() {
			it('resolves with result of ::fromPopulationSync', function() {
				pool.settings.async = { select: 1 };

				return pool.performSelections()
					.then((result) => {
						expect(pool.performSelectionsAsync).to.be.calledOnce;
						expect(pool.performSelectionsAsync).to.be.calledOn(pool);
						expect(result).to.equal(scheme);
					});
			});
		});
	});

	describe('#performSelectionsSync', function() {
		it('returns breeding scheme from selection results', function() {
			let selector = new Selector();
			let pool = new GenePool(selector, 2, 1, {
				parentCount: 2,
				childCount: 3
			});
			let individuals = _.times(6, (i) => new TestIndividual(i));
			sinon.stub(pool, 'getSelectionCount').returns(7);
			sinon.stub(selector, 'select')
				.onCall(0).returns(individuals[0])
				.onCall(1).returns(individuals[1])
				.onCall(2).returns(individuals[2])
				.onCall(3).returns(individuals[3])
				.onCall(4).returns(individuals[4])
				.onCall(5).returns(individuals[5])
				.onCall(6).returns(individuals[6]);

			let result = pool.performSelectionsSync();

			expect(pool.getSelectionCount).to.be.calledOnce;
			expect(pool.getSelectionCount).to.be.calledOn(pool);
			expect(selector.select).to.have.callCount(7);
			expect(selector.select).to.always.be.calledOn(selector);
			expect(result).to.be.an.instanceof(BreedingScheme);
			expect(result.crossovers).to.deep.equal([
				[ individuals[0], individuals[1] ],
				[ individuals[2], individuals[3] ]
			]);
			expect(result.copies).to.deep.equal([
				individuals[4],
				individuals[5],
				individuals[6]
			]);
			expect(result.settings).to.equal(pool.settings);
		});
	});

	describe('#performSelectionsAsync', function() {
		let selector, pool, individuals;

		beforeEach(function() {
			selector = new Selector();
			pool = new GenePool(selector, 2, 1, {
				parentCount: 2,
				childCount: 3,
				async: { select: 4 }
			});
			individuals = _.times(7, (i) => new TestIndividual(i));

			sinon.stub(pool, 'getSelectionCount').returns(7);
			sandbox.stub(pasync, 'timesLimit').resolves(individuals);
		});

		it('resolves with breeding scheme from pasync::timesLimit results', function() {
			return pool.performSelectionsAsync()
				.then((result) => {
					expect(pool.getSelectionCount).to.be.calledOnce;
					expect(pool.getSelectionCount).to.be.calledOn(pool);
					expect(pasync.timesLimit).to.be.calledOnce;
					expect(pasync.timesLimit).to.be.calledOn(pasync);
					expect(pasync.timesLimit).to.be.calledWith(
						7,
						pool.settings.async.select,
						sinon.match.func
					);
					expect(result).to.be.an.instanceof(BreedingScheme);
					expect(result.crossovers).to.deep.equal([
						[ individuals[0], individuals[1] ],
						[ individuals[2], individuals[3] ]
					]);
					expect(result.copies).to.deep.equal([
						individuals[4],
						individuals[5],
						individuals[6]
					]);
					expect(result.settings).to.equal(pool.settings);
				});
		});

		describe('iteratee', function() {
			let iteratee;

			beforeEach(function() {
				return pool.performSelectionsAsync()
					.then(() => {
						iteratee = pasync.timesLimit.firstCall.args[2];
					});
			});

			it('resolves with result of selector#select', function() {
				let [ individual ] = individuals;
				sinon.stub(selector, 'select').resolves(individual);

				return iteratee()
					.then((result) => {
						expect(selector.select).to.be.calledOnce;
						expect(selector.select).to.be.calledOn(selector);
						expect(result).to.equal(individual);
					});
			});
		});
	});
});
