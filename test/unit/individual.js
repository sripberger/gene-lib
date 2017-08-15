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

	describe('::create', function() {
		it('returns chromosome from factory as new individual', function() {
			let factoryArg = 'factory argument';
			let chromosome = new TestChromosome('chromosome');
			let chromosomeFactory = sinon.stub();
			chromosomeFactory.returns(chromosome);

			let result = Individual.create(chromosomeFactory, factoryArg);

			expect(chromosomeFactory).to.be.calledOnce;
			expect(chromosomeFactory).to.be.calledWith(factoryArg);
			expect(result).to.be.an.instanceof(Individual);
			expect(result.chromosome).to.equal(chromosome);
		});
	});

	describe('::createAsync', function() {
		it('resolves with chromosome from async factory as new individual', function() {
			let factoryArg = 'factory argument';
			let chromosome = new TestChromosome('chromosome');
			let chromosomeFactory = sinon.stub();
			chromosomeFactory.resolves(chromosome);

			return Individual.createAsync(chromosomeFactory, factoryArg)
				.then((result) => {
					expect(chromosomeFactory).to.be.calledOnce;
					expect(chromosomeFactory).to.be.calledWith(factoryArg);
					expect(result).to.be.an.instanceof(Individual);
					expect(result.chromosome).to.equal(chromosome);
				});
		});
	});

	describe('#setFitness', function() {
		it('sets fitness property to result of chromosome#getFitness', function() {
			let chromosome = new TestChromosome('chromosome');
			let individual = new Individual(chromosome);
			sinon.stub(chromosome, 'getFitness').returns(42);

			individual.setFitness();

			expect(chromosome.getFitness).to.be.calledOnce;
			expect(chromosome.getFitness).to.be.calledOn(chromosome);
			expect(individual.fitness).to.equal(42);
		});
	});

	describe('#setFitnessAsync', function() {
		it('sets fitness property to async result of chromosome#getFitness', function() {
			let chromosome = new TestChromosome('chromosome');
			let individual = new Individual(chromosome);
			sinon.stub(chromosome, 'getFitness');

			chromosome.getFitness.resolves(42);

			return individual.setFitnessAsync()
				.then(() => {
					expect(chromosome.getFitness).to.be.calledOnce;
					expect(chromosome.getFitness).to.be.calledOn(chromosome);
					expect(individual.fitness).to.equal(42);
				});
		});
	});

	describe('#isSolution', function() {
		it('returns result of chromosome#isSolution', function() {
			let isSolutionResult = 'is solution?';
			let chromosome = new TestChromosome('chromosome');
			let individual = new Individual(chromosome);
			sinon.stub(chromosome, 'isSolution').returns(isSolutionResult);

			let result = individual.isSolution();

			expect(chromosome.isSolution).to.be.calledOnce;
			expect(chromosome.isSolution).to.be.calledOn(chromosome);
			expect(result).to.equal(isSolutionResult);
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

			sinon.stub(foo, 'crossover').returns([ fooBar, barFoo ]);
		});

		it('returns chromosome#crossover results as new individuals', function() {
			let result = fooIndividual.crossover([ barIndividual ], rate);

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

		it('supports more than two parents', function() {
			let result = fooIndividual.crossover(
				[ barIndividual, bazIndividual ],
				rate
			);

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

		it('supports single-result chromosome#crossover', function() {
			foo.crossover.returns(fooBar);

			let result = fooIndividual.crossover([ barIndividual ], rate);

			expect(result).to.be.an.instanceof(Array);
			expect(result).to.have.length(1);
			expect(result[0]).to.be.an.instanceof(Individual);
			expect(result[0].chromosome).to.equal(fooBar);
		});
	});

	describe('#crossoverAsync', function() {
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

		it('resolves with async chromosome#crossover results as new individuals', function() {
			return fooIndividual.crossoverAsync([ barIndividual ], rate)
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
			return fooIndividual.crossoverAsync(
				[ barIndividual, bazIndividual ],
				rate
			)
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

		it('supports single-result chromosome#crossover', function() {
			foo.crossover.resolves(fooBar);

			return fooIndividual.crossoverAsync([ barIndividual ], rate)
				.then((result) => {
					expect(result).to.be.an.instanceof(Array);
					expect(result).to.have.length(1);
					expect(result[0]).to.be.an.instanceof(Individual);
					expect(result[0].chromosome).to.equal(fooBar);
				});
		});
	});

	describe('#mutate', function() {
		it('returns result of chromosome#mutate as new individual', function() {
			let rate = '0.01';
			let foo = new TestChromosome('foo');
			let fooPrime = new TestChromosome('foo-prime');
			let fooIndividual = new Individual(foo);
			sinon.stub(foo, 'mutate').returns(fooPrime);

			let result =  fooIndividual.mutate(rate);

			expect(foo.mutate).to.be.calledOnce;
			expect(foo.mutate).to.be.calledOn(foo);
			expect(foo.mutate).to.be.calledWith(rate);
			expect(result).to.be.an.instanceof(Individual);
			expect(result.chromosome).to.equal(fooPrime);
		});
	});

	describe('#mutateAsync', function() {
		it('resolves with async chromosome#crossover result as new individual', function() {
			let rate = '0.01';
			let foo = new TestChromosome('foo');
			let fooPrime = new TestChromosome('foo-prime');
			let fooIndividual = new Individual(foo);
			sinon.stub(foo, 'mutate').resolves(fooPrime);

			return fooIndividual.mutateAsync(rate)
				.then((result) => {
					expect(foo.mutate).to.be.calledOnce;
					expect(foo.mutate).to.be.calledOn(foo);
					expect(foo.mutate).to.be.calledWith(rate);
					expect(result).to.be.an.instanceof(Individual);
					expect(result.chromosome).to.equal(fooPrime);
				});
		});
	});
});
