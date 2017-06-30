const Individual = require('../../lib/individual');
const XError = require('xerror');

describe('Individual', function() {
	describe('#getFitnessScore', function() {
		it('throws unsupported operation error', function() {
			let individual = new Individual();

			expect(() => individual.getFitnessScore())
				.to.throw(XError)
				.with.property('code')
				.that.equals(XError.UNSUPPORTED_OPERATION);
		});
	});

	describe('#isSolution', function() {
		it('throws unsupported operation error', function() {
			let individual = new Individual();

			expect(() => individual.isSolution())
				.to.throw(XError)
				.with.property('code')
				.that.equals(XError.UNSUPPORTED_OPERATION);
		});
	});

	describe('#crossover', function() {
		it('throws unsupported operation error', function() {
			let individual = new Individual();

			expect(() => individual.crossover())
				.to.throw(XError)
				.with.property('code')
				.that.equals(XError.UNSUPPORTED_OPERATION);
		});
	});

	describe('#mutate', function() {
		it('throws unsupported operation error', function() {
			let individual = new Individual();

			expect(() => individual.mutate())
				.to.throw(XError)
				.with.property('code')
				.that.equals(XError.UNSUPPORTED_OPERATION);
		});
	});
});
