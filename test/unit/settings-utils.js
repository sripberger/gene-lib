const _ = require('lodash');
const settingsUtils = require('../../lib/settings-utils');
const XError = require('xerror');
const { defaultRegistry } = require('../../lib/selector-registry');
const TestSelector = require('../lib/test-selector');
const TestChromosome = require('../lib/test-chromosome');

describe('settingsUtils', function() {
	afterEach(function() {
		defaultRegistry.clear();
		delete TestSelector.async;
		delete TestSelector.settings;
		delete TestChromosome.async;
		delete TestChromosome.settings;
	});

	describe('::addDefaultSelector', function() {
		it('adds default tournament selector with _::defaults', function() {
			let settings = { foo: 'bar' };
			sandbox.stub(_, 'defaults').returnsArg(0);

			let result = settingsUtils.addDefaultSelector(settings);

			expect(_.defaults).to.be.calledOnce;
			expect(_.defaults).to.be.calledWith(
				{},
				settings,
				{ selector: 'tournament' }
			);
			expect(result).to.equal(_.defaults.firstCall.returnValue);
		});
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
	});

	describe('::getSelectorClassSettings', function() {
		it('picks selector-specific settings from selectorClass', function() {
			expect(settingsUtils.getSelectorClassSettings({
				selectorClass: {
					settings: {
						foo: 42,
						selectorSettings: { bar: 'baz' },
						async: {
							add: 1,
							select: 2,
							qux: 3
						}
					}
				}
			})).to.deep.equal({
				selectorSettings: { bar: 'baz' },
				async: {
					add: 1,
					select: 2
				}
			});
		});

		it('returns empty object if selectorClass has no settings', function() {
			expect(settingsUtils.getSelectorClassSettings({
				selectorClass: {}
			})).to.deep.equal({});
		});
	});

	describe('::getChromosomeClassSettings', function() {
		it('picks chromosome-specific settings from chromosomeClass', function() {
			expect(settingsUtils.getChromosomeClassSettings({
				chromosomeClass: {
					settings: {
						foo: 42,
						solutionFitness: 100,
						crossoverRate: 0.7,
						manualCrossoverCheck: true,
						parentCount: 3,
						childCount: 1,
						mutationRate: 0.01,
						async: {
							create: 1,
							getFitness: 2,
							crossover: 3,
							mutate: 4,
							bar: 5
						}
					}
				}
			})).to.deep.equal({
				solutionFitness: 100,
				crossoverRate: 0.7,
				manualCrossoverCheck: true,
				parentCount: 3,
				childCount: 1,
				mutationRate: 0.01,
				async: {
					create: 1,
					getFitness: 2,
					crossover: 3,
					mutate: 4
				}
			});
		});

		it('returns empty object if chromosomeClass has no settings', function() {
			expect(settingsUtils.getChromosomeClassSettings({
				chromosomeClass: {}
			})).to.deep.equal({});
		});

		it('returns empty object if there is no chromosomeClass', function() {
			expect(settingsUtils.getChromosomeClassSettings({}))
				.to.deep.equal({});
		});
	});

	describe('::applyDefaults', function() {
		it('applys defaults using _::defaultsDeep', function() {
			let settings = { foo: 'bar' };
			let selectorClassSettings = { bar: 'baz' };
			let chromosomeClassSettings = { baz: 'qux' };
			sandbox.stub(settingsUtils, 'getSelectorClassSettings')
				.returns(selectorClassSettings);
			sandbox.stub(settingsUtils, 'getChromosomeClassSettings')
				.returns(chromosomeClassSettings);
			sandbox.stub(_, 'defaultsDeep').returnsArg(0);

			let result = settingsUtils.applyDefaults(settings);

			expect(settingsUtils.getSelectorClassSettings).to.be.calledOnce;
			expect(settingsUtils.getSelectorClassSettings).to.be.calledOn(
				settingsUtils
			);
			expect(settingsUtils.getSelectorClassSettings).to.be.calledWith(
				settings
			);
			expect(settingsUtils.getChromosomeClassSettings).to.be.calledOnce;
			expect(settingsUtils.getChromosomeClassSettings).to.be.calledOn(
				settingsUtils
			);
			expect(settingsUtils.getChromosomeClassSettings).to.be.calledWith(
				settings
			);
			expect(_.defaultsDeep).to.be.calledOnce;
			expect(_.defaultsDeep).to.be.calledOn(_);
			expect(_.defaultsDeep).to.be.calledWith(
				{},
				settings,
				selectorClassSettings,
				chromosomeClassSettings,
				{
					generationLimit: Infinity,
					solutionFitness: Infinity,
					crossoverRate: 0,
					manualCrossoverCheck: false,
					parentCount: 2,
					childCount: 2,
					mutationRate: 0,
					selector: 'tournament',
					selectorSettings: {}
				}
			);
			expect(result).to.equal(_.defaultsDeep.firstCall.returnValue);
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
				getFitness: 3,
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
				getFitness: 3,
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
				let result = settingsUtils.normalizeAsync({ foo: 'bar' });

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
		it('passes createChromosome and createArgs through', function() {
			let createChromosome = () => {};
			let createArgs = [ 'baz', 'qux' ];

			let result = settingsUtils.normalizeChromosome({
				foo: 'bar',
				createChromosome,
				createArgs
			});

			expect(result).to.deep.equal({
				foo: 'bar',
				createChromosome,
				createArgs
			});
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

		it('replaces createArg with single-element createArgs', function() {
			let result = settingsUtils.normalizeChromosome({
				foo: 'bar',
				createArg: 'baz'
			});

			expect(result).to.deep.equal({
				foo: 'bar',
				createArgs: [ 'baz' ]
			});
		});
	});

	describe('::validate', function() {
		let settings;

		beforeEach(function() {
			settings = {
				createChromosome: () => {},
				selectorClass: () => {},
				generationSize: 10000,
				generationLimit: 1000,
				solutionFitness: 100,
				crossoverRate: 0.8,
				parentCount: 4,
				childCount: 2,
				mutationRate: 0.1
			};
		});

		it('returns valid settings', function() {
			expect(settingsUtils.validate(settings)).to.equal(settings);
		});

		it('throws invalid argument if createChromosome is missing', function() {
			delete settings.createChromosome;

			expect(() => settingsUtils.validate(settings))
				.to.throw(XError).that.satisfies((err) => {
					expect(err.code).to.equal(XError.INVALID_ARGUMENT);
					expect(err.message).to.equal(
						'Either chromosomeClass or ' +
						'createChromosome is required.'
					);
					return true;
				});
		});

		it('throws invalid argument if createChromosome is not a function', function() {
			settings.createChromosome = {};

			expect(() => settingsUtils.validate(settings))
				.to.throw(XError).that.satisfies((err) => {
					expect(err.code).to.equal(XError.INVALID_ARGUMENT);
					expect(err.message).to.equal(
						'createChromosome must be a function.'
					);
					return true;
				});
		});

		it('throws invalid argument if selectorClass is not a function', function() {
			settings.selectorClass = {};

			expect(() => settingsUtils.validate(settings))
				.to.throw(XError).that.satisfies((err) => {
					expect(err.code).to.equal(XError.INVALID_ARGUMENT);
					expect(err.message).to.equal(
						'selectorClass must be a constructor.'
					);
					return true;
				});
		});

		it('throws invalid argument if generationSize is missing', function() {
			delete settings.generationSize;

			expect(() => settingsUtils.validate(settings))
				.to.throw(XError).that.satisfies((err) => {
					expect(err.code).to.equal(XError.INVALID_ARGUMENT);
					expect(err.message).to.equal('generationSize is required.');
					return true;
				});
		});

		it('throws invalid argument if generationSize is zero', function() {
			settings.generationSize = 0;

			expect(() => settingsUtils.validate(settings))
				.to.throw(XError).that.satisfies((err) => {
					expect(err.code).to.equal(XError.INVALID_ARGUMENT);
					expect(err.message).to.equal(
						'generationSize must be a positive integer.'
					);
					return true;
				});
		});

		it('throws invalid argument if generationSize is negative', function() {
			settings.generationSize = -1;

			expect(() => settingsUtils.validate(settings))
				.to.throw(XError).that.satisfies((err) => {
					expect(err.code).to.equal(XError.INVALID_ARGUMENT);
					expect(err.message).to.equal(
						'generationSize must be a positive integer.'
					);
					return true;
				});
		});

		it('throws invalid argument if generationSize is a float', function() {
			settings.generationSize = 1.5;

			expect(() => settingsUtils.validate(settings))
				.to.throw(XError).that.satisfies((err) => {
					expect(err.code).to.equal(XError.INVALID_ARGUMENT);
					expect(err.message).to.equal(
						'generationSize must be a positive integer.'
					);
					return true;
				});
		});

		it('throws invalid argument if generationLimit is not a number', function() {
			settings.generationLimit = {};

			expect(() => settingsUtils.validate(settings))
				.to.throw(XError).that.satisfies((err) => {
					expect(err.code).to.equal(XError.INVALID_ARGUMENT);
					expect(err.message).to.equal(
						'generationLimit must be a number.'
					);
					return true;
				});
		});

		it('throws invalid argument if solutionFitness is not a number', function() {
			settings.solutionFitness = {};

			expect(() => settingsUtils.validate(settings))
				.to.throw(XError).that.satisfies((err) => {
					expect(err.code).to.equal(XError.INVALID_ARGUMENT);
					expect(err.message).to.equal(
						'solutionFitness must be a number.'
					);
					return true;
				});
		});

		it('throws invalid argument if crossoverRate is not a number', function() {
			settings.crossoverRate = {};

			expect(() => settingsUtils.validate(settings))
				.to.throw(XError).that.satisfies((err) => {
					expect(err.code).to.equal(XError.INVALID_ARGUMENT);
					expect(err.message).to.equal(
						'crossoverRate must be a number.'
					);
					return true;
				});
		});

		it('throws invalid argument if parentCount is less than two', function() {
			settings.parentCount = 1;

			expect(() => settingsUtils.validate(settings))
				.to.throw(XError).that.satisfies((err) => {
					expect(err.code).to.equal(XError.INVALID_ARGUMENT);
					expect(err.message).to.equal(
						'parentCount must be an integer greater than 1.'
					);
					return true;
				});
		});

		it('throws invalid argument if parentCount is a float', function() {
			settings.parentCount = 2.5;

			expect(() => settingsUtils.validate(settings))
				.to.throw(XError).that.satisfies((err) => {
					expect(err.code).to.equal(XError.INVALID_ARGUMENT);
					expect(err.message).to.equal(
						'parentCount must be an integer greater than 1.'
					);
					return true;
				});
		});

		it('throws invalid argument if childCount is zero', function() {
			settings.childCount = 0;

			expect(() => settingsUtils.validate(settings))
				.to.throw(XError).that.satisfies((err) => {
					expect(err.code).to.equal(XError.INVALID_ARGUMENT);
					expect(err.message).to.equal(
						'childCount must be a positive integer.'
					);
					return true;
				});
		});

		it('throws invalid argument if childCount is negative', function() {
			settings.childCount = -1;

			expect(() => settingsUtils.validate(settings))
				.to.throw(XError).that.satisfies((err) => {
					expect(err.code).to.equal(XError.INVALID_ARGUMENT);
					expect(err.message).to.equal(
						'childCount must be a positive integer.'
					);
					return true;
				});
		});

		it('throws invalid argument if childCount is a float', function() {
			settings.childCount = 1.5;

			expect(() => settingsUtils.validate(settings))
				.to.throw(XError).that.satisfies((err) => {
					expect(err.code).to.equal(XError.INVALID_ARGUMENT);
					expect(err.message).to.equal(
						'childCount must be a positive integer.'
					);
					return true;
				});
		});

		it('throws invalid argument if generationSize is not a multiple of childCount', function() {
			settings.childCount = 3;

			expect(() => settingsUtils.validate(settings))
				.to.throw(XError).that.satisfies((err) => {
					expect(err.code).to.equal(XError.INVALID_ARGUMENT);
					expect(err.message).to.equal(
						'generationSize must be a multiple of childCount.'
					);
					return true;
				});
		});

		it('throws invalid argument if mutationRate is not a number', function() {
			settings.mutationRate = {};

			expect(() => settingsUtils.validate(settings))
				.to.throw(XError).that.satisfies((err) => {
					expect(err.code).to.equal(XError.INVALID_ARGUMENT);
					expect(err.message).to.equal(
						'mutationRate must be a number.'
					);
					return true;
				});
		});
	});

	describe('::normalize', function() {
		it('returns normalized settings object', function() {
			let settings = { foo: 'original' };
			let defaultSelectorAdded = { foo: 'default selector added' };
			let selectorNormalized = { foo: 'selector normalized' };
			let defaultsApplied = { foo: 'defaults applied' };
			let chromosomeNormalized = { foo: 'chromosome normalized' };
			sandbox.stub(settingsUtils, 'addDefaultSelector').returns(
				defaultSelectorAdded
			);
			sandbox.stub(settingsUtils, 'normalizeSelector').returns(
				selectorNormalized
			);
			sandbox.stub(settingsUtils, 'applyDefaults').returns(
				defaultsApplied
			);
			sandbox.stub(settingsUtils, 'normalizeChromosome').returns(
				chromosomeNormalized
			);
			sandbox.stub(settingsUtils, 'validate').returnsArg(0);

			let result = settingsUtils.normalize(settings);

			expect(settingsUtils.addDefaultSelector).to.be.calledOnce;
			expect(settingsUtils.addDefaultSelector).to.be.calledOn(
				settingsUtils
			);
			expect(settingsUtils.addDefaultSelector).to.be.calledWith(
				settings
			);
			expect(settingsUtils.normalizeSelector).to.be.calledOnce;
			expect(settingsUtils.normalizeSelector).to.be.calledOn(
				settingsUtils
			);
			expect(settingsUtils.normalizeSelector).to.be.calledWith(
				defaultSelectorAdded
			);
			expect(settingsUtils.applyDefaults).to.be.calledOnce;
			expect(settingsUtils.applyDefaults).to.be.calledOn(settingsUtils);
			expect(settingsUtils.applyDefaults).to.be.calledWith(
				selectorNormalized
			);
			expect(settingsUtils.normalizeChromosome).to.be.caledOnce;
			expect(settingsUtils.normalizeChromosome).to.be.calledOn(
				settingsUtils
			);
			expect(settingsUtils.normalizeChromosome).to.be.calledWith(
				defaultsApplied
			);
			expect(settingsUtils.validate).to.be.calledOnce;
			expect(settingsUtils.validate).to.be.calledOn(settingsUtils);
			expect(settingsUtils.validate).to.be.calledWith(
				chromosomeNormalized
			);
			expect(result).to.equal(chromosomeNormalized);
		});
	});
});
