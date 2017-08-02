const TournamentSelector = require('../../lib/tournament-selector');
const ArraySelector = require('../../lib/array-selector');
const sinon = require('sinon');
const _ = require('lodash');
const TestIndividual = require('../lib/test-individual');

describe('TournamentSelector', function() {
	it('extends ArraySelector', function() {
		let selector = new TournamentSelector();

		expect(selector).to.be.an.instanceof(ArraySelector);
		expect(selector.settings).to.deep.equal({});
	});

	it('supports settings argument', function() {
		let settings = { foo: 'bar' };

		let selector = new TournamentSelector(settings);

		expect(selector.settings).to.equal(settings);
	});

	describe('::getWeights', function() {
		it('returns selection weights for a tournament', function() {
			expect(TournamentSelector.getWeights(0.75, 1)).to.deep.equal([
				1
			]);
			expect(TournamentSelector.getWeights(0.75, 2)).to.deep.equal([
				0.75,
				0.25
			]);
			expect(TournamentSelector.getWeights(0.75, 3)).to.deep.equal([
				0.75,
				0.1875,
				0.0625
			]);
			expect(TournamentSelector.getWeights(0.75, 4)).to.deep.equal([
				0.75,
				0.1875,
				0.046875,
				0.015625
			]);
		});
	});

	describe('#getTournament', function() {
		let selector, sample;

		beforeEach(function() {
			let foo = new TestIndividual('foo');
			let bar = new TestIndividual('bar');
			let baz = new TestIndividual('baz');

			selector = new TournamentSelector();
			sample = [ foo, bar ];

			selector.add(foo, bar, baz );
			sinon.stub(_, 'sampleSize').returns(sample);
		});

		afterEach(function() {
			_.sampleSize.restore();
		});

		it('returns a random subset of settings.tournamentSize', function() {
			selector.settings.tournamentSize = 1;

			let result = selector.getTournament();

			expect(_.sampleSize).to.be.calledOnce;
			expect(_.sampleSize).to.be.calledOn(_);
			expect(_.sampleSize).to.be.calledWith(
				selector.individuals,
				selector.settings.tournamentSize
			);
			expect(result).to.equal(sample);
		});

		it('defaults to sample size of 2', function() {
			let result = selector.getTournament();

			expect(_.sampleSize).to.be.calledOnce;
			expect(_.sampleSize).to.be.calledOn(_);
			expect(_.sampleSize).to.be.calledWith(selector.individuals, 2);
			expect(result).to.equal(sample);
		});
	});

	describe('#getSortedTournament', function() {
		it('returns result of #getTournament sorted by fitness descending', function() {
			let selector = new TournamentSelector();
			let foo = new TestIndividual('foo');
			let bar = new TestIndividual('bar');
			let baz = new TestIndividual('baz');
			sinon.stub(foo, 'getFitnessScore').returns(8);
			sinon.stub(bar, 'getFitnessScore').returns(10);
			sinon.stub(baz, 'getFitnessScore').returns(9);
			sinon.stub(selector, 'getTournament').returns([ foo, bar, baz ]);

			let result = selector.getSortedTournament();

			expect(selector.getTournament).to.be.calledOnce;
			expect(selector.getTournament).to.be.calledOn(selector);
			expect(foo.getFitnessScore).to.be.called;
			expect(foo.getFitnessScore).to.always.be.calledOn(foo);
			expect(bar.getFitnessScore).to.be.called;
			expect(bar.getFitnessScore).to.always.be.calledOn(bar);
			expect(baz.getFitnessScore).to.be.called;
			expect(baz.getFitnessScore).to.always.be.calledOn(baz);
			expect(result).to.deep.equal([ bar, baz, foo ]);
		});
	});

	describe('#select', function() {
		let selector;

		beforeEach(function() {
			selector = new TournamentSelector();
			sinon.stub(selector, 'getTournament');
		});

		it('returns highest-scoring individual from tournament', function() {
			let foo = new TestIndividual('foo');
			let bar = new TestIndividual('bar');
			let baz = new TestIndividual('baz');
			sinon.stub(foo, 'getFitnessScore').returns(8);
			sinon.stub(bar, 'getFitnessScore').returns(10);
			sinon.stub(baz, 'getFitnessScore').returns(9);
			selector.getTournament.returns([ foo, bar, baz ]);

			let result = selector.select();

			expect(selector.getTournament).to.be.calledOnce;
			expect(selector.getTournament).to.be.calledOn(selector);
			expect(foo.getFitnessScore).to.be.called;
			expect(foo.getFitnessScore).to.always.be.calledOn(foo);
			expect(bar.getFitnessScore).to.be.called;
			expect(bar.getFitnessScore).to.always.be.calledOn(bar);
			expect(baz.getFitnessScore).to.be.called;
			expect(baz.getFitnessScore).to.always.be.calledOn(baz);
			expect(result).to.equal(bar);
		});

		it('returns null if selector is empty', function() {
			selector.getTournament.returns([]);

			expect(selector.select()).to.be.null;
		});
	});
});
