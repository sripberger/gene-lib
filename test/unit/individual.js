const Individual = require('../../lib/individual');
const sinon = require('sinon');
const resultSchemas = require('../../lib/result-schemas/chromosome');
const TestChromosome = require('../lib/test-chromosome');
const createSchema = resultSchemas.create;
const fitnessSchema = resultSchemas.getFitness;
const crossoverSchema = resultSchemas.crossover;
const mutateSchema = resultSchemas.mutate;

describe('Individual', function() {
	it('stores provided chromosome', function() {
		let chromosome = new TestChromosome('chromosome');

		let individual = new Individual(chromosome);

		expect(individual.chromosome).to.equal(chromosome);
	});

	describe('::createSync', function() {
		let chromosome, createChromosome;

		beforeEach(function() {
			chromosome = new TestChromosome('chromosome');
			createChromosome = sinon.stub();
			createChromosome.returns(chromosome);
			sandbox.stub(createSchema, 'validateSync').returnsArg(0);
		});

		it('returns validated chromosome from createChromosome as new individual', function() {
			let result = Individual.createSync(
				createChromosome,
				[ 'foo', 'bar' ]
			);

			expect(createChromosome).to.be.calledOnce;
			expect(createChromosome).to.be.calledWith('foo', 'bar');
			expect(createSchema.validateSync).to.be.calledOnce;
			expect(createSchema.validateSync).to.be.calledOn(createSchema);
			expect(createSchema.validateSync).to.be.calledWith(chromosome);
			expect(result).to.be.an.instanceof(Individual);
			expect(result.chromosome).to.equal(chromosome);
		});

		it('defaults to empty createArgs array', function() {
			let result = Individual.createSync(createChromosome);

			expect(createChromosome).to.be.calledOnce;
			expect(createChromosome).to.be.calledWithExactly();
			expect(createSchema.validateSync).to.be.calledOnce;
			expect(createSchema.validateSync).to.be.calledOn(createSchema);
			expect(createSchema.validateSync).to.be.calledWith(chromosome);
			expect(result).to.be.an.instanceof(Individual);
			expect(result.chromosome).to.equal(chromosome);
		});
	});

	describe('::createAsync', function() {
		let chromosome, createPromise, createChromosome;

		beforeEach(function() {
			chromosome = new TestChromosome('chromosome');
			createPromise = Promise.resolve();
			createChromosome = sinon.stub().returns(createPromise);
			sandbox.stub(createSchema, 'validateAsync').resolves(chromosome);
		});

		it('resolves with chromosome from createChromosome as new individual', function() {
			return Individual.createAsync(
				createChromosome,
				[ 'foo', 'bar' ]
			)
				.then((result) => {
					expect(createChromosome).to.be.calledOnce;
					expect(createChromosome).to.be.calledWith('foo', 'bar');
					expect(createSchema.validateAsync).to.be.calledOnce;
					expect(createSchema.validateAsync).to.be.calledOn(
						createSchema
					);
					expect(createSchema.validateAsync).to.be.calledWith(
						sinon.match.same(createPromise)
					);
					expect(result).to.be.an.instanceof(Individual);
					expect(result.chromosome).to.equal(chromosome);
				});
		});

		it('defaults to empty createArgs array', function() {
			return Individual.createAsync(createChromosome)
				.then((result) => {
					expect(createChromosome).to.be.calledOnce;
					expect(createChromosome).to.be.calledWithExactly();
					expect(createSchema.validateAsync).to.be.calledOnce;
					expect(createSchema.validateAsync).to.be.calledOn(
						createSchema
					);
					expect(createSchema.validateAsync).to.be.calledWith(
						sinon.match.same(createPromise)
					);
					expect(result).to.be.an.instanceof(Individual);
					expect(result.chromosome).to.equal(chromosome);
				});
		});
	});

	describe('#setFitnessSync', function() {
		let chromosome, individual;

		beforeEach(function() {
			chromosome = new TestChromosome('chromosome');
			individual = new Individual(chromosome);
			sandbox.stub(chromosome, 'getFitness').returns(42);
			sandbox.stub(fitnessSchema, 'validateSync').returnsArg(0);
		});

		it('sets fitness property to validated result of chromosome#getFitness', function() {
			individual.setFitnessSync();

			expect(chromosome.getFitness).to.be.calledOnce;
			expect(chromosome.getFitness).to.be.calledOn(chromosome);
			expect(fitnessSchema.validateSync).to.be.calledOnce;
			expect(fitnessSchema.validateSync).to.be.calledOn(fitnessSchema);
			expect(fitnessSchema.validateSync).to.be.calledWith(42);
			expect(individual.fitness).to.equal(42);
		});

		it('does not call chromosome#getFitness if fitness is already set', function() {
			individual.fitness = 42;

			individual.setFitnessSync();

			expect(chromosome.getFitness).to.not.be.called;
			expect(fitnessSchema.validateSync).to.not.be.called;
		});

		it('supports zero fitness', function() {
			individual.fitness = 0;

			individual.setFitnessSync();

			expect(chromosome.getFitness).to.not.be.called;
			expect(fitnessSchema.validateSync).to.not.be.called;
		});
	});

	describe('#setFitnessAsync', function() {
		let chromosome, individual, fitnessPromise;

		beforeEach(function() {
			chromosome = new TestChromosome('chromosome');
			individual = new Individual(chromosome);
			fitnessPromise = Promise.resolve();
			sandbox.stub(chromosome, 'getFitness').returns(fitnessPromise);
			sandbox.stub(fitnessSchema, 'validateAsync').resolves(42);
		});

		it('sets fitness property to validated result of chromosome#getFitness', function() {
			return individual.setFitnessAsync()
				.then(() => {
					expect(chromosome.getFitness).to.be.calledOnce;
					expect(chromosome.getFitness).to.be.calledOn(chromosome);
					expect(fitnessSchema.validateAsync).to.be.calledOnce;
					expect(fitnessSchema.validateAsync).to.be.calledOn(
						fitnessSchema
					);
					expect(fitnessSchema.validateAsync).to.be.calledWith(
						sinon.match.same(fitnessPromise)
					);
					expect(individual.fitness).to.equal(42);
				});
		});

		it('does not call chromosome#getFitness if fitness is already set', function() {
			individual.fitness = 42;

			return individual.setFitnessAsync()
				.then(() => {
					expect(chromosome.getFitness).to.not.be.called;
					expect(fitnessSchema.validateAsync).to.not.be.called;
				});

		});

		it('supports zero fitness', function() {
			individual.fitness = 0;

			return individual.setFitnessAsync()
				.then(() => {
					expect(chromosome.getFitness).to.not.be.called;
					expect(fitnessSchema.validateAsync).to.not.be.called;
				});
		});
	});

	describe('#crossoverSync', function() {
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
			sandbox.stub(foo, 'crossover').returns([ fooBar, barFoo ]);
			sandbox.stub(crossoverSchema, 'validateSync').returnsArg(0);
		});

		it('returns validated chromosome#crossover results as new individuals', function() {
			let result = fooIndividual.crossoverSync(
				[ barIndividual, bazIndividual ],
				rate
			);

			expect(foo.crossover).to.be.calledOnce;
			expect(foo.crossover).to.be.calledOn(foo);
			expect(foo.crossover).to.be.calledWith(bar, baz, rate);
			expect(crossoverSchema.validateSync).to.be.calledOnce;
			expect(crossoverSchema.validateSync).to.be.calledOn(
				crossoverSchema
			);
			expect(crossoverSchema.validateSync).to.be.calledWith(
				[ fooBar, barFoo ]
			);
			expect(result).to.be.an.instanceof(Array);
			expect(result).to.have.length(2);
			expect(result[0]).to.be.an.instanceof(Individual);
			expect(result[0].chromosome).to.equal(fooBar);
			expect(result[1]).to.be.an.instanceof(Individual);
			expect(result[1].chromosome).to.equal(barFoo);
		});

		it('supports single-result chromosome#crossover', function() {
			foo.crossover.returns(fooBar);

			let result = fooIndividual.crossoverSync([ barIndividual ], rate);

			expect(foo.crossover).to.be.calledOnce;
			expect(foo.crossover).to.be.calledOn(foo);
			expect(foo.crossover).to.be.calledWith(bar, rate);
			expect(crossoverSchema.validateSync).to.be.calledOnce;
			expect(crossoverSchema.validateSync).to.be.calledOn(
				crossoverSchema
			);
			expect(crossoverSchema.validateSync).to.be.calledWith(fooBar);
			expect(result).to.be.an.instanceof(Array);
			expect(result).to.have.length(1);
			expect(result[0]).to.be.an.instanceof(Individual);
			expect(result[0].chromosome).to.equal(fooBar);
		});
	});

	describe('#crossoverAsync', function() {
		const rate = '0.2';
		let foo, bar, baz, fooBar, barFoo;
		let fooIndividual, barIndividual, bazIndividual;
		let crossoverPromise;

		beforeEach(function() {
			foo = new TestChromosome('foo');
			bar = new TestChromosome('bar');
			baz = new TestChromosome('baz');
			fooBar = new TestChromosome('foo-bar');
			barFoo = new TestChromosome('bar-foo');
			fooIndividual = new Individual(foo);
			barIndividual = new Individual(bar);
			bazIndividual = new Individual(baz);
			crossoverPromise = Promise.resolve();
			sandbox.stub(foo, 'crossover').returns(crossoverPromise);
			sandbox.stub(crossoverSchema, 'validateAsync').resolves([
				fooBar,
				barFoo
			]);
		});

		it('resolves with validated chromosome#crossover results as new individuals', function() {
			return fooIndividual.crossoverAsync(
				[ barIndividual, bazIndividual ],
				rate
			)
				.then((result) => {
					expect(foo.crossover).to.be.calledOnce;
					expect(foo.crossover).to.be.calledOn(foo);
					expect(foo.crossover).to.be.calledWith(bar, baz, rate);
					expect(crossoverSchema.validateAsync).to.be.calledOnce;
					expect(crossoverSchema.validateAsync).to.be.calledOn(
						crossoverSchema
					);
					expect(crossoverSchema.validateAsync).to.be.calledWith(
						sinon.match.same(crossoverPromise)
					);
					expect(result).to.be.an.instanceof(Array);
					expect(result).to.have.length(2);
					expect(result[0]).to.be.an.instanceof(Individual);
					expect(result[0].chromosome).to.equal(fooBar);
					expect(result[1]).to.be.an.instanceof(Individual);
					expect(result[1].chromosome).to.equal(barFoo);
				});
		});

		it('supports single-result chromosome#crossover', function() {
			crossoverSchema.validateAsync.resolves(fooBar);

			return fooIndividual.crossoverAsync([ barIndividual ], rate)
				.then((result) => {
					expect(foo.crossover).to.be.calledOn(foo);
					expect(foo.crossover).to.be.calledWith(bar, rate);
					expect(crossoverSchema.validateAsync).to.be.calledOnce;
					expect(crossoverSchema.validateAsync).to.be.calledOn(
						crossoverSchema
					);
					expect(crossoverSchema.validateAsync).to.be.calledWith(
						sinon.match.same(crossoverPromise)
					);
					expect(result).to.be.an.instanceof(Array);
					expect(result).to.have.length(1);
					expect(result[0]).to.be.an.instanceof(Individual);
					expect(result[0].chromosome).to.equal(fooBar);
				});
		});
	});

	describe('#mutateSync', function() {
		it('returns validated result of chromosome#mutate as new individual', function() {
			let rate = '0.01';
			let foo = new TestChromosome('foo');
			let fooPrime = new TestChromosome('foo-prime');
			let fooIndividual = new Individual(foo);
			sandbox.stub(foo, 'mutate').returns(fooPrime);
			sandbox.stub(mutateSchema, 'validateSync').returnsArg(0);

			let result =  fooIndividual.mutateSync(rate);

			expect(foo.mutate).to.be.calledOnce;
			expect(foo.mutate).to.be.calledOn(foo);
			expect(foo.mutate).to.be.calledWith(rate);
			expect(mutateSchema.validateSync).to.be.calledOnce;
			expect(mutateSchema.validateSync).to.be.calledOn(mutateSchema);
			expect(mutateSchema.validateSync).to.be.calledWith(fooPrime);
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
			let mutatePromise = Promise.resolve();
			sandbox.stub(foo, 'mutate').returns(mutatePromise);
			sandbox.stub(mutateSchema, 'validateAsync').resolves(fooPrime);

			return fooIndividual.mutateAsync(rate)
				.then((result) => {
					expect(foo.mutate).to.be.calledOnce;
					expect(foo.mutate).to.be.calledOn(foo);
					expect(foo.mutate).to.be.calledWith(rate);
					expect(mutateSchema.validateAsync).to.be.calledOnce;
					expect(mutateSchema.validateAsync).to.be.calledOn(
						mutateSchema
					);
					expect(mutateSchema.validateAsync).to.be.calledWith(
						sinon.match.same(mutatePromise)
					);
					expect(result).to.be.an.instanceof(Individual);
					expect(result.chromosome).to.equal(fooPrime);
				});
		});
	});
});
