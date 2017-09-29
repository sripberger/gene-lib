const CachingChromosome = require('../../lib/caching-chromosome');
const XError = require('xerror');
const Chromosome = require('../../lib/chromosome');

describe('CachingChromosome', function() {
	it('extends Chromosome', function() {
		let chromosome = new CachingChromosome();

		expect(chromosome).to.be.an.instanceof(Chromosome);
	});

	describe('#calculateFitness', function() {
		it('throws unsupported operation with message', function() {
			let chromosome = new CachingChromosome();

			expect(() => chromosome.calculateFitness())
				.to.throw(XError).that.satisfies((err) => {
					expect(err.code).to.equal(XError.UNSUPPORTED_OPERATION);
					expect(err.message).to.equal(
						'CachingChromosome subclasses must override ' +
						'#calculateFitness.'
					);
					return true;
				});
		});
	});

	describe('#getFitness', function() {
		let chromosome;

		beforeEach(function() {
			chromosome = new CachingChromosome();
			sandbox.stub(chromosome, 'calculateFitness').returns(42);
		});

		it('returns result of #calculateFitness', function() {
			let result = chromosome.getFitness();

			expect(chromosome.calculateFitness).to.be.calledOnce;
			expect(chromosome.calculateFitness).to.be.calledOn(chromosome);
			expect(result).to.equal(42);
		});

		it('caches nonzero numeric result', function() {
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

		it('caches promise result', function() {
			chromosome.calculateFitness.resolves(42);
			chromosome.getFitness();
			chromosome.calculateFitness.resetHistory();

			return chromosome.getFitness()
				.then((result) => {
					expect(chromosome.calculateFitness).to.not.be.called;
					expect(result).to.equal(42);
				});
		});
	});
});
