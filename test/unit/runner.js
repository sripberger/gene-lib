const Runner = require('../../lib/runner');
const sinon = require('sinon');
const pasync = require('pasync');
const GenePool = require('../../lib/gene-pool');
const Population = require('../../lib/population');
const TestIndividual = require('../lib/test-individual');

describe.skip('Runner', function() {
	let sandbox;

	beforeEach(function() {
		sandbox = sinon.sandbox.create();
	});

	afterEach(function() {
		sandbox.restore();
	});

	it('initializes instance with provided population and settings', function() {
		let population = new Population();
		let settings = { foo: 'bar' };

		let runner = new Runner(population, settings);

		expect(runner.population).to.equal(population);
		expect(runner.settings).to.equal(settings);
		expect(runner.generationCount).to.equal(0);
		expect(runner.solution).to.be.null;
	});

	it('defaults to empty settings object', function() {
		let runner = new Runner(new Population());

		expect(runner.settings).to.deep.equal({});
	});

	describe('::create', function() {
		it('creates a runner based on provided settings object', function() {
			let settings = {
				generationSize: 100,
				createChromosome: () => {},
				createArg: 'chromosome factory argument',
				createConcurrency: 4,
				fitnessConcurrency: 2,
			};
			let population = new Population();
			sandbox.stub(Population, 'create').resolves(population);
			sinon.stub(population, 'setFitnesses').resolves();

			return Runner.create(settings)
				.then((result) => {
					expect(Population.create).to.be.calledOnce;
					expect(Population.create).to.be.calledOn(Population);
					expect(Population.create).to.be.calledWith(
						settings.generationSize,
						settings.createChromosome,
						settings.createArg,
						settings.createConcurrency
					);
					expect(population.setFitnesses).to.be.calledOnce;
					expect(population.setFitnesses).to.be.calledOn(population);
					expect(population.setFitnesses).to.be.calledWith(
						settings.fitnessConcurrency
					);
					expect(result).to.be.an.instanceof(Runner);
					expect(result.population).to.equal(population);
					expect(result.settings).to.equal(settings);

					// Test rejection to ensure we aren't resolving early.
					population.setFitnesses.rejects();
					return Runner.create(settings)
						.then(() => {
							throw new Error('Promise should have rejected.');
						}, () => {});
				});
		});
	});

	describe('#checkForSolution', function() {
		let population, runner, best;

		beforeEach(function() {
			population = new Population();
			runner = new Runner(population);
			best = new TestIndividual('best');

			sinon.stub(population, 'getBest').returns(best);
			sinon.stub(best, 'isSolution').resolves(false);
		});

		it('checks if the best chromosome is a solution', function() {
			return runner.checkForSolution()
				.then(() => {
					expect(population.getBest).to.be.calledOnce;
					expect(population.getBest).to.be.calledOn(population);
					expect(best.isSolution).to.be.calledOnce;
					expect(best.isSolution).to.be.calledOn(best);
					expect(runner.solution).to.be.null;
				});
		});

		it('sets solution property to best if it is a solution', function() {
			best.isSolution.resolves(true);

			return runner.checkForSolution()
				.then(() => {
					expect(runner.solution).to.equal(best);
				});
		});
	});

	describe('#runGeneration', function() {
		it('runs a single generation', function() {
			let foo = new TestIndividual('foo');
			let bar = new TestIndividual('bar');
			let baz = new TestIndividual('baz');
			let qux = new TestIndividual('qux');

			let population = new Population([ foo, bar ]);
			let settings = { generationSize: 100 };
			let runner = new Runner(population, settings);
			let genePool = new GenePool();
			let offspring = new Population([ baz, qux ]);
			runner.generationCount = 2;
			sandbox.stub(GenePool, 'fromPopulation').resolves(genePool);
			sinon.stub(genePool, 'getOffspring').resolves(offspring);

			return runner.runGeneration()
				.then(() => {
					expect(GenePool.fromPopulation).to.be.calledOnce;
					expect(GenePool.fromPopulation).to.be.calledOn(GenePool);
					expect(GenePool.fromPopulation).to.be.calledWith(
						population,
						settings
					);
					expect(genePool.getOffspring).to.be.calledOnce;
					expect(genePool.getOffspring).to.be.calledOn(genePool);
					expect(runner.population).to.equal(offspring);
					expect(runner.generationCount).to.equal(3);

					// Test rejection to ensure we aren't resolving early.
					genePool.getOffspring.rejects();
					return runner.runGeneration()
						.then(() => {
							throw new Error('Promise should have rejected.');
						}, () => {});
				});
		});
	});

	describe('#runStep', function() {
		let runner;

		beforeEach(function() {
			runner = new Runner();

			sinon.stub(runner, 'checkForSolution').resolves();
			sinon.stub(runner, 'runGeneration').resolves();
		});

		it('checks for solution, then runs a generation', function() {
			return runner.runStep()
				.then(() => {
					expect(runner.checkForSolution).to.be.calledOnce;
					expect(runner.checkForSolution).to.be.calledOn(runner);
					expect(runner.runGeneration).to.be.calledOnce;
					expect(runner.runGeneration).to.be.calledOn(runner);
				})
				.then(() => {
					// Test #checkForSolution rejection to ensure correct order.
					runner.checkForSolution.rejects();
					runner.runGeneration.resetHistory();
					return runner.runStep()
						.then(() => {
							throw new Error('Promise should have rejected.');
						}, () => {
							expect(runner.runGeneration).to.not.be.called;
						});
				})
				.then(() => {
					// Test #runGeneration rejection to ensure we aren't resolving early.
					runner.runGeneration.rejects();
					return runner.runStep()
						.then(() => {
							throw new Error('Promise should have rejected.');
						}, () => {});
				});
		});

		it('skips running generation if solution is already found', function() {
			runner.checkForSolution.callsFake(() => {
				runner.solution = new TestIndividual('solution');
				return Promise.resolve();
			});

			return runner.runStep()
				.then(() => {
					expect(runner.runGeneration).to.not.be.called;
				});
		});
	});

	describe('#getBest', function() {
		let population, runner;

		beforeEach(function() {
			population = new Population();
			runner = new Runner(population);
		});

		it('returns solution property if set', function() {
			let solution = runner.solution = new TestIndividual('solution');

			expect(runner.getBest()).to.equal(solution);
		});

		it('returns best individual otherwise', function() {
			let best = new TestIndividual('best');
			sinon.stub(population, 'getBest').returns(best);

			let result = runner.getBest();

			expect(population.getBest).to.be.calledOnce;
			expect(population.getBest).to.be.calledOn(population);
			expect(result).to.equal(best);
		});
	});

	describe('#run', function() {
		let runner, best;

		beforeEach(function() {
			runner = new Runner(new Population, { generationLimit: 10 });
			best = new TestIndividual('best');

			sandbox.stub(pasync, 'whilst').resolves();
			sinon.stub(runner, 'getBest').returns(best);
		});

		it('resolves with best individual after pasync::whilst', function() {
			return runner.run()
				.then((result) => {
					expect(pasync.whilst).to.be.calledOnce;
					expect(pasync.whilst).to.be.calledOn(pasync);
					expect(pasync.whilst).to.be.calledWith(
						sinon.match.func,
						sinon.match.func
					);
					expect(runner.getBest).to.be.calledOnce;
					expect(runner.getBest).to.be.calledOn(runner);
					expect(result).to.equal(best);
				})
				.then(() => {
					// Test rejection to ensure we aren't resolving early.
					pasync.whilst.rejects();
					return runner.run()
						.then(() => {
							throw new Error('Promise should have rejected.');
						}, () => {});
				});
		});

		describe('test', function() {
			let test;

			beforeEach(function() {
				return runner.run()
					.then(() => {
						test = pasync.whilst.firstCall.args[0];
					});
			});

			it('returns false if solution has been found', function() {
				runner.solution = new TestIndividual('solution');

				expect(test()).to.be.false;
			});

			it('returns false if generation limit has been reached', function() {
				runner.generationCount = 10;

				expect(test()).to.be.false;
			});

			it('returns false if generation limit has been exceeded', function() {
				runner.generationCount = 11;

				expect(test()).to.be.false;
			});

			it('returns true otherwise', function() {
				runner.generationCount = 9;

				expect(test()).to.be.true;
			});
		});

		describe('iteratee', function() {
			let iteratee;

			beforeEach(function() {
				return runner.run()
					.then(() => {
						iteratee = pasync.whilst.firstCall.args[1];
					});
			});

			it('resolves after #runStep', function() {
				sinon.stub(runner, 'runStep').resolves();

				return iteratee()
					.then(() => {
						expect(runner.runStep).to.be.calledOnce;
						expect(runner.runStep).to.be.calledOn(runner);
					})
					.then(() => {
						// Test rejection to ensure we aren't resolving early.
						runner.runStep.rejects();
						return iteratee()
							.then(() => {
								throw new Error('Promise should have rejected.');
							}, () => {});
					});
			});
		});
	});
});
