const Chromosome = require('../../lib/chromosome');
const XError = require('xerror');

describe('Chromosome', function() {
	describe('::isChromosome', function() {
		it('returns true if obj.getFitness a function', function() {
			let obj = { getFitness: {} };
			let otherObj = { getFitness: () => {} };

			expect(Chromosome.isChromosome(obj)).to.be.false;
			expect(Chromosome.isChromosome(otherObj)).to.be.true;
		});
	});

	describe('::create', function() {
		it('throws unsupported operation error', function() {
			expect(() => Chromosome.create())
				.to.throw(XError)
				.with.property('code')
				.that.equals(XError.UNSUPPORTED_OPERATION);
		});
	});

	describe('#getFitness', function() {
		it('throws unsupported operation error', function() {
			let chromosome = new Chromosome();

			expect(() => chromosome.getFitness())
				.to.throw(XError)
				.with.property('code')
				.that.equals(XError.UNSUPPORTED_OPERATION);
		});
	});

	describe('#crossover', function() {
		it('throws unsupported operation error', function() {
			let chromosome = new Chromosome();

			expect(() => chromosome.crossover())
				.to.throw(XError)
				.with.property('code')
				.that.equals(XError.UNSUPPORTED_OPERATION);
		});
	});

	describe('#mutate', function() {
		it('throws unsupported operation error', function() {
			let chromosome = new Chromosome();

			expect(() => chromosome.mutate())
				.to.throw(XError)
				.with.property('code')
				.that.equals(XError.UNSUPPORTED_OPERATION);
		});
	});
});
