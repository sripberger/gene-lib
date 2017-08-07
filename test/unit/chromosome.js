const Chromosome = require('../../lib/chromosome');
const TestChromosome = require('../lib/test-chromosome');
const sinon = require('sinon');
const XError = require('xerror');

describe('Chromosome', function() {
	describe('::create', function() {
		it('throws unsupported operation error', function() {
			expect(() => Chromosome.create())
				.to.throw(XError)
				.with.property('code')
				.that.equals(XError.UNSUPPORTED_OPERATION);
		});
	});

	describe('#calculateFitness', function() {
		it('throws unsupported operation error', function() {
			let chromosome = new Chromosome();

			expect(() => chromosome.calculateFitness())
				.to.throw(XError)
				.with.property('code')
				.that.equals(XError.UNSUPPORTED_OPERATION);
		});
	});

	describe('#getFitness', function() {
		let chromosome;

		beforeEach(function() {
			chromosome = new Chromosome();
			sinon.stub(chromosome, 'calculateFitness').returns(42);
		});

		it('returns result of #calculateFitness', function() {
			let result = chromosome.getFitness();

			expect(chromosome.calculateFitness).to.be.calledOnce;
			expect(chromosome.calculateFitness).to.be.calledOn(chromosome);
			expect(result).to.equal(42);
		});

		it('caches nonzero result', function() {
			chromosome.getFitness();
			chromosome.calculateFitness.resetHistory();

			let result = chromosome.getFitness();

			expect(chromosome.calculateFitness).to.not.be.called;
			expect(result).to.equal(42);
		});

		it('caches zero result', function() {
			chromosome.calculateFitness.returns(0);
			chromosome.getFitness();
			chromosome.calculateFitness.resetHistory();

			let result = chromosome.getFitness();

			expect(chromosome.calculateFitness).to.not.be.called;
			expect(result).to.equal(0);
		});
	});

	describe('#isSolution', function() {
		let chromosome;

		beforeEach(function() {
			chromosome = new Chromosome();
			sinon.stub(chromosome, 'getFitness');
		});

		it('returns true if fitness is Infinity', function() {
			chromosome.getFitness.returns(Infinity);

			let result = chromosome.isSolution();

			expect(chromosome.getFitness).to.be.calledOnce;
			expect(chromosome.getFitness).to.be.calledOn(chromosome);
			expect(result).to.be.true;
		});

		it('returns false otherwise', function() {
			chromosome.getFitness.returns(42);

			let result = chromosome.isSolution();

			expect(chromosome.getFitness).to.be.calledOnce;
			expect(chromosome.getFitness).to.be.calledOn(chromosome);
			expect(result).to.be.false;
		});
	});


	describe('#crossover', function() {
		it('returns unchanged parents', function() {
			let foo = new TestChromosome('foo');
			let bar = new TestChromosome('bar');

			expect(foo.crossover(bar)).to.deep.equal([ foo, bar ]);
		});
	});

	describe('#mutate', function() {
		it('returns unchanged instance', function() {
			let chromosome = new Chromosome();

			expect(chromosome.mutate()).to.equal(chromosome);
		});
	});
});
