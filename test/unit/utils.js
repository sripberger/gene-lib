const utils = require('../../lib/utils');
const sinon = require('sinon');
const Selector = require('../../lib/selector');
const TournamentSelector = require('../../lib/tournament-selector');
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
				createIndividual: () => {}
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
				createIndividual: () => {}
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
				createIndividual: settings.createIndividual
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
});
