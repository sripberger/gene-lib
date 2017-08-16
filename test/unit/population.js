const Population = require('../../lib/population');
const sinon = require('sinon');
const pasync = require('pasync');
const Individual = require('../../lib/individual');
const TestIndividual = require('../lib/test-individual');

describe('Population', function() {
	let sandbox;

	beforeEach(function() {
		sandbox = sinon.sandbox.create();
	});

	afterEach(function() {
		sandbox.restore();
	});

	it('stores provided invididuals array and settings object', function() {
		let foo = new TestIndividual('foo');
		let bar = new TestIndividual('bar');
		let individuals = [ foo, bar ];
		let settings = { baz: 'qux' };

		let population = new Population(individuals, settings);

		expect(population.individuals).to.equal(individuals);
		expect(population.settings).to.equal(settings);
	});

	it('defaults to empty individuals array and settings object', function() {
		let population = new Population();

		expect(population.individuals).to.deep.equal([]);
		expect(population.settings).to.deep.equal({});
	});

	describe('::createSync', function() {
		it('creates population using Individual::create', function() {
			let foo = new TestIndividual('foo');
			let bar = new TestIndividual('bar');
			let settings = {
				generationSize: 2,
				createChromosome: () => {},
				createArg: 'create argument'
			};
			sandbox.stub(Individual, 'create')
				.onFirstCall().returns(foo)
				.onSecondCall().returns(bar);

			let result = Population.createSync(settings);

			expect(Individual.create).to.be.calledTwice;
			expect(Individual.create).to.always.be.calledOn(Individual);
			expect(Individual.create).to.always.be.calledWith(
				settings.createChromosome,
				settings.createArg
			);
			expect(result).to.be.an.instanceof(Population);
			expect(result.individuals).to.deep.equal([ foo, bar ]);
			expect(result.settings).to.equal(settings);
		});
	});

	describe('::createAsync', function() {
		let individuals, settings;

		beforeEach(function() {
			let foo = new TestIndividual('foo');
			let bar = new TestIndividual('bar');

			individuals = [ foo, bar ];
			settings = {
				generationSize: 2,
				createChromosome: () => {},
				createArg: 'create argument',
				async: { creation: 4 }
			};

			sandbox.stub(pasync, 'timesLimit').resolves(individuals);
		});

		it('creates a population using pasync::timesLimit', function() {
			return Population.createAsync(settings)
				.then((result) => {
					expect(pasync.timesLimit).to.be.calledOnce;
					expect(pasync.timesLimit).to.be.calledOn(pasync);
					expect(pasync.timesLimit).to.be.calledWith(
						settings.generationSize,
						settings.async.creation,
						sinon.match.func
					);
					expect(result).to.be.an.instanceof(Population);
					expect(result.individuals).to.equal(individuals);
					expect(result.settings).to.equal(settings);
				});
		});

		describe('iteratee', function() {
			let iteratee;

			beforeEach(function() {
				return Population.createAsync(settings)
					.then(() => {
						iteratee = pasync.timesLimit.firstCall.args[2];
					});
			});

			it('resolves with result of Individual::createAsync', function() {
				let [ individual ] = individuals;
				sandbox.stub(Individual, 'createAsync').resolves(individual);

				return iteratee()
					.then((result) => {
						expect(Individual.createAsync).to.be.calledOnce;
						expect(Individual.createAsync).to.be.calledOn(Individual);
						expect(Individual.createAsync).to.be.calledWith(
							settings.createChromosome,
							settings.createArg
						);
						expect(result).to.equal(individual);
					});
			});
		});
	});

	describe('#mutate', function() {
		let settings, population, mutants;

		beforeEach(function() {
			settings = {};
			population = new Population([], settings);
			mutants = new Population([], settings);
			sinon.stub(population, 'mutateSync').returns(mutants);
			sinon.stub(population, 'mutateAsync').resolves(mutants);
		});

		context('settings.async is not set', function() {
			it('returns result of #mutateSync', function() {
				let result = population.mutate();

				expect(population.mutateSync).to.be.calledOnce;
				expect(population.mutateSync).to.be.calledOn(population);
				expect(result).to.equal(mutants);
			});
		});

		context('settings.async.mutation is not set', function() {
			it('returns result of #mutateSync', function() {
				settings.async = {};

				let result = population.mutate();

				expect(population.mutateSync).to.be.calledOnce;
				expect(population.mutateSync).to.be.calledOn(population);
				expect(result).to.equal(mutants);
			});
		});

		context('settings.async.mutation is set', function() {
			it('resolves with result of #mutateAsync', function() {
				settings.async = { mutation: 1 };

				return population.mutate()
					.then((result) => {
						expect(population.mutateAsync).to.be.calledOnce;
						expect(population.mutateAsync).to.be.calledOn(
							population
						);
						expect(result).to.equal(mutants);
					});
			});
		});
	});

	describe('#mutateSync', function() {
		it('maps individuals to a new population using Individual#mutate', function() {
			let foo = new TestIndividual('foo');
			let bar = new TestIndividual('bar');
			let fooPrime = new TestIndividual('foo-prime');
			let barPrime = new TestIndividual('bar-prime');
			let settings = { mutationRate: 0.01 };
			let population = new Population([ foo, bar ], settings);
			sinon.stub(foo, 'mutate').returns(fooPrime);
			sinon.stub(bar, 'mutate').returns(barPrime);

			let result = population.mutateSync();

			expect(foo.mutate).to.be.calledOnce;
			expect(foo.mutate).to.be.calledOn(foo);
			expect(foo.mutate).to.be.calledWith(settings.mutationRate);
			expect(bar.mutate).to.be.calledOnce;
			expect(bar.mutate).to.be.calledOn(bar);
			expect(bar.mutate).to.be.calledWith(settings.mutationRate);
			expect(result).to.be.an.instanceof(Population);
			expect(result.individuals).to.deep.equal([ fooPrime, barPrime ]);
			expect(result.settings).to.equal(settings);
		});
	});

	describe('#mutateAsync', function() {
		let individuals, settings, population, mutants;

		beforeEach(function() {
			let foo = new TestIndividual('foo');
			let bar = new TestIndividual('bar');
			let fooPrime = new TestIndividual('foo-prime');
			let barPrime = new TestIndividual('bar-prime');

			individuals = [ foo, bar ];
			settings = { mutationRate: 0.1, async: { mutation: 4 } };
			population = new Population(individuals, settings);
			mutants = [ fooPrime, barPrime ];

			sandbox.stub(pasync, 'mapLimit').resolves(mutants);
		});

		it('asnychronously maps individuals into a new population', function() {
			return population.mutateAsync()
				.then((result) => {
					expect(pasync.mapLimit).to.be.calledOnce;
					expect(pasync.mapLimit).to.be.calledOn(pasync);
					expect(pasync.mapLimit).to.be.calledWith(
						individuals,
						settings.async.mutation,
						sinon.match.func
					);
					expect(result).to.be.an.instanceof(Population);
					expect(result.individuals).to.equal(mutants);
					expect(result.settings).to.equal(settings);
				});
		});

		describe('iteratee', function() {
			let iteratee;

			beforeEach(function() {
				return population.mutateAsync()
					.then(() => {
						iteratee = pasync.mapLimit.firstCall.args[2];
					});
			});

			it('resolves with result of individual#mutateAsync', function() {
				let [ foo ] = individuals;
				let [ fooPrime ] = mutants;
				sinon.stub(foo, 'mutateAsync').resolves(fooPrime);

				return iteratee(foo)
					.then((result) => {
						expect(foo.mutateAsync).to.be.calledOnce;
						expect(foo.mutateAsync).to.be.calledOn(foo);
						expect(foo.mutateAsync).to.be.calledWith(
							settings.mutationRate
						);
						expect(result).to.equal(fooPrime);
					});
			});
		});
	});

	describe('#setFitnesses', function() {
		let settings, population;

		beforeEach(function() {
			settings = {};
			population = new Population([], settings);
			sinon.stub(population, 'setFitnessesSync');
			sinon.stub(population, 'setFitnessesAsync').resolves();
		});

		context('settings.async is not set', function() {
			it('invokes #setFitnessesSync', function() {
				population.setFitnesses();

				expect(population.setFitnessesSync).to.be.calledOnce;
				expect(population.setFitnessesSync).to.be.calledOn(population);
			});
		});

		context('settings.async.fitness is not set', function() {
			it('invokes #setFitnessesSync', function() {
				settings.async = {};

				population.setFitnesses();

				expect(population.setFitnessesSync).to.be.calledOnce;
				expect(population.setFitnessesSync).to.be.calledOn(population);
			});
		});

		context('settings.async.fitness is set', function() {
			it('resolves after invoking #setFitnessesAsync', function() {
				settings.async = { fitness: 1 };

				return population.setFitnesses()
					.then(() => {
						expect(population.setFitnessesAsync).to.be.calledOnce;
						expect(population.setFitnessesAsync).to.be.calledOn(
							population
						);
					}).then(() => {
						// Test rejection to ensure we aren't resolving early.
						population.setFitnessesAsync.rejects();
						return population.setFitnesses()
							.then(() => {
								throw new Error('Promise should have rejected');
							}, () => {});
					});
			});
		});
	});

	describe('#setFitnessesSync', function() {
		it('invokes setFitness on each individual', function() {
			let foo = new TestIndividual('foo');
			let bar = new TestIndividual('bar');
			let population = new Population([ foo, bar ]);
			sinon.stub(foo, 'setFitness');
			sinon.stub(bar, 'setFitness');

			population.setFitnessesSync();

			expect(foo.setFitness).to.be.calledOnce;
			expect(foo.setFitness).to.be.calledOn(foo);
			expect(bar.setFitness).to.be.calledOnce;
			expect(bar.setFitness).to.be.calledOn(bar);
		});
	});

	describe('#setFitnessesAsync', function() {
		let individuals, settings, population;

		beforeEach(function() {
			let foo = new TestIndividual('foo');
			let bar = new TestIndividual('bar');

			individuals = [ foo, bar ];
			settings = { async: { fitness: 4 } };
			population = new Population(individuals, settings);

			sandbox.stub(pasync, 'eachLimit').resolves();
		});

		it('resolves after asynchronously iterating over each individual', function() {
			return population.setFitnessesAsync()
				.then(() => {
					expect(pasync.eachLimit).to.be.calledOnce;
					expect(pasync.eachLimit).to.be.calledOn(pasync);
					expect(pasync.eachLimit).to.be.calledWith(
						individuals,
						settings.async.fitness,
						sinon.match.func
					);

					// Test rejection to ensure we aren't resolving early.
					pasync.eachLimit.rejects();
					return population.setFitnessesAsync()
						.then(() => {
							throw new Error('Promise should have rejected');
						}, () => {});
				});
		});

		describe('iteratee', function() {
			let iteratee;

			beforeEach(function() {
				return population.setFitnessesAsync()
					.then(() => {
						iteratee = pasync.eachLimit.firstCall.args[2];
					});
			});

			it('resolves after invoking individual#setFitness', function() {
				let [ foo ] = individuals;
				sinon.stub(foo, 'setFitnessAsync').resolves();

				return iteratee(foo)
					.then(() => {
						expect(foo.setFitnessAsync).to.be.calledOnce;
						expect(foo.setFitnessAsync).to.be.calledOn(foo);

						// Test rejection to ensure we aren't resolving early.
						foo.setFitnessAsync.rejects();
						return iteratee(foo)
							.then(() => {
								throw new Error('Promise should have rejected');
							}, () => {});
					});
			});
		});
	});

	describe('#getBest', function() {
		it('returns individual with the highest fitness', function() {
			let foo = new TestIndividual('foo');
			let bar = new TestIndividual('bar');
			let baz = new TestIndividual('baz');
			let population = new Population([ foo, bar, baz ]);
			foo.fitness = 8;
			bar.fitness = 10;
			baz.fitness = 9;

			expect(population.getBest()).to.equal(bar);
		});
	});
});
