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

	describe('::create', function() {
		let settings, population;

		beforeEach(function() {
			settings = {};
			population = new Population();
			sandbox.stub(Population, 'createSync').returns(population);
			sandbox.stub(Population, 'createAsync').resolves(population);
		});

		context('settings.async is not set', function() {
			it('returns result of ::createSync', function() {
				let result = Population.create(settings);

				expect(Population.createSync).to.be.calledOnce;
				expect(Population.createSync).to.be.calledOn(Population);
				expect(Population.createSync).to.be.calledWith(settings);
				expect(result).to.equal(population);
			});
		});

		context('settings.async.create is not set', function() {
			it('returns result of ::createSync', function() {
				settings.async = {};

				let result = Population.create(settings);

				expect(Population.createSync).to.be.calledOnce;
				expect(Population.createSync).to.be.calledOn(Population);
				expect(Population.createSync).to.be.calledWith(settings);
				expect(result).to.equal(population);
			});
		});

		context('settings.async.create is set', function() {
			it('resolves with result of ::createAsync', function() {
				settings.async = { create: 1 };

				return Population.create(settings)
					.then((result) => {
						expect(Population.createAsync).to.be.calledOnce;
						expect(Population.createAsync).to.be.calledOn(Population);
						expect(Population.createAsync).to.be.calledWith(settings);
						expect(result).to.equal(population);
					});
			});
		});
	});

	describe('::createSync', function() {
		it('creates population using Individual::createSync', function() {
			let foo = new TestIndividual('foo');
			let bar = new TestIndividual('bar');
			let settings = {
				generationSize: 2,
				createChromosome: () => {},
				createArg: 'create argument'
			};
			sandbox.stub(Individual, 'createSync')
				.onFirstCall().returns(foo)
				.onSecondCall().returns(bar);

			let result = Population.createSync(settings);

			expect(Individual.createSync).to.be.calledTwice;
			expect(Individual.createSync).to.always.be.calledOn(Individual);
			expect(Individual.createSync).to.always.be.calledWith(
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
				async: { create: 4 }
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
						settings.async.create,
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

	describe('#setFitnesses', function() {
		let settings, population;

		beforeEach(function() {
			settings = {};
			population = new Population([], settings);
			sinon.stub(population, 'setFitnessesSync').returns(population);
			sinon.stub(population, 'setFitnessesAsync').resolves(population);
		});

		context('settings.async is not set', function() {
			it('returns instance after invoking #setFitnessesSync', function() {
				let result = population.setFitnesses();

				expect(population.setFitnessesSync).to.be.calledOnce;
				expect(population.setFitnessesSync).to.be.calledOn(population);
				expect(result).to.equal(population);
			});
		});

		context('settings.async.fitness is not set', function() {
			it('returns instance after invoking #setFitnessesSync', function() {
				settings.async = {};

				let result = population.setFitnesses();

				expect(population.setFitnessesSync).to.be.calledOnce;
				expect(population.setFitnessesSync).to.be.calledOn(population);
				expect(result).to.equal(population);
			});
		});

		context('settings.async.fitness is set', function() {
			it('resolves with instance after invoking #setFitnessesAsync', function() {
				settings.async = { fitness: 1 };

				return population.setFitnesses()
					.then((result) => {
						expect(population.setFitnessesAsync).to.be.calledOnce;
						expect(population.setFitnessesAsync).to.be.calledOn(
							population
						);
						expect(result).to.equal(population);
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
		it('returns instance after setting fitness on each individual', function() {
			let foo = new TestIndividual('foo');
			let bar = new TestIndividual('bar');
			let population = new Population([ foo, bar ]);
			sinon.stub(foo, 'setFitnessSync');
			sinon.stub(bar, 'setFitnessSync');

			let result = population.setFitnessesSync();

			expect(foo.setFitnessSync).to.be.calledOnce;
			expect(foo.setFitnessSync).to.be.calledOn(foo);
			expect(bar.setFitnessSync).to.be.calledOnce;
			expect(bar.setFitnessSync).to.be.calledOn(bar);
			expect(result).to.equal(population);
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

		it('resolves with instance after asynchronously iterating over each individual', function() {
			return population.setFitnessesAsync()
				.then((result) => {
					expect(pasync.eachLimit).to.be.calledOnce;
					expect(pasync.eachLimit).to.be.calledOn(pasync);
					expect(pasync.eachLimit).to.be.calledWith(
						individuals,
						settings.async.fitness,
						sinon.match.func
					);
					expect(result).to.equal(population);

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

		context('settings.async.mutate is not set', function() {
			it('returns result of #mutateSync', function() {
				settings.async = {};

				let result = population.mutate();

				expect(population.mutateSync).to.be.calledOnce;
				expect(population.mutateSync).to.be.calledOn(population);
				expect(result).to.equal(mutants);
			});
		});

		context('settings.async.mutate is set', function() {
			it('resolves with result of #mutateAsync', function() {
				settings.async = { mutate: 1 };

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
		let foo, bar, fooPrime, barPrime, settings, population;

		beforeEach(function() {
			foo = new TestIndividual('foo');
			bar = new TestIndividual('bar');
			fooPrime = new TestIndividual('foo-prime');
			barPrime = new TestIndividual('bar-prime');
			settings = { mutationRate: 0.01 };
			population = new Population([ foo, bar ], settings);

			sinon.stub(foo, 'mutateSync').returns(fooPrime);
			sinon.stub(bar, 'mutateSync').returns(barPrime);
		});

		it('maps individuals to a new population using Individual#mutate', function() {
			let result = population.mutateSync();

			expect(foo.mutateSync).to.be.calledOnce;
			expect(foo.mutateSync).to.be.calledOn(foo);
			expect(foo.mutateSync).to.be.calledWith(settings.mutationRate);
			expect(bar.mutateSync).to.be.calledOnce;
			expect(bar.mutateSync).to.be.calledOn(bar);
			expect(bar.mutateSync).to.be.calledWith(settings.mutationRate);
			expect(result).to.be.an.instanceof(Population);
			expect(result.individuals).to.deep.equal([ fooPrime, barPrime ]);
			expect(result.settings).to.equal(settings);
		});

		it('returns instance if mutation rate is zero', function() {
			settings.mutationRate = 0;

			let result = population.mutateSync();

			expect(foo.mutateSync).to.not.be.called;
			expect(bar.mutateSync).to.not.be.called;
			expect(result).to.equal(population);
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
			settings = { mutationRate: 0.1, async: { mutate: 4 } };
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
						settings.async.mutate,
						sinon.match.func
					);
					expect(result).to.be.an.instanceof(Population);
					expect(result.individuals).to.equal(mutants);
					expect(result.settings).to.equal(settings);
				});
		});

		it('resolves with instance if mutation rate is zero', function() {
			settings.mutationRate = 0;

			return population.mutateAsync()
				.then((result) => {
					expect(pasync.mapLimit).to.not.be.called;
					expect(result).to.equal(population);
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
});
