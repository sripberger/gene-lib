const Chromosome = require('../../lib/chromosome');
const XError = require('xerror');

describe('Chromosome', function() {
	describe('::isChromosome', function() {
		it('returns true if obj.getFitness is a function', function() {
			expect(Chromosome.isChromosome({
				getFitness: () => {}
			})).to.be.true;
		});

		it('returns false otherwise', function() {
			expect(Chromosome.isChromosome({})).to.be.false;
			expect(Chromosome.isChromosome({ getFitness: 'foo' })).to.be.false;
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
