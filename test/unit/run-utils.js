const utils = require('../../lib/run-utils');
const sinon = require('sinon');
const Selector = require('../../lib/selector');
const TournamentSelector = require('../../lib/tournament-selector');
const Runner = require('../../lib/runner');
const TestChromosome = require('../lib/test-chromosome');

describe.skip('runUtils', function() {
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
				createChromosome: () => {},
				createArg: 'create argument'
			};

			expect(utils.normalizeSettings(settings)).to.deep.equal(settings);
		});

		it('supports chromosomeClass in place of createChromosome', function() {
			let settings = { chromosomeClass: TestChromosome };
			let { create } = TestChromosome;
			let boundCreate = () => {};
			sandbox.stub(create, 'bind').returns(boundCreate);

			let result = utils.normalizeSettings(settings);

			expect(create.bind).to.be.calledOnce;
			expect(create.bind).to.be.calledOn(create);
			expect(create.bind).to.be.calledWithExactly(TestChromosome);
			expect(result.createChromosome).to.equal(boundCreate);
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
				createChromosome: () => {},
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
				createChromosome: settings.createChromosome,
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
			let best = new TestChromosome('best');
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
});
