const utils = require('../../lib/utils');
const sinon = require('sinon');
const _ = require('lodash');
const Selector = require('../../lib/selector');
const TournamentSelector = require('../../lib/tournament-selector');
const Runner = require('../../lib/runner');
const TestIndividual = require('../lib/test-individual');

describe('utils', function() {
	let sandbox;

	beforeEach(function() {
		sandbox = sinon.sandbox.create();
	});

	afterEach(function() {
		sandbox.restore();
	});

	describe('::normalizeSettings', function() {
		it('passes through normal settings', function() {
			let settings = {
				generationSize: 50,
				generationLimit: 10000,
				crossoverRate: 0.5,
				compoundCrossover: true,
				mutationRate: 0.1,
				selectorClass: Selector,
				selectorSettings: { foo: 'bar' },
				createIndividual: () => {},
				createArg: 'create argument'
			};

			expect(utils.normalizeSettings(settings)).to.deep.equal(settings);
		});

		it('supports individualClass in place of createIndividual', function() {
			let settings = { individualClass: TestIndividual };
			let { create } = TestIndividual;
			let boundCreate = () => {};
			sandbox.stub(create, 'bind').returns(boundCreate);

			let result = utils.normalizeSettings(settings);

			expect(create.bind).to.be.calledOnce;
			expect(create.bind).to.be.calledOn(create);
			expect(create.bind).to.be.calledWithExactly(TestIndividual);
			expect(result.createIndividual).to.equal(boundCreate);
		});

		it('applies defaults for other settings', function() {
			expect(utils.normalizeSettings({})).to.deep.equal({
				generationSize: 100,
				generationLimit: 10000,
				crossoverRate: 0,
				compoundCrossover: false,
				mutationRate: 0,
				selectorClass: TournamentSelector,
				selectorSettings: {}
			});
		});
	});

	describe('::categorizeSettings', function() {
		it('categorizes provided settings for internal use', function() {
			let settings = {
				generationSize: 50,
				generationLimit: 10000,
				crossoverRate: 0.5,
				compoundCrossover: true,
				mutationRate: 0.1,
				selectorClass: Selector,
				selectorSettings: { foo: 'bar' },
				createIndividual: () => {},
				createArg: 'create argument'
			};

			expect(utils.categorizeSettings(settings)).to.deep.equal({
				runnerSettings: {
					generationSize: settings.generationSize,
					generationLimit: settings.generationLimit
				},
				generationSettings: {
					crossoverRate: settings.crossoverRate,
					compoundCrossover: settings.compoundCrossover,
					mutationRate: settings.mutationRate
				},
				selectorClass: settings.selectorClass,
				selectorSettings: settings.selectorSettings,
				createIndividual: settings.createIndividual,
				createArg: settings.createArg
			});
		});
	});

	describe('::transformSettings', function() {
		it('normalizes then categorizes settings', function() {
			let settings = { foo: 'bar' };
			let normalized = { foo: 'normalized' };
			let categorized = { foo: 'categorized' };
			sandbox.stub(utils, 'normalizeSettings').returns(normalized);
			sandbox.stub(utils, 'categorizeSettings').returns(categorized);

			let result = utils.transformSettings(settings);

			expect(utils.normalizeSettings).to.be.calledOnce;
			expect(utils.normalizeSettings).to.be.calledOn(utils);
			expect(utils.normalizeSettings).to.be.calledWith(settings);
			expect(utils.categorizeSettings).to.be.calledOnce;
			expect(utils.categorizeSettings).to.be.calledOn(utils);
			expect(utils.categorizeSettings).to.be.calledWith(normalized);
			expect(result).to.equal(categorized);
		});
	});

	describe('::run', function() {
		it('runs a genetic algorithm with the provided settings', function() {
			let settings = { foo: 'bar' };
			let transformedSettings = { baz: 'qux' };
			let runner = new Runner();
			let best = new TestIndividual('best');
			sandbox.stub(utils, 'transformSettings').returns(transformedSettings);
			sandbox.stub(Runner, 'create').returns(runner);
			sandbox.stub(runner, 'run');
			sandbox.stub(runner, 'getBest').returns(best);

			let result = utils.run(settings);

			expect(utils.transformSettings).to.be.calledOnce;
			expect(utils.transformSettings).to.be.calledOn(utils);
			expect(utils.transformSettings).to.be.calledWith(settings);
			expect(Runner.create).to.be.calledOnce;
			expect(Runner.create).to.be.calledOn(Runner);
			expect(Runner.create).to.be.calledWith(transformedSettings);
			expect(runner.run).to.be.calledOnce;
			expect(runner.run).to.be.calledOn(runner);
			expect(runner.getBest).to.be.calledOnce;
			expect(runner.getBest).to.be.calledOn(runner);
			expect(runner.getBest).to.be.calledAfter(runner.run);
			expect(result).to.equal(best);
		});
	});

	describe('::getCrossoverRange', function() {
		const length = 10;

		beforeEach(function() {
			sandbox.stub(_, 'random');
		});

		it('returns two random indices between 0 and length', function() {
			_.random
				.onFirstCall().returns(3)
				.onSecondCall().returns(7);

			let result = utils.getCrossoverRange(length);

			expect(_.random).to.be.calledTwice;
			expect(_.random).to.always.be.calledOn(_);
			expect(_.random).to.always.be.calledWithExactly(0, length);
			expect(result).to.deep.equal([ 3, 7 ]);
		});

		it('returns smaller of two results first', function() {
			_.random
				.onFirstCall().returns(7)
				.onSecondCall().returns(3);

			expect(utils.getCrossoverRange(length)).to.deep.equal([ 3, 7 ]);
		});
	});

	describe('::pmx', function() {
		it('performs a partially-mapped crossover', function() {
			let left = [ 1, 2, 3, 4, 5, 6, 7 ];
			let right = [ 5, 4, 6, 7, 2, 1, 3 ];
			sandbox.stub(utils, 'getCrossoverRange').returns([ 2, 6 ]);

			let result = utils.pmx(left, right);

			expect(utils.getCrossoverRange).to.be.calledOnce;
			expect(utils.getCrossoverRange).to.be.calledOn(utils);
			expect(utils.getCrossoverRange).to.be.calledWith(left.length);
			expect(result).to.deep.equal([
				[ 3, 5, 6, 7, 2, 1, 4 ],
				[ 2, 7, 3, 4, 5, 6, 1 ]
			]);
		});
	});
});
