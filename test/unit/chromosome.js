const Chromosome = require('../../lib/chromosome');
const XError = require('xerror');

describe('Chromosome', function() {
	describe('::isChromosome', function() {
		let obj;

		beforeEach(function() {
			obj = {
				getFitness: () => {},
				crossover: () => {},
				mutate: () => {}
			};
		});

		it('returns false if obj.getFitness is not a function', function() {
			obj.getFitness = {};

			expect(Chromosome.isChromosome(obj)).to.be.false;
		});

		it('returns false if obj.crossover is not a function', function() {
			obj.crossover = {};

			expect(Chromosome.isChromosome(obj)).to.be.false;
		});

		it('returns false if obj.mutate is not a function', function() {
			obj.mutate = {};

			expect(Chromosome.isChromosome(obj)).to.be.false;
		});

		it('returns true otherwise', function() {
			expect(Chromosome.isChromosome(obj)).to.be.true;
		});

		it('returns true for Chromosome instances', function() {
			let chromosome = new Chromosome();

			expect(Chromosome.isChromosome(chromosome)).to.be.true;
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
