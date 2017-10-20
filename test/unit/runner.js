const Runner = require('../../lib/runner');
const EventEmitter = require('events');
const sinon = require('sinon');
const pasync = require('pasync');
const BreedingScheme = require('../../lib/breeding-scheme');
const GenePool = require('../../lib/gene-pool');
const Population = require('../../lib/population');
const TestIndividual = require('../lib/test-individual');

describe('Runner', function() {
	it('extends EventEmitter', function() {
		let runner = new Runner(new Population());

		expect(runner).to.be.an.instanceof(EventEmitter);
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

	it('attaches endGeneration handler from settings', function() {
		let onGeneration = sinon.spy(function onGeneration() {});
		let runner = new Runner(new Population(), { onGeneration });

		runner.emit('generation');

		expect(onGeneration).to.be.calledOnce;
	});

	describe('::createSync', function() {
		it('synchronously creates a runner based on provided settings object', function() {
			let settings = {
				generationSize: 100,
				createChromosome: () => {},
				createArg: 'create argument',
			};
			let population = new Population();
			sandbox.stub(Population, 'createSync').returns(population);
			sinon.stub(population, 'setFitnessesSync').returns(population);

			let result = Runner.createSync(settings);

			expect(Population.createSync).to.be.calledOnce;
			expect(Population.createSync).to.be.calledOn(Population);
			expect(Population.createSync).to.be.calledWith(settings);
			expect(population.setFitnessesSync).to.be.calledOnce;
			expect(population.setFitnessesSync).to.be.calledOn(population);
			expect(result).to.be.an.instanceof(Runner);
			expect(result.population).to.equal(population);
			expect(result.settings).to.equal(settings);
		});
	});

	describe('::createAsync', function() {
		let settings, population;

		beforeEach(function() {
			settings = {
				generationSize: 100,
				createChromosome: () => {},
				createArg: 'create argument',
			};
			population = new Population();
			sandbox.stub(Population, 'create').resolves(population);
			sinon.stub(population, 'setFitnesses').resolves(population);
		});

		it('asynchronously creates a runner based on provided settings object', function() {
			return Runner.createAsync(settings)
				.then((result) => {
					expect(Population.create).to.be.calledOnce;
					expect(Population.create).to.be.calledOn(Population);
					expect(Population.create).to.be.calledWith(settings);
					expect(population.setFitnesses).to.be.calledOnce;
					expect(population.setFitnesses).to.be.calledOn(population);
					expect(result).to.be.an.instanceof(Runner);
					expect(result.population).to.equal(population);
					expect(result.settings).to.equal(settings);
				})
				.then(() => {
					// Test rejection to ensure we aren't resolving early.
					population.setFitnesses.rejects();
					return Runner.createAsync(settings)
						.then(() => {
							throw new Error('Promise should have rejected.');
						}, () => {});
				});
		});

		it('supports synchronous component operations', function() {
			Population.create.returns(population);
			population.setFitnesses.returns(population);

			return Runner.createAsync(settings)
				.then((result) => {
					expect(Population.create).to.be.calledOnce;
					expect(Population.create).to.be.calledOn(Population);
					expect(Population.create).to.be.calledWith(settings);
					expect(population.setFitnesses).to.be.calledOnce;
					expect(population.setFitnesses).to.be.calledOn(population);
					expect(result).to.be.an.instanceof(Runner);
					expect(result.population).to.equal(population);
					expect(result.settings).to.equal(settings);
				});
		});
	});

	describe('#checkForSolution', function() {
		let population, runner, best;

		beforeEach(function() {
			population = new Population();
			runner = new Runner(population, { solutionFitness: 100 });
			best = new TestIndividual('best');

			sinon.stub(population, 'getBest').returns(best);
		});

		it('gets best individual', function() {
			runner.checkForSolution();

			expect(population.getBest).to.be.calledOnce;
			expect(population.getBest).to.be.calledOn(population);
		});

		context('best individual fitness equals settings.solutionFitness', function() {
			it('stores best individual on solution property', function() {
				best.fitness = 100;

				runner.checkForSolution();

				expect(runner.solution).to.equal(best);
			});
		});

		context('best individual fitness is above settings.solutionFitness', function() {
			it('stores best individual on solution property', function() {
				best.fitness = 101;

				runner.checkForSolution();

				expect(runner.solution).to.equal(best);
			});
		});

		context('best individual fitness is below settings.solutionFitness', function() {
			it('does not set solution property', function() {
				best.fitness = 99;

				runner.checkForSolution();

				expect(runner.solution).to.equal(null);
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

	describe('#getResult', function() {
		it('returns generationCount, best, and individuals', function() {
			let population = new Population([
				new TestIndividual('foo'),
				new TestIndividual('bar')
			]);
			let runner = new Runner(population);
			let best = new TestIndividual('best');
			runner.generationCount = 42;
			sandbox.stub(runner, 'getBest').returns(best);

			let result = runner.getResult();

			expect(runner.getBest).to.be.calledOnce;
			expect(runner.getBest).to.be.calledOn(runner);
			expect(result).to.deep.equal({
				generationCount: runner.generationCount,
				best,
				individuals: population.individuals
			});
		});
	});

	describe('#emitGeneration', function() {
		it('emits generation event with result', function() {
			let runner = new Runner(new Population());
			let result = { foo: 'bar' };
			sinon.stub(runner, 'getResult').returns(result);
			sinon.spy(runner, 'emit');

			runner.emitGeneration();

			expect(runner.getResult).to.be.calledOnce;
			expect(runner.getResult).to.be.calledOn(runner);
			expect(runner.emit).to.be.calledOnce;
			expect(runner.emit).to.be.calledOn(runner);
			expect(runner.emit).to.be.calledWith('generation', result);
		});
	});

	describe('#runGenerationSync', function() {
		it('synchronously runs a single generation', function() {
			let foo = new TestIndividual('foo');
			let bar = new TestIndividual('bar');
			let fooBar = new TestIndividual('foo-bar');
			let barFoo = new TestIndividual('bar-foo');
			let fooBarPrime = new TestIndividual('foo-bar-prime');
			let barFooPrime = new TestIndividual('bar-foo-prime');
			let population = new Population([ foo, bar ]);
			let runner = new Runner(population);
			let pool = new GenePool();
			let scheme = new BreedingScheme();
			let offspring = new Population([ fooBar, barFoo ]);
			let mutants = new Population([ fooBarPrime, barFooPrime ]);
			sandbox.stub(GenePool, 'fromPopulationSync').returns(pool);
			sinon.stub(pool, 'performSelectionsSync').returns(scheme);
			sinon.stub(scheme, 'performCrossoversSync').returns(offspring);
			sinon.stub(offspring, 'mutateSync').returns(mutants);
			sinon.stub(mutants, 'setFitnessesSync').returns(mutants);
			runner.generationCount = 2;

			runner.runGenerationSync();

			expect(GenePool.fromPopulationSync).to.be.calledOnce;
			expect(GenePool.fromPopulationSync).to.be.calledOn(GenePool);
			expect(GenePool.fromPopulationSync).to.be.calledWith(population);
			expect(pool.performSelectionsSync).to.be.calledOnce;
			expect(pool.performSelectionsSync).to.be.calledOn(pool);
			expect(scheme.performCrossoversSync).to.be.calledOnce;
			expect(scheme.performCrossoversSync).to.be.calledOn(scheme);
			expect(offspring.mutateSync).to.be.calledOnce;
			expect(offspring.mutateSync).to.be.calledOn(offspring);
			expect(mutants.setFitnessesSync).to.be.calledOnce;
			expect(mutants.setFitnessesSync).to.be.calledOn(mutants);
			expect(runner.population).to.equal(mutants);
			expect(runner.generationCount).to.equal(3);
		});
	});

	describe('#runGenerationAsync', function() {
		let population, runner, pool, scheme, offspring, mutants;

		beforeEach(function() {
			let foo = new TestIndividual('foo');
			let bar = new TestIndividual('bar');
			let fooBar = new TestIndividual('foo-bar');
			let barFoo = new TestIndividual('bar-foo');
			let fooBarPrime = new TestIndividual('foo-bar-prime');
			let barFooPrime = new TestIndividual('bar-foo-prime');

			population = new Population([ foo, bar ]);
			runner = new Runner(population);
			pool = new GenePool();
			scheme = new BreedingScheme();
			offspring = new Population([ fooBar, barFoo ]);
			mutants = new Population([ fooBarPrime, barFooPrime ]);

			sandbox.stub(GenePool, 'fromPopulation').resolves(pool);
			sinon.stub(pool, 'performSelections').resolves(scheme);
			sinon.stub(scheme, 'performCrossovers').resolves(offspring);
			sinon.stub(offspring, 'mutate').resolves(mutants);
			sinon.stub(mutants, 'setFitnesses').resolves(mutants);

			runner.generationCount = 2;
		});

		it('asynchronously runs a single generation', function() {
			return runner.runGenerationAsync()
				.then(() => {
					expect(GenePool.fromPopulation).to.be.calledOnce;
					expect(GenePool.fromPopulation).to.be.calledOn(GenePool);
					expect(GenePool.fromPopulation).to.be.calledWith(population);
					expect(pool.performSelections).to.be.calledOnce;
					expect(pool.performSelections).to.be.calledOn(pool);
					expect(scheme.performCrossovers).to.be.calledOnce;
					expect(scheme.performCrossovers).to.be.calledOn(scheme);
					expect(offspring.mutate).to.be.calledOnce;
					expect(offspring.mutate).to.be.calledOn(offspring);
					expect(mutants.setFitnesses).to.be.calledOnce;
					expect(mutants.setFitnesses).to.be.calledOn(mutants);
					expect(runner.population).to.equal(mutants);
					expect(runner.generationCount).to.equal(3);
				})
				.then(() => {
					// Test rejection to ensure we aren't resolving early.
					mutants.setFitnesses.rejects();
					return runner.runGenerationAsync()
						.then(() => {
							throw new Error('Promise should have rejected.');
						}, () => {});
				});
		});

		it('supports synchronous component operations', function() {
			GenePool.fromPopulation.returns(pool);
			pool.performSelections.returns(scheme);
			scheme.performCrossovers.returns(offspring);
			offspring.mutate.returns(mutants);
			mutants.setFitnesses.returns(mutants);

			return runner.runGenerationAsync()
				.then(() => {
					expect(GenePool.fromPopulation).to.be.calledOnce;
					expect(GenePool.fromPopulation).to.be.calledOn(GenePool);
					expect(GenePool.fromPopulation).to.be.calledWith(population);
					expect(pool.performSelections).to.be.calledOnce;
					expect(pool.performSelections).to.be.calledOn(pool);
					expect(scheme.performCrossovers).to.be.calledOnce;
					expect(scheme.performCrossovers).to.be.calledOn(scheme);
					expect(offspring.mutate).to.be.calledOnce;
					expect(offspring.mutate).to.be.calledOn(offspring);
					expect(mutants.setFitnesses).to.be.calledOnce;
					expect(mutants.setFitnesses).to.be.calledOn(mutants);
					expect(runner.population).to.equal(mutants);
					expect(runner.generationCount).to.equal(3);
				});
		});
	});

	describe('#runStepSync', function() {
		let runner;

		beforeEach(function() {
			runner = new Runner();
			sinon.stub(runner, 'checkForSolution');
			sinon.stub(runner, 'runGenerationSync');
			sinon.stub(runner, 'emitGeneration');
		});

		it('checks for solution, runs a generation, then emits generation event', function() {
			runner.runStepSync();

			expect(runner.checkForSolution).to.be.calledOnce;
			expect(runner.checkForSolution).to.be.calledOn(runner);
			expect(runner.runGenerationSync).to.be.calledOnce;
			expect(runner.runGenerationSync).to.be.calledOn(runner);
			expect(runner.runGenerationSync).to.be.calledAfter(
				runner.checkForSolution
			);
			expect(runner.emitGeneration).to.be.calledOnce;
			expect(runner.emitGeneration).to.be.calledOn(runner);
			expect(runner.emitGeneration).to.be.calledAfter(
				runner.runGenerationSync
			);
		});

		it('skips running generation if solution is found', function() {
			runner.checkForSolution.callsFake(() => {
				runner.solution = new TestIndividual('solution');
			});

			runner.runStepSync();

			expect(runner.runGenerationSync).to.not.be.called;
			expect(runner.emitGeneration).to.not.be.called;
		});
	});

	describe('#runStepAsync', function() {
		let runner;

		beforeEach(function() {
			runner = new Runner();
			sinon.stub(runner, 'checkForSolution');
			sinon.stub(runner, 'runGenerationAsync').resolves();
			sinon.stub(runner, 'emitGeneration');
		});

		it('checks for solution, runs a generation, then emits generation event', function() {
			return runner.runStepAsync()
				.then(() => {
					expect(runner.checkForSolution).to.be.calledOnce;
					expect(runner.checkForSolution).to.be.calledOn(runner);
					expect(runner.runGenerationAsync).to.be.calledOnce;
					expect(runner.runGenerationAsync).to.be.calledOn(runner);
					expect(runner.runGenerationAsync).to.be.calledAfter(
						runner.checkForSolution
					);
					expect(runner.emitGeneration).to.be.calledOnce;
					expect(runner.emitGeneration).to.be.calledOn(runner);
					expect(runner.emitGeneration).to.be.calledAfter(
						runner.runGenerationAsync
					);
				})
				.then(() => {
					// Test rejection to ensure we aren't resolving or emitting
					// early.
					runner.runGenerationAsync.rejects();
					runner.emitGeneration.resetHistory();
					return runner.runStepAsync()
						.then(() => {
							throw new Error('Promise should have rejected.');
						}, () => {
							expect(runner.emitGeneration).to.not.be.called;
						});
				});
		});

		it('skips running generation if solution is already found', function() {
			runner.checkForSolution.callsFake(() => {
				runner.solution = new TestIndividual('solution');
			});

			return runner.runStepAsync()
				.then(() => {
					expect(runner.runGenerationAsync).to.not.be.called;
					expect(runner.emitGeneration).to.not.be.called;
				});
		});
	});

	describe('#runSync', function() {
		let runner, runResult;

		beforeEach(function() {
			runner = new Runner(new Population, { generationLimit: 3 });
			runResult = { foo: 'bar' };

			sinon.stub(runner, 'runStepSync').callsFake(() => {
				runner.generationCount += 1;
			});
			sinon.stub(runner, 'getResult').returns(runResult);
		});

		it('returns result after reaching generationLimit', function() {
			let result = runner.runSync();

			expect(runner.runStepSync).to.be.calledThrice;
			expect(runner.runStepSync).to.always.be.calledOn(runner);
			expect(runner.getResult).to.be.calledOnce;
			expect(runner.getResult).to.be.calledOn(runner);
			expect(result).to.equal(runResult);
		});

		it('returns result after finding solution', function() {
			runner.runStepSync.onSecondCall().callsFake(() => {
				runner.generationCount += 1;
				runner.solution = new TestIndividual('solution');
			});

			let result = runner.runSync();

			expect(runner.runStepSync).to.be.calledTwice;
			expect(runner.runStepSync).to.always.be.calledOn(runner);
			expect(runner.getResult).to.be.calledOnce;
			expect(runner.getResult).to.be.calledOn(runner);
			expect(result).to.equal(runResult);
		});
	});

	describe('#runAsync', function() {
		let runner, runResult;

		beforeEach(function() {
			runner = new Runner(new Population, { generationLimit: 10 });
			runResult = { foo: 'bar' };

			sandbox.stub(pasync, 'whilst').resolves();
			sinon.stub(runner, 'getResult').returns(runResult);
		});

		it('resolves with result after pasync::whilst', function() {
			return runner.runAsync()
				.then((result) => {
					expect(pasync.whilst).to.be.calledOnce;
					expect(pasync.whilst).to.be.calledOn(pasync);
					expect(pasync.whilst).to.be.calledWith(
						sinon.match.func,
						sinon.match.func
					);
					expect(runner.getResult).to.be.calledOnce;
					expect(runner.getResult).to.be.calledOn(runner);
					expect(result).to.equal(runResult);
				})
				.then(() => {
					// Test rejection to ensure we aren't resolving early.
					pasync.whilst.rejects();
					return runner.runAsync()
						.then(() => {
							throw new Error('Promise should have rejected.');
						}, () => {});
				});
		});

		describe('test', function() {
			let test;

			beforeEach(function() {
				return runner.runAsync()
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
				return runner.runAsync()
					.then(() => {
						iteratee = pasync.whilst.firstCall.args[1];
					});
			});

			it('resolves after #runStepAsync', function() {
				sinon.stub(runner, 'runStepAsync').resolves();

				return iteratee()
					.then(() => {
						expect(runner.runStepAsync).to.be.calledOnce;
						expect(runner.runStepAsync).to.be.calledOn(runner);
					})
					.then(() => {
						// Test rejection to ensure we aren't resolving early.
						runner.runStepAsync.rejects();
						return iteratee()
							.then(() => {
								throw new Error('Promise should have rejected.');
							}, () => {});
					});
			});
		});
	});
});
