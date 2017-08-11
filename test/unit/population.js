const Population = require('../../lib/population');
const sinon = require('sinon');
const pasync = require('pasync');
const Selector = require('../../lib/selector');
const TestIndividual = require('../lib/test-individual');

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

	describe('#mutate', function() {
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
			return population.mutate(rate, 4)
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
			return population.mutate(rate)
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
				return population.mutate(rate)
					.then(() => {
						iteratee = pasync.mapLimit.firstCall.args[2];
					});
			});

			it('resolves with result of individual#mutate with rate', function() {
				let [ foo ] = individuals;
				let [ fooPrime ] = mutants;
				sinon.stub(foo, 'mutate').resolves(fooPrime);

				return iteratee(foo)
					.then((result) => {
						expect(foo.mutate).to.be.calledOnce;
						expect(foo.mutate).to.be.calledOn(foo);
						expect(foo.mutate).to.be.calledWith(rate);
						expect(result).to.equal(fooPrime);
					});
			});
		});
	});

	describe('#setFitnesses', function() {
		let individuals, population;

		beforeEach(function() {
			let foo = new TestIndividual('foo');
			let bar = new TestIndividual('bar');

			individuals = [ foo, bar ];
			population = new Population(individuals);

			sandbox.stub(pasync, 'eachLimit').resolves();
		});

		it('resolves after asynchronously iterating over each individual', function() {
			return population.setFitnesses(4)
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
					return population.setFitnesses(4)
						.then(() => {
							throw new Error('Promise should have rejected');
						}, () => {});
				});
		});

		it('uses default concurrency of 1', function() {
			return population.setFitnesses()
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
				return population.setFitnesses()
					.then(() => {
						iteratee = pasync.eachLimit.firstCall.args[2];
					});
			});

			it('resolves after invoking individual#setFitness', function() {
				let [ foo ] = individuals;
				sinon.stub(foo, 'setFitness').resolves();

				return iteratee(foo)
					.then(() => {
						expect(foo.setFitness).to.be.calledOnce;
						expect(foo.setFitness).to.be.calledOn(foo);

						// Test rejection to ensure we aren't resolving early.
						foo.setFitness.rejects();
						return iteratee(foo)
							.then(() => {
								throw new Error('Promise should have rejected');
							}, () => {});
					});
			});
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
			return population.toSelector(Selector, settings, 4)
				.then((result) => {
					expect(pasync.eachLimit).to.be.calledOnce;
					expect(pasync.eachLimit).to.be.calledOn(pasync);
					expect(pasync.eachLimit).to.be.calledWith(
						individuals,
						4,
						sinon.match.func
					);
					expect(result).to.be.an.instanceof(Selector);
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
			return population.toSelector(Selector)
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