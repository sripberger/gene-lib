const runUtils = require('../../lib/run-utils');
const sinon = require('sinon');
const RouletteSelector = require('../../lib/roulette-selector');
const Runner = require('../../lib/runner');
const TournamentSelector = require('../../lib/tournament-selector');
const TestChromosome = require('../lib/test-chromosome');
const TestIndividual = require('../lib/test-individual');

describe.skip('runUtils', function() {
	let sandbox;

	beforeEach(function() {
		sandbox = sinon.sandbox.create();
	});

	afterEach(function() {
		sandbox.restore();
	});

	describe('::normalizeSettings', function() {
		it('passes createChromosome through', function() {
			let createChromosome = () => {};

			let result = runUtils.normalizeSettings({
				foo: 'bar',
				createChromosome
			});

			expect(result).to.deep.equal({ foo: 'bar', createChromosome });
		});

		it('replaces chromosomeClass with createChromosome', function() {
			let { create } = TestChromosome;
			let boundCreate = () => {};
			sandbox.stub(create, 'bind').returns(boundCreate);

			let result = runUtils.normalizeSettings({
				foo: 'bar',
				chromosomeClass: TestChromosome
			});

			expect(create.bind).to.be.calledOnce;
			expect(create.bind).to.be.calledOn(create);
			expect(create.bind).to.be.calledWithExactly(TestChromosome);
			expect(result).to.deep.equal({
				foo: 'bar',
				createChromosome: boundCreate,
			});
		});
	});

	describe('::applyDefaultSettings', function() {
		it('applies default settings', function() {
			let result = runUtils.applyDefaultSettings({ foo: 'bar' });

			expect(result).to.deep.equal({
				foo: 'bar',
				generationLimit: Infinity,
				crossoverRate: 0,
				compoundCrossover: false,
				parentCount: 2,
				childCount: 2,
				mutationRate: 0,
				selectorClass: TournamentSelector
			});
		});

		it('passes through settings with values', function() {
			let result = runUtils.applyDefaultSettings({
				foo: 'bar',
				generationLimit: 10000,
				crossoverRate: 0.5,
				compoundCrossover: true,
				parentCount: 3,
				childCount: 5,
				mutationRate: 0.1,
				selectorClass: RouletteSelector
			});

			expect(result).to.deep.equal({
				foo: 'bar',
				generationLimit: 10000,
				crossoverRate: 0.5,
				compoundCrossover: true,
				parentCount: 3,
				childCount: 5,
				mutationRate: 0.1,
				selectorClass: RouletteSelector
			});

			expect(result.foo).to.equal('bar');
			expect(result.generationLimit).to.equal(10000);
			expect(result.crossoverRate).to.equal(0.5);
			expect(result.compoundCrossover).to.be.true;
			expect(result.parentCount).to.equal(3);
			expect(result.childCount).to.equal(5);
			expect(result.mutationRate).to.equal(0.1);
		});
	});

	describe.skip('::validateSettings', function() {
		it('validates settings', function() {
			// TODO
		});
	});

	describe('::processSettings', function() {
		it('normalizes, applies defaults, then validates', function() {
			let settings = { foo: 'bar' };
			let normalized = { foo: 'normalized' };
			let applied = { foo: 'normalized', baz: 'qux' };
			sandbox.stub(runUtils, 'normalizeSettings').returns(normalized);
			sandbox.stub(runUtils, 'applyDefaultSettings').returns(applied);
			sandbox.stub(runUtils, 'validateSettings');

			let result = runUtils.processSettings(settings);

			expect(runUtils.normalizeSettings).to.be.calledOnce;
			expect(runUtils.normalizeSettings).to.be.calledOn(runUtils);
			expect(runUtils.normalizeSettings).to.be.calledWith(settings);
			expect(runUtils.applyDefaultSettings).to.be.calledOnce;
			expect(runUtils.applyDefaultSettings).to.be.calledOn(runUtils);
			expect(runUtils.applyDefaultSettings).to.be.calledWith(normalized);
			expect(runUtils.validateSettings).to.be.calledOnce;
			expect(runUtils.validateSettings).to.be.calledOn(runUtils);
			expect(runUtils.validateSettings).to.be.calledWith(applied);
			expect(result).to.equal(applied);
		});
	});

	describe('::run', function() {
		it('runs a genetic algorithm with the provided settings', function() {
			let settings = { foo: 'bar' };
			let processedSettings = { baz: 'qux' };
			let runner = new Runner();
			let best = new TestIndividual('best');
			sandbox.stub(runUtils, 'processSettings').returns(processedSettings);
			sandbox.stub(Runner, 'create').resolves(runner);
			sandbox.stub(runner, 'run').resolves(best);

			return runUtils.run(settings)
				.then((result) => {
					expect(runUtils.processSettings).to.be.calledOnce;
					expect(runUtils.processSettings).to.be.calledOn(runUtils);
					expect(runUtils.processSettings).to.be.calledWith(settings);
					expect(Runner.create).to.be.calledOnce;
					expect(Runner.create).to.be.calledOn(Runner);
					expect(Runner.create).to.be.calledWith(processedSettings);
					expect(runner.run).to.be.calledOnce;
					expect(runner.run).to.be.calledOn(runner);
					expect(result).to.equal(best.chromosome);
				});
		});
	});
});
