const Runner = require('../../lib/runner');
const sinon = require('sinon');
const Generation = require('../../lib/generation');
const TestIndividual = require('../lib/test-individual');

describe('Runner', function() {
	let sandbox;

	beforeEach(function() {
		sandbox = sinon.sandbox.create();
	});

	afterEach(function() {
		sandbox.restore();
	});

	it('initializes instance with provided generation and settings', function() {
		let generation = new Generation();
		let settings = { foo: 'bar' };

		let runner = new Runner(generation, settings);

		expect(runner.generation).to.equal(generation);
		expect(runner.settings).to.equal(settings);
		expect(runner.oldGeneration).to.be.null;
		expect(runner.generationCount).to.equal(0);
		expect(runner.solution).to.be.null;
	});

	it('defaults to empty settings object', function() {
		let runner = new Runner();

		expect(runner.settings).to.deep.equal({});
	});

	describe('::create', function() {
		it('creates a populated runner based on provided settings object', function() {
			let generationSize = 20;
			let settings = {
				runnerSettings: { generationSize },
				generationSettings: { foo: 'bar' },
				selectorClass: function TestSelector() {},
				selectorSettings: { baz: 'qux' }

			};
			let generation = new Generation();
			sandbox.stub(Generation, 'create').returns(generation);
			sinon.stub(generation, 'populate');

			let result = Runner.create(settings);

			expect(Generation.create).to.be.calledOnce;
			expect(Generation.create).to.be.calledOn(Generation);
			expect(Generation.create).to.be.calledWith(
				settings.selectorClass,
				settings.selectorSettings,
				settings.generationSettings
			);
			expect(generation.populate).to.be.calledOnce;
			expect(generation.populate).to.be.calledOn(generation);
			expect(generation.populate).to.be.calledWith(generationSize);
			expect(result).to.be.an.instanceof(Runner);
			expect(result.generation).to.equal(generation);
			expect(result.settings).to.equal(settings.runnerSettings);
		});
	});

	describe('#checkForSolution', function() {
		let generation, runner, best;

		beforeEach(function() {
			generation = new Generation();
			runner = new Runner(generation);
			best = new TestIndividual('best');
			sinon.stub(generation, 'getBest').returns(best);
			sinon.stub(best, 'isSolution').returns(false);
		});

		it('checks if the best individual is a solution', function() {
			runner.checkForSolution();

			expect(generation.getBest).to.be.calledOnce;
			expect(generation.getBest).to.be.calledOn(generation);
			expect(best.isSolution).to.be.calledOnce;
			expect(best.isSolution).to.be.calledOn(best);
			expect(runner.solution).to.be.null;
		});

		it('sets solution property if best individual is a solution', function() {
			best.isSolution.returns(true);

			runner.checkForSolution();

			expect(generation.getBest).to.be.calledOnce;
			expect(generation.getBest).to.be.calledOn(generation);
			expect(best.isSolution).to.be.calledOnce;
			expect(best.isSolution).to.be.calledOn(best);
			expect(runner.solution).to.equal(best);
		});
	});

	describe('#startNewGeneration', function() {
		it('advances generations and increments generation count', function() {
			let generation = new Generation();
			let runner = new Runner(generation);
			let nextGeneration = new Generation();
			sinon.stub(generation, 'getNext').returns(nextGeneration);
			runner.generationCount = 2;

			runner.startNewGeneration();

			expect(generation.getNext).to.be.calledOnce;
			expect(generation.getNext).to.be.calledOn(generation);
			expect(runner.oldGeneration).to.equal(generation);
			expect(runner.generation).to.equal(nextGeneration);
			expect(runner.generationCount).to.equal(3);
		});
	});

	describe('#runStep', function() {
		let generation, runner, oldGeneration, foo, bar;

		beforeEach(function() {
			generation = new Generation();
			runner = new Runner(generation);
			oldGeneration = runner.oldGeneration = new Generation();
			foo = new TestIndividual('foo');
			bar = new TestIndividual('bar');

			sinon.stub(oldGeneration, 'getOffspring').returns([ foo, bar ]);
			sinon.stub(generation, 'add');
			sinon.stub(foo, 'isSolution').returns(false);
			sinon.stub(bar, 'isSolution').returns(false);
		});

		it('adds offspring to next generation, checking them for solutions', function() {
			runner.runStep();

			expect(oldGeneration.getOffspring).to.be.calledOnce;
			expect(oldGeneration.getOffspring).to.be.calledOn(oldGeneration);
			expect(generation.add).to.be.calledOnce;
			expect(generation.add).to.be.calledOn(generation);
			expect(generation.add).to.be.calledWithExactly(foo, bar);
			expect(foo.isSolution).to.be.called;
			expect(foo.isSolution).to.be.calledOn(foo);
			expect(bar.isSolution).to.be.called;
			expect(bar.isSolution).to.be.calledOn(bar);
			expect(runner.solution).to.be.null;
		});

		it('sets solution property, if an offspring is a solution', function() {
			bar.isSolution.returns(true);

			runner.runStep();

			expect(runner.solution).to.equal(bar);
		});
	});

	describe('#populateGeneration', function() {
		let generation, runner, size;

		beforeEach(function() {
			generation = new Generation();
			runner = new Runner(generation, { generationSize: 3 });
			size = 0;

			sinon.stub(runner, 'runStep');
			sinon.stub(generation, 'getSize').callsFake(() => size);
		});

		it('calls runStep until generation size matches generationSize setting', function() {
			runner.runStep.callsFake(() => {
				size += 1;
				if (size >= 10) {
					throw new Error('Too many runStep calls');
				}
			});

			runner.populateGeneration();

			expect(generation.getSize).to.be.called;
			expect(generation.getSize).to.always.be.calledOn(generation);
			expect(runner.runStep).to.be.calledThrice;
			expect(runner.runStep).to.always.be.calledOn(runner);
		});

		it('stops when generation size exceeds setting', function() {
			runner.runStep.callsFake(() => {
				size += 2;
				if (size >= 10) {
					throw new Error('Too many runStep calls');
				}
			});

			runner.populateGeneration();

			expect(runner.runStep).to.be.calledTwice;
		});

		it('stops when solution is found', function() {
			runner.runStep.callsFake(() => {
				size += 1;
				if (size == 2) {
					runner.solution = new TestIndividual('solution');
				} else if (size >= 10) {
					throw new Error('Too many runStep calls');
				}
			});

			runner.populateGeneration();

			expect(runner.runStep).to.be.calledTwice;
		});
	});

	describe('#runGeneration', function() {
		it('starts and populates a new generation', function() {
			let runner = new Runner();
			sinon.stub(runner, 'startNewGeneration');
			sinon.stub(runner, 'populateGeneration');

			runner.runGeneration();

			expect(runner.startNewGeneration).to.be.calledOnce;
			expect(runner.startNewGeneration).to.be.calledOn(runner);
			expect(runner.populateGeneration).to.be.calledOnce;
			expect(runner.populateGeneration).to.be.calledOn(runner);
			expect(runner.startNewGeneration).to.be
				.calledBefore(runner.populateGeneration);
		});
	});

	describe('#run', function() {
		let runner;

		beforeEach(function() {
			runner = new Runner();
			sinon.stub(runner, 'checkForSolution');
			sinon.stub(runner, 'runGeneration').callsFake(() => {
				runner.generationCount += 1;
				if (runner.generationCount === 3) {
					runner.solution = new TestIndividual('solution');
				}
			});
		});

		it('checks for solution, then runs generations until a solution is found', function() {
			runner.run();

			expect(runner.checkForSolution).to.be.calledOnce;
			expect(runner.checkForSolution).to.be.calledOn(runner);
			expect(runner.runGeneration).to.be.calledThrice;
			expect(runner.runGeneration).to.always.be.calledOn(runner);
			expect(runner.runGeneration).to.be.calledAfter(runner.checkForSolution);
		});

		it('runs no generations if solution is already found', function() {
			runner.checkForSolution.callsFake(() => {
				runner.solution = new TestIndividual('solution');
			});

			runner.run();

			expect(runner.runGeneration).to.not.be.called;
		});

		it('stops when generation limit is reached', function() {
			runner.settings.generationLimit = 2;

			runner.run();

			expect(runner.runGeneration).to.be.calledTwice;
			expect(runner.runGeneration).to.always.be.calledOn(runner);
		});

		it('supports generation limit of zero', function() {
			runner.settings.generationLimit = 0;

			runner.run();

			expect(runner.runGeneration).to.not.be.called;
		});
	});

	describe('#getBest', function() {
		let generation, runner, best;

		beforeEach(function() {
			generation = new Generation();
			runner = new Runner(generation);
			best = new TestIndividual('best');
			sinon.stub(generation, 'getBest').returns(best);
		});

		it('returns solution property if set', function() {
			let solution = runner.solution = new TestIndividual('solution');

			expect(runner.getBest()).to.equal(solution);
		});

		it('returns best individual otherwise', function() {
			let result = runner.getBest();

			expect(generation.getBest).to.be.calledOnce;
			expect(generation.getBest).to.be.calledOn(generation);
			expect(result).to.equal(best);
		});
	});
});
