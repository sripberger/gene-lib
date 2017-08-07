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

	describe('#calculateFitnessScore', function() {
		it('throws unsupported operation error', function() {
			let chromosome = new Chromosome();

			expect(() => chromosome.calculateFitnessScore())
				.to.throw(XError)
				.with.property('code')
				.that.equals(XError.UNSUPPORTED_OPERATION);
		});
	});

	describe('#getFitnessScore', function() {
		let chromosome;

		beforeEach(function() {
			chromosome = new Chromosome();
			sinon.stub(chromosome, 'calculateFitnessScore').returns(42);
		});

		it('returns result of #calculateFitnessScore', function() {
			let result = chromosome.getFitnessScore();

			expect(chromosome.calculateFitnessScore).to.be.calledOnce;
			expect(chromosome.calculateFitnessScore).to.be.calledOn(chromosome);
			expect(result).to.equal(42);
		});

		it('caches nonzero result', function() {
			chromosome.getFitnessScore();
			chromosome.calculateFitnessScore.resetHistory();

			let result = chromosome.getFitnessScore();

			expect(chromosome.calculateFitnessScore).to.not.be.called;
			expect(result).to.equal(42);
		});

		it('caches zero result', function() {
			chromosome.calculateFitnessScore.returns(0);
			chromosome.getFitnessScore();
			chromosome.calculateFitnessScore.resetHistory();

			let result = chromosome.getFitnessScore();

			expect(chromosome.calculateFitnessScore).to.not.be.called;
			expect(result).to.equal(0);
		});
	});

	describe('#isSolution', function() {
		let chromosome;

		beforeEach(function() {
			chromosome = new Chromosome();
			sinon.stub(chromosome, 'getFitnessScore');
		});

		it('returns true if fitness score is Infinity', function() {
			chromosome.getFitnessScore.returns(Infinity);

			let result = chromosome.isSolution();

			expect(chromosome.getFitnessScore).to.be.calledOnce;
			expect(chromosome.getFitnessScore).to.be.calledOn(chromosome);
			expect(result).to.be.true;
		});

		it('returns false otherwise', function() {
			chromosome.getFitnessScore.returns(42);

			let result = chromosome.isSolution();

			expect(chromosome.getFitnessScore).to.be.calledOnce;
			expect(chromosome.getFitnessScore).to.be.calledOn(chromosome);
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
