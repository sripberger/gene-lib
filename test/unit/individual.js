const Individual = require('../../lib/individual');
const sinon = require('sinon');
const utils = require('../../lib/utils');
const TestChromosome = require('../lib/test-chromosome');

describe('Individual', function() {
	let sandbox;

	beforeEach(function() {
		sandbox = sinon.sandbox.create();
	});

	afterEach(function() {
		sandbox.restore();
	});

	it('stores provided chromosome', function() {
		let chromosome = new TestChromosome('chromosome');

		let individual = new Individual(chromosome);

		expect(individual.chromosome).to.equal(chromosome);
	});

	describe('#setFitness', function() {
		let chromosome, individual;

		beforeEach(function() {
			chromosome = new TestChromosome('chromosome');
			individual = new Individual(chromosome);
			sinon.stub(chromosome, 'getFitness');
		});

		it('sets fitness property to result of chromosome#getFitness', function() {
			chromosome.getFitness.resolves(42);

			return individual.setFitness()
				.then(() => {
					expect(individual.fitness).to.equal(42);
				});
		});

		it('supports synchronous chromosome#getFitness', function() {
			chromosome.getFitness.returns(42);

			return individual.setFitness()
				.then(() => {
					expect(individual.fitness).to.equal(42);
				});
		});
	});

	describe('#crossover', function() {
		const rate = '0.2';
		let foo, bar, fooBar, barFoo, fooIndividual, barIndividual;

		beforeEach(function() {
			foo = new TestChromosome('foo');
			bar = new TestChromosome('bar');
			fooBar = new TestChromosome('foo-bar');
			barFoo = new TestChromosome('bar-foo');
			fooIndividual = new Individual(foo);
			barIndividual = new Individual(bar);
			sinon.stub(foo, 'crossover');
		});

		it('resolves with chromosome crossover results as new individuals', function() {
			foo.crossover.resolves([ fooBar, barFoo ]);

			return fooIndividual.crossover(barIndividual, rate)
				.then((result) => {
					expect(foo.crossover).to.be.calledOnce;
					expect(foo.crossover).to.be.calledOn(foo);
					expect(foo.crossover).to.be.calledWith(bar, rate);
					expect(result).to.be.an.instanceof(Array);
					expect(result).to.have.length(2);
					expect(result[0]).to.be.an.instanceof(Individual);
					expect(result[0].chromosome).to.equal(fooBar);
					expect(result[1]).to.be.an.instanceof(Individual);
					expect(result[1].chromosome).to.equal(barFoo);
				});
		});

		it('supports synchronous chromosome#crossover', function() {
			foo.crossover.returns([ fooBar, barFoo ]);

			return fooIndividual.crossover(barIndividual, rate)
				.then((result) => {
					expect(result).to.be.an.instanceof(Array);
					expect(result).to.have.length(2);
					expect(result[0]).to.be.an.instanceof(Individual);
					expect(result[0].chromosome).to.equal(fooBar);
					expect(result[1]).to.be.an.instanceof(Individual);
					expect(result[1].chromosome).to.equal(barFoo);
				});
		});

		it('supports single-result chromosome#crossover', function() {
			foo.crossover.resolves(fooBar);

			return fooIndividual.crossover(barIndividual, rate)
				.then((result) => {
					expect(result).to.be.an.instanceof(Array);
					expect(result).to.have.length(1);
					expect(result[0]).to.be.an.instanceof(Individual);
					expect(result[0].chromosome).to.equal(fooBar);
				});
		});

		it('supports synchronous single-result chromosome#crossover', function() {
			foo.crossover.returns(fooBar);

			return fooIndividual.crossover(barIndividual, rate)
				.then((result) => {
					expect(result).to.be.an.instanceof(Array);
					expect(result).to.have.length(1);
					expect(result[0]).to.be.an.instanceof(Individual);
					expect(result[0].chromosome).to.equal(fooBar);
				});
		});
	});

	describe('#checkedCrossover', function() {
		const rate = 0.7;
		let foo, bar, fooBar, barFoo;

		beforeEach(function() {
			foo = new Individual(new TestChromosome('foo'));
			bar = new Individual(new TestChromosome('bar'));
			fooBar = new Individual(new TestChromosome('foo-bar'));
			barFoo = new Individual(new TestChromosome('bar-foo'));

			sandbox.stub(utils, 'boolChance');
			sinon.stub(foo, 'crossover').resolves([ fooBar, barFoo ]);
		});

		it('calls utils::boolChance with rate', function() {
			return foo.checkedCrossover(bar, rate)
				.then(() => {
					expect(utils.boolChance).to.be.calledOnce;
					expect(utils.boolChance).to.be.calledOn(utils);
					expect(utils.boolChance).to.be.calledWith(rate);
				});
		});

		context('utils::boolChance returns true', function() {
			it('resolves with crossover of instance and other', function() {
				utils.boolChance.returns(true);

				return foo.checkedCrossover(bar, rate)
					.then((result) => {
						expect(foo.crossover).to.be.calledOnce;
						expect(foo.crossover).to.be.calledOn(foo);
						expect(foo.crossover).to.be.calledWith(bar, rate);
						expect(result).to.deep.equal([ fooBar, barFoo ]);
					});
			});
		});

		context('utils::boolChance returns false', function() {
			it('resolves with unchanged instance and other', function() {
				utils.boolChance.returns(false);

				return foo.checkedCrossover(bar, rate)
					.then((result) => {
						expect(foo.crossover).to.not.be.called;
						expect(result).to.deep.equal([ foo, bar ]);
					});
			});
		});

		context('compound argument is true', function() {
			it('resolves with crossover without boolChance', function() {
				return foo.checkedCrossover(bar, rate, true)
					.then((result) => {
						expect(utils.boolChance).to.not.be.called;
						expect(foo.crossover).to.be.calledOnce;
						expect(foo.crossover).to.be.calledOn(foo);
						expect(foo.crossover).to.be.calledWith(bar, rate);
						expect(result).to.deep.equal([ fooBar, barFoo ]);
					});
			});
		});
	});

	describe('#mutate', function() {
		const rate = '0.01';
		let foo, fooPrime, fooIndividual;

		beforeEach(function() {
			foo = new TestChromosome('foo');
			fooPrime = new TestChromosome('foo-prime');
			fooIndividual = new Individual(foo);
			sinon.stub(foo, 'mutate');
		});

		it('resolves with result of chromosome#mutate', function() {
			foo.mutate.resolves(fooPrime);

			return fooIndividual.mutate(rate)
				.then((result) => {
					expect(foo.mutate).to.be.calledOnce;
					expect(foo.mutate).to.be.calledOn(foo);
					expect(foo.mutate).to.be.calledWith(rate);
					expect(result).to.be.an.instanceof(Individual);
					expect(result.chromosome).to.equal(fooPrime);
				});
		});

		it('supports synchronous chromosome#mutate', function() {
			foo.mutate.returns(fooPrime);

			return fooIndividual.mutate(rate)
				.then((result) => {
					expect(result).to.be.an.instanceof(Individual);
					expect(result.chromosome).to.equal(fooPrime);
				});
		});
	});
});
