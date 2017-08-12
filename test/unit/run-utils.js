const runUtils = require('../../lib/run-utils');
const sinon = require('sinon');
const Selector = require('../../lib/selector');
const TournamentSelector = require('../../lib/tournament-selector');
const Runner = require('../../lib/runner');
const TestChromosome = require('../lib/test-chromosome');
const TestIndividual = require('../lib/test-individual');

describe('runUtils', function() {
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
				parentCount: 3,
				childCount: 5,
				mutationRate: 0.1,
				selectorClass: Selector,
				selectorSettings: { foo: 'bar' },
				createChromosome: () => {},
				createArg: 'create argument'
			};

			expect(runUtils.normalizeSettings(settings)).to.deep.equal(settings);
		});

		it('supports chromosomeClass in place of createChromosome', function() {
			let settings = { chromosomeClass: TestChromosome };
			let { create } = TestChromosome;
			let boundCreate = () => {};
			sandbox.stub(create, 'bind').returns(boundCreate);

			let result = runUtils.normalizeSettings(settings);

			expect(create.bind).to.be.calledOnce;
			expect(create.bind).to.be.calledOn(create);
			expect(create.bind).to.be.calledWithExactly(TestChromosome);
			expect(result.createChromosome).to.equal(boundCreate);
		});

		it('applies defaults for other settings', function() {
			expect(runUtils.normalizeSettings({})).to.deep.equal({
				generationSize: 100,
				generationLimit: 10000,
				crossoverRate: 0,
				compoundCrossover: false,
				parentCount: 2,
				childCount: 2,
				mutationRate: 0,
				selectorClass: TournamentSelector,
				selectorSettings: {}
			});
		});
	});

	describe('::run', function() {
		it('runs a genetic algorithm with the provided settings', function() {
			let settings = { foo: 'bar' };
			let normalizedSettings = { baz: 'qux' };
			let runner = new Runner();
			let best = new TestIndividual('best');
			sandbox.stub(runUtils, 'normalizeSettings').returns(normalizedSettings);
			sandbox.stub(Runner, 'create').resolves(runner);
			sandbox.stub(runner, 'run').resolves(best);

			return runUtils.run(settings)
				.then((result) => {
					expect(runUtils.normalizeSettings).to.be.calledOnce;
					expect(runUtils.normalizeSettings).to.be.calledOn(runUtils);
					expect(runUtils.normalizeSettings).to.be.calledWith(settings);
					expect(Runner.create).to.be.calledOnce;
					expect(Runner.create).to.be.calledOn(Runner);
					expect(Runner.create).to.be.calledWith(normalizedSettings);
					expect(runner.run).to.be.calledOnce;
					expect(runner.run).to.be.calledOn(runner);
					expect(result).to.equal(best.chromosome);
				});
		});
	});
});
