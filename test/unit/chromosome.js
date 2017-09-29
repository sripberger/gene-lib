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
				.to.throw(XError).that.satisfies((err) => {
					expect(err.code).to.equal(XError.UNSUPPORTED_OPERATION);
					expect(err.message).to.equal(
						'Chromosome ::create method not implemented. ' +
						'Override it, or replace your chromosomeClass ' +
						'setting with a createChromosome setting.'
					);
					return true;
				});
		});
	});

	describe('#getFitness', function() {
		it('throws unsupported operation error', function() {
			let chromosome = new Chromosome();

			expect(() => chromosome.getFitness())
				.to.throw(XError).that.satisfies((err) => {
					expect(err.code).to.equal(XError.UNSUPPORTED_OPERATION);
					expect(err.message).to.equal(
						'Chromsome subclasses must override #getFitness'
					);
					return true;
				});
		});
	});

	describe('#crossover', function() {
		it('throws unsupported operation error', function() {
			let chromosome = new Chromosome();

			expect(() => chromosome.crossover())
				.to.throw(XError).that.satisfies((err) => {
					expect(err.code).to.equal(XError.UNSUPPORTED_OPERATION);
					expect(err.message).to.equal(
						'Chromsome subclasses must override #crossover if ' +
						'there is a nonzero crossover rate.'
					);
					return true;
				});
		});
	});

	describe('#mutate', function() {
		it('throws unsupported operation error', function() {
			let chromosome = new Chromosome();

			expect(() => chromosome.mutate())
				.to.throw(XError).that.satisfies((err) => {
					expect(err.code).to.equal(XError.UNSUPPORTED_OPERATION);
					expect(err.message).to.equal(
						'Chromsome subclasses must override #mutate if ' +
						'there is a nonzero mutation rate.'
					);
					return true;
				});
		});
	});
});
