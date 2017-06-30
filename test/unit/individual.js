const Individual = require('../../lib/individual');
const sinon = require('sinon');
const XError = require('xerror');

describe('Individual', function() {
	describe('#calculateFitnessScore', function() {
		it('throws unsupported operation error', function() {
			let individual = new Individual();

			expect(() => individual.calculateFitnessScore())
				.to.throw(XError)
				.with.property('code')
				.that.equals(XError.UNSUPPORTED_OPERATION);
		});
	});

	describe('#getFitnessScore', function() {
		let individual;

		beforeEach(function() {
			individual = new Individual();
			sinon.stub(individual, 'calculateFitnessScore').returns(42);
		});

		it('returns result of #calculateFitnessScore', function() {
			let result = individual.getFitnessScore();

			expect(individual.calculateFitnessScore).to.be.calledOnce;
			expect(individual.calculateFitnessScore).to.be.calledOn(individual);
			expect(result).to.equal(42);
		});

		it('caches nonzero result', function() {
			individual.getFitnessScore();
			individual.calculateFitnessScore.resetHistory();

			let result = individual.getFitnessScore();

			expect(individual.calculateFitnessScore).to.not.be.called;
			expect(result).to.equal(42);
		});

		it('caches zero result', function() {
			individual.calculateFitnessScore.returns(0);
			individual.getFitnessScore();
			individual.calculateFitnessScore.resetHistory();

			let result = individual.getFitnessScore();

			expect(individual.calculateFitnessScore).to.not.be.called;
			expect(result).to.equal(0);
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
