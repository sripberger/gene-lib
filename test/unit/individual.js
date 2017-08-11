const Individual = require('../../lib/individual');
const sinon = require('sinon');
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

	describe('#isSolution', function() {
		const isSolutionResult = 'is solution?';
		let chromosome, individual;

		beforeEach(function() {
			chromosome = new TestChromosome('chromosome');
			individual = new Individual(chromosome);
			sinon.stub(chromosome, 'isSolution').resolves(isSolutionResult);
		});

		it('resolves with result of chromosome#isSolution', function() {
			return individual.isSolution()
				.then((result) => {
					expect(chromosome.isSolution).to.be.calledOnce;
					expect(chromosome.isSolution).to.be.calledOn(chromosome);
					expect(result).to.equal(isSolutionResult);
				});
		});

		it('supports synchronous chromosome#isSolution', function() {
			chromosome.isSolution.returns(isSolutionResult);

			return individual.isSolution()
				.then((result) => {
					expect(result).to.equal(isSolutionResult);
				});
		});
	});

	describe('#crossover', function() {
		const rate = '0.2';
		let foo, bar, baz, fooBar, barFoo, fooIndividual, barIndividual, bazIndividual;

		beforeEach(function() {
			foo = new TestChromosome('foo');
			bar = new TestChromosome('bar');
			baz = new TestChromosome('baz');
			fooBar = new TestChromosome('foo-bar');
			barFoo = new TestChromosome('bar-foo');
			fooIndividual = new Individual(foo);
			barIndividual = new Individual(bar);
			bazIndividual = new Individual(baz);

			sinon.stub(foo, 'crossover').resolves([ fooBar, barFoo ]);
		});

		it('resolves with chromosome crossover results as new individuals', function() {
			return fooIndividual.crossover([ barIndividual ], rate)
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

		it('supports more than two parents', function() {
			return fooIndividual.crossover([ barIndividual, bazIndividual ], rate)
				.then((result) => {
					expect(foo.crossover).to.be.calledOnce;
					expect(foo.crossover).to.be.calledOn(foo);
					expect(foo.crossover).to.be.calledWith(bar, baz, rate);
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

			return fooIndividual.crossover([ barIndividual ], rate)
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

			return fooIndividual.crossover([ barIndividual ], rate)
				.then((result) => {
					expect(result).to.be.an.instanceof(Array);
					expect(result).to.have.length(1);
					expect(result[0]).to.be.an.instanceof(Individual);
					expect(result[0].chromosome).to.equal(fooBar);
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
