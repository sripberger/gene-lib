const settingsUtils = require('../../lib/settings-utils');
const sinon = require('sinon');
const { defaultRegistry } = require('../../lib/selector-registry');
const TournamentSelector = require('../../lib/tournament-selector');
const TestSelector = require('../lib/test-selector');
const TestChromosome = require('../lib/test-chromosome');

describe('settingsUtils', function() {
	let sandbox;

	beforeEach(function() {
		sandbox = sinon.sandbox.create();
	});

	afterEach(function() {
		sandbox.restore();
		defaultRegistry.clear();
		delete TestSelector.async;
		delete TestChromosome.async;
	});

	describe('::normalizeSelector', function() {
		const FooSelector = () => {};

		beforeEach(function() {
			defaultRegistry.register('test', TestSelector);
		});

		it('replaces selector with selector class from default registry', function() {

			let result = settingsUtils.normalizeSelector({
				foo: 'bar',
				selector: 'test'
			});

			expect(result).to.deep.equal({
				foo: 'bar',
				selectorClass: TestSelector
			});
		});

		it('prioritizes explicit selector class', function() {
			let result = settingsUtils.normalizeSelector({
				foo: 'bar',
				selector: 'test',
				selectorClass: FooSelector
			});

			expect(result).to.deep.equal({
				foo: 'bar',
				selectorClass: FooSelector
			});
		});

		it('supports explicit selector class with no selector setting', function() {
			let result = settingsUtils.normalizeSelector({
				foo: 'bar',
				selectorClass: FooSelector
			});

			expect(result).to.deep.equal({
				foo: 'bar',
				selectorClass: FooSelector
			});
		});
	});

	describe('::getAsyncFromClasses', function() {
		it('returns async properties from selector and chromosome classes', function() {
			TestSelector.async = {
				add: 2,
				select: 3,
				create: 1,
				foo: 'bar'
			};
			TestChromosome.async = {
				create: 2,
				fitness: 3,
				crossover: 4,
				mutate: 5,
				add: 1,
				foo: 'bar'
			};

			let result = settingsUtils.getAsyncFromClasses({
				selectorClass: TestSelector,
				chromosomeClass: TestChromosome
			});

			expect(result).to.deep.equal({
				add: 2,
				select: 3,
				create: 2,
				fitness: 3,
				crossover: 4,
				mutate: 5
			});
		});

		it('works if async is only defined on selector class', function() {
			TestSelector.async = { add: 1 };

			let result = settingsUtils.getAsyncFromClasses({
				selectorClass: TestSelector
			});

			expect(result).to.deep.equal({ add: 1 });
		});

		it('works if async is only defined on chromosome class', function() {
			TestChromosome.async = { create: 1 };

			let result = settingsUtils.getAsyncFromClasses({
				chromosomeClass: TestChromosome
			});

			expect(result).to.deep.equal({ create: 1 });
		});

		it('returns null if async is defined on neither', function() {
			let result = settingsUtils.getAsyncFromClasses({
				selectorClass: TestSelector,
				chromosomeClass: TestChromosome
			});

			expect(result).to.be.null;
		});
	});

	describe('::normalizeAsync', function() {
		beforeEach(function() {
			sandbox.stub(settingsUtils, 'getAsyncFromClasses');
		});

		context('no async from classes', function() {
			beforeEach(function() {
				settingsUtils.getAsyncFromClasses.returns(null);
			});

			it('returns unchanged settings with async', function() {
				let result = settingsUtils.normalizeAsync({
					foo: 'bar',
					async: { baz: 'qux' }
				});

				expect(result).to.deep.equal({
					foo: 'bar',
					async: { baz: 'qux' }
				});
			});

			it('does not set async if there is none', function() {
				let result = settingsUtils.normalizeAsync({ foo: 'bar'});

				expect(result).to.deep.equal({ foo: 'bar' });
			});
		});

		context('async from classes', function() {
			beforeEach(function() {
				settingsUtils.getAsyncFromClasses.returns({ foo: 1, bar: 2 });
			});

			it('merges async from classes with async setting', function() {
				let result = settingsUtils.normalizeAsync({
					baz: 3,
					async: { foo: 4, qux: 5 }
				});

				expect(result).to.deep.equal({
					baz: 3,
					async: { foo: 4, bar: 2, qux: 5 }
				});
			});

			it('uses async from classes if there is no async setting', function() {
				let result = settingsUtils.normalizeAsync({ baz: 3 });

				expect(result).to.deep.equal({
					baz: 3,
					async: { foo: 1, bar: 2 }
				});
			});
		});
	});

	describe('::normalizeChromosome', function() {
		it('passes createChromosome through', function() {
			let createChromosome = () => {};

			let result = settingsUtils.normalizeChromosome({
				foo: 'bar',
				createChromosome
			});

			expect(result).to.deep.equal({ foo: 'bar', createChromosome });
		});

		it('replaces chromosomeClass with createChromosome', function() {
			let { create } = TestChromosome;
			let boundCreate = () => {};
			sandbox.stub(create, 'bind').returns(boundCreate);

			let result = settingsUtils.normalizeChromosome({
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
				selectorClass: TestSelector
			});

			expect(result).to.deep.equal({
				foo: 'bar',
				generationLimit: 10000,
				crossoverRate: 0.5,
				compoundCrossover: true,
				parentCount: 3,
				childCount: 5,
				mutationRate: 0.1,
				selectorClass: TestSelector
			});
		});
	});

	describe('::validate', function() {
		it('returns provided settings', function() {
			let settings = { foo: 'bar' };

			expect(settingsUtils.validate(settings)).to.equal(settings);
		});
	});

	describe('::normalize', function() {
		it('returns normalized settings object', function() {
			let settings = { foo: 'bar' };
			let selectorNormalized = { foo: 'selector normalized' };
			let asyncNormalized = { foo: 'async normalized' };
			let chromosomeNormalized = { foo: 'chromosome normalized' };
			let defaultsApplied = { foo: 'defaults applied' };
			sandbox.stub(settingsUtils, 'normalizeSelector').returns(
				selectorNormalized
			);
			sandbox.stub(settingsUtils, 'normalizeAsync').returns(
				asyncNormalized
			);
			sandbox.stub(settingsUtils, 'normalizeChromosome').returns(
				chromosomeNormalized
			);
			sandbox.stub(settingsUtils, 'applyDefaults').returns(
				defaultsApplied
			);
			sandbox.stub(settingsUtils, 'validate').returns(
				defaultsApplied
			);

			let result = settingsUtils.normalize(settings);

			expect(settingsUtils.normalizeSelector).to.be.calledOnce;
			expect(settingsUtils.normalizeSelector).to.be.calledOn(
				settingsUtils
			);
			expect(settingsUtils.normalizeSelector).to.be.calledWith(
				settings
			);
			expect(settingsUtils.normalizeAsync).to.be.calledOnce;
			expect(settingsUtils.normalizeAsync).to.be.calledOn(settingsUtils);
			expect(settingsUtils.normalizeAsync).to.be.calledWith(
				selectorNormalized
			);
			expect(settingsUtils.normalizeChromosome).to.be.caledOnce;
			expect(settingsUtils.normalizeChromosome).to.be.calledOn(
				settingsUtils
			);
			expect(settingsUtils.normalizeChromosome).to.be.calledWith(
				asyncNormalized
			);
			expect(settingsUtils.applyDefaults).to.be.calledOnce;
			expect(settingsUtils.applyDefaults).to.be.calledOn(settingsUtils);
			expect(settingsUtils.applyDefaults).to.be.calledWith(
				chromosomeNormalized
			);
			expect(settingsUtils.validate).to.be.calledOnce;
			expect(settingsUtils.validate).to.be.calledOn(settingsUtils);
			expect(settingsUtils.validate).to.be.calledWith(defaultsApplied);
			expect(result).to.equal(defaultsApplied);
		});
	});
});
