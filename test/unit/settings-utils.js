const settingsUtils = require('../../lib/settings-utils');
const sinon = require('sinon');
const RouletteSelector = require('../../lib/roulette-selector');
const TournamentSelector = require('../../lib/tournament-selector');
const TestChromosome = require('../lib/test-chromosome');

describe('settingsUtils', function() {
	let sandbox;

	beforeEach(function() {
		sandbox = sinon.sandbox.create();
	});

	afterEach(function() {
		sandbox.restore();
	});

	describe('::normalize', function() {
		it('passes createChromosome through', function() {
			let createChromosome = () => {};

			let result = settingsUtils.normalize({
				foo: 'bar',
				createChromosome
			});

			expect(result).to.deep.equal({ foo: 'bar', createChromosome });
		});

		it('replaces chromosomeClass with createChromosome', function() {
			let { create } = TestChromosome;
			let boundCreate = () => {};
			sandbox.stub(create, 'bind').returns(boundCreate);

			let result = settingsUtils.normalize({
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

	describe('::applyDefaults', function() {
		it('applies default settings', function() {
			let result = settingsUtils.applyDefaults({ foo: 'bar' });

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
			let result = settingsUtils.applyDefaults({
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

	describe('::validate', function() {
		it('returns provided settings', function() {
			let settings = { foo: 'bar' };

			expect(settingsUtils.validate(settings)).to.equal(settings);
		});
	});

	describe('::process', function() {
		it('normalizes, applies defaults, then validates', function() {
			let settings = { foo: 'bar' };
			let normalized = { foo: 'normalized' };
			let applied = { foo: 'normalized', baz: 'qux' };
			sandbox.stub(settingsUtils, 'normalize').returns(normalized);
			sandbox.stub(settingsUtils, 'applyDefaults').returns(applied);
			sandbox.stub(settingsUtils, 'validate').returns(applied);

			let result = settingsUtils.process(settings);

			expect(settingsUtils.normalize).to.be.calledOnce;
			expect(settingsUtils.normalize).to.be.calledOn(settingsUtils);
			expect(settingsUtils.normalize).to.be.calledWith(settings);
			expect(settingsUtils.applyDefaults).to.be.calledOnce;
			expect(settingsUtils.applyDefaults).to.be.calledOn(settingsUtils);
			expect(settingsUtils.applyDefaults).to.be.calledWith(normalized);
			expect(settingsUtils.validate).to.be.calledOnce;
			expect(settingsUtils.validate).to.be.calledOn(settingsUtils);
			expect(settingsUtils.validate).to.be.calledWith(applied);
			expect(result).to.equal(applied);
		});
	});
});
