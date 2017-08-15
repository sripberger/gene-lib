const Population = require('../../lib/population');
const sinon = require('sinon');
const pasync = require('pasync');
const Individual = require('../../lib/individual');
const Selector = require('../../lib/selector');
const TestIndividual = require('../lib/test-individual');
const TestSelector = require('../lib/test-selector');

describe('Population', function() {
	let sandbox;

	beforeEach(function() {
		sandbox = sinon.sandbox.create();
	});

	afterEach(function() {
		sandbox.restore();
	});

	it('stores provided invididuals array', function() {
		let foo = new TestIndividual('foo');
		let bar = new TestIndividual('bar');
		let individuals = [ foo, bar ];

		let population = new Population(individuals);

		expect(population.individuals).to.equal(individuals);
	});

	it('defaults to empty individuals array', function() {
		let population = new Population();

		expect(population.individuals).to.deep.equal([]);
	});

	describe('::create', function() {
		it('creates population using Individual::create', function() {
			let chromosomeFactory = () => {};
			let factoryArg = 'factory argument';
			let foo = new TestIndividual('foo');
			let bar = new TestIndividual('bar');
			sandbox.stub(Individual, 'create')
				.onFirstCall().returns(foo)
				.onSecondCall().returns(bar);

			let result = Population.create(2, chromosomeFactory, factoryArg);

			expect(Individual.create).to.be.calledTwice;
			expect(Individual.create).to.always.be.calledOn(Individual);
			expect(Individual.create).to.always.be.calledWith(
				chromosomeFactory,
				factoryArg
			);
			expect(result).to.be.an.instanceof(Population);
			expect(result.individuals).to.deep.equal([ foo, bar ]);
		});
	});

	describe('::createAsync', function() {
		const size = 2;
		const chromosomeFactory = () => {};
		const factoryArg = 'factory argument';
		let individuals;

		beforeEach(function() {
			let foo = new TestIndividual('foo');
			let bar = new TestIndividual('bar');
			individuals = [ foo, bar ];

			sandbox.stub(pasync, 'timesLimit').resolves(individuals);
		});

		it('creates a population using pasync::timesLimit', function() {
			return Population.createAsync(size, chromosomeFactory, factoryArg, 4)
				.then((result) => {
					expect(pasync.timesLimit).to.be.calledOnce;
					expect(pasync.timesLimit).to.be.calledOn(pasync);
					expect(pasync.timesLimit).to.be.calledWith(
						size,
						4,
						sinon.match.func
					);
					expect(result).to.be.an.instanceof(Population);
					expect(result.individuals).to.equal(individuals);
				});
		});

		it('uses default concurrency of 1', function() {
			return Population.createAsync(size, chromosomeFactory, factoryArg)
				.then(() => {
					expect(pasync.timesLimit).to.be.calledOnce;
					expect(pasync.timesLimit).to.be.calledOn(pasync);
					expect(pasync.timesLimit).to.be.calledWith(
						size,
						1,
						sinon.match.func
					);
				});
		});

		describe('iteratee', function() {
			let iteratee;

			beforeEach(function() {
				return Population.createAsync(size, chromosomeFactory, factoryArg)
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
							chromosomeFactory,
							factoryArg
						);
						expect(result).to.equal(individual);
					});
			});
		});
	});

	describe('#mutate', function() {
		it('maps individuals to a new population using Individual#mutate', function() {
			let foo = new TestIndividual('foo');
			let bar = new TestIndividual('bar');
			let fooPrime = new TestIndividual('foo-prime');
			let barPrime = new TestIndividual('bar-prime');
			let population = new Population([ foo, bar ]);
			let rate = 0.01;
			sinon.stub(foo, 'mutate').returns(fooPrime);
			sinon.stub(bar, 'mutate').returns(barPrime);

			let result = population.mutate(rate);

			expect(foo.mutate).to.be.calledOnce;
			expect(foo.mutate).to.be.calledOn(foo);
			expect(foo.mutate).to.be.calledWith(rate);
			expect(bar.mutate).to.be.calledOnce;
			expect(bar.mutate).to.be.calledOn(bar);
			expect(bar.mutate).to.be.calledWith(rate);
			expect(result).to.be.an.instanceof(Population);
			expect(result.individuals).to.deep.equal([ fooPrime, barPrime ]);
		});
	});

	describe('#mutateAsync', function() {
		const rate = 0.01;
		let individuals, population, mutants;

		beforeEach(function() {
			let foo = new TestIndividual('foo');
			let bar = new TestIndividual('bar');
			let fooPrime = new TestIndividual('foo-prime');
			let barPrime = new TestIndividual('bar-prime');

			individuals = [ foo, bar ];
			population = new Population(individuals);
			mutants = [ fooPrime, barPrime ];

			sandbox.stub(pasync, 'mapLimit').resolves(mutants);
		});

		it('asnychronously maps individuals into a new population', function() {
			return population.mutateAsync(rate, 4)
				.then((result) => {
					expect(pasync.mapLimit).to.be.calledOnce;
					expect(pasync.mapLimit).to.be.calledOn(pasync);
					expect(pasync.mapLimit).to.be.calledWith(
						individuals,
						4,
						sinon.match.func
					);
					expect(result).to.be.an.instanceof(Population);
					expect(result.individuals).to.equal(mutants);
				});
		});

		it('uses default concurrency of 1', function() {
			return population.mutateAsync(rate)
				.then(() => {
					expect(pasync.mapLimit).to.be.calledOnce;
					expect(pasync.mapLimit).to.be.calledOn(pasync);
					expect(pasync.mapLimit).to.be.calledWith(
						individuals,
						1,
						sinon.match.func
					);
				});
		});

		describe('iteratee', function() {
			let iteratee;

			beforeEach(function() {
				return population.mutateAsync(rate)
					.then(() => {
						iteratee = pasync.mapLimit.firstCall.args[2];
					});
			});

			it('resolves with result of individual#mutateAsync with rate', function() {
				let [ foo ] = individuals;
				let [ fooPrime ] = mutants;
				sinon.stub(foo, 'mutateAsync').resolves(fooPrime);

				return iteratee(foo)
					.then((result) => {
						expect(foo.mutateAsync).to.be.calledOnce;
						expect(foo.mutateAsync).to.be.calledOn(foo);
						expect(foo.mutateAsync).to.be.calledWith(rate);
						expect(result).to.equal(fooPrime);
					});
			});
		});
	});

	describe('#setFitnesses', function() {
		it('invokes setFitness on each individual', function() {
			let foo = new TestIndividual('foo');
			let bar = new TestIndividual('bar');
			let population = new Population([ foo, bar ]);
			sinon.stub(foo, 'setFitness');
			sinon.stub(bar, 'setFitness');

			population.setFitnesses();

			expect(foo.setFitness).to.be.calledOnce;
			expect(foo.setFitness).to.be.calledOn(foo);
			expect(bar.setFitness).to.be.calledOnce;
			expect(bar.setFitness).to.be.calledOn(bar);
		});
	});

	describe('#setFitnessesAsync', function() {
		let individuals, population;

		beforeEach(function() {
			let foo = new TestIndividual('foo');
			let bar = new TestIndividual('bar');

			individuals = [ foo, bar ];
			population = new Population(individuals);

			sandbox.stub(pasync, 'eachLimit').resolves();
		});

		it('resolves after asynchronously iterating over each individual', function() {
			return population.setFitnessesAsync(4)
				.then(() => {
					expect(pasync.eachLimit).to.be.calledOnce;
					expect(pasync.eachLimit).to.be.calledOn(pasync);
					expect(pasync.eachLimit).to.be.calledWith(
						individuals,
						4,
						sinon.match.func
					);

					// Test rejection to ensure we aren't resolving early.
					pasync.eachLimit.rejects();
					return population.setFitnessesAsync(4)
						.then(() => {
							throw new Error('Promise should have rejected');
						}, () => {});
				});
		});

		it('uses default concurrency of 1', function() {
			return population.setFitnessesAsync()
				.then(() => {
					expect(pasync.eachLimit).to.be.calledOnce;
					expect(pasync.eachLimit).to.be.calledOn(pasync);
					expect(pasync.eachLimit).to.be.calledWith(
						individuals,
						1,
						sinon.match.func
					);
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

	describe('#toSelector', function() {
		let individuals, population, settings;

		beforeEach(function() {
			let foo = new TestIndividual('foo');
			let bar = new TestIndividual('bar');

			individuals = [ foo, bar ];
			population = new Population(individuals);
			settings = { bar: 'baz' };

			sandbox.stub(pasync, 'eachLimit').resolves();
		});

		it('resolves with Selector instance after asynchronously iterating individuals', function() {
			return population.toSelector(TestSelector, settings, 4)
				.then((result) => {
					expect(pasync.eachLimit).to.be.calledOnce;
					expect(pasync.eachLimit).to.be.calledOn(pasync);
					expect(pasync.eachLimit).to.be.calledWith(
						individuals,
						4,
						sinon.match.func
					);
					expect(result).to.be.an.instanceof(TestSelector);
					expect(result.settings).to.equal(settings);

					// Test rejection to ensure we aren't resolving early.
					pasync.eachLimit.rejects();
					return population.toSelector(Selector, settings, 4)
						.then(() => {
							throw new Error('Promise should have rejected');
						}, () => {});
				});
		});

		it('uses default concurrency of 1', function() {
			return population.toSelector(TestSelector)
				.then(() => {
					expect(pasync.eachLimit).to.be.calledOnce;
					expect(pasync.eachLimit).to.be.calledOn(pasync);
					expect(pasync.eachLimit).to.be.calledWith(
						individuals,
						1,
						sinon.match.func
					);
				});
		});

		describe('iteratee', function() {
			let selector, iteratee;

			beforeEach(function() {
				return population.toSelector(Selector)
					.then((result) => {
						selector = result;
						iteratee = pasync.eachLimit.firstCall.args[2];
					});
			});

			it('resolves after invoking selector#add', function() {
				let [ foo ] = individuals;
				sinon.stub(selector, 'add').resolves();

				return iteratee(foo)
					.then(() => {
						expect(selector.add).to.be.calledOnce;
						expect(selector.add).to.be.calledOn(selector);
						expect(selector.add).to.be.calledWith(foo);

						// Test rejection to ensure we aren't resolving early.
						selector.add.rejects();
						return iteratee(foo)
							.then(() => {
								throw new Error('Promise should have rejected');
							}, () => {});
					});
			});
		});
	});
});
