const TournamentSelector = require('../../lib/tournament-selector');
const ArraySelector = require('../../lib/array-selector');
const sinon = require('sinon');
const _ = require('lodash');
const TestChromosome = require('../lib/test-chromosome');

describe('TournamentSelector', function() {
	let sandbox;

	beforeEach(function() {
		sandbox = sinon.sandbox.create();
	});

	afterEach(function() {
		sandbox.restore();
	});

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
			let foo = new TestChromosome('foo');
			let bar = new TestChromosome('bar');
			let baz = new TestChromosome('baz');

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
				selector.chromosomes,
				selector.settings.tournamentSize
			);
			expect(result).to.equal(sample);
		});

		it('defaults to sample size of 2', function() {
			let result = selector.getTournament();

			expect(_.sampleSize).to.be.calledOnce;
			expect(_.sampleSize).to.be.calledOn(_);
			expect(_.sampleSize).to.be.calledWith(selector.chromosomes, 2);
			expect(result).to.equal(sample);
		});
	});

	describe('#getSortedTournament', function() {
		it('returns result of #getTournament sorted by fitness descending', function() {
			let selector = new TournamentSelector();
			let foo = new TestChromosome('foo');
			let bar = new TestChromosome('bar');
			let baz = new TestChromosome('baz');
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

	describe('#selectDeterministic', function() {
		let selector;

		beforeEach(function() {
			selector = new TournamentSelector();
			sinon.stub(selector, 'getTournament');
		});

		it('returns highest-scoring chromosome from tournament', function() {
			let foo = new TestChromosome('foo');
			let bar = new TestChromosome('bar');
			let baz = new TestChromosome('baz');
			sinon.stub(foo, 'getFitnessScore').returns(8);
			sinon.stub(bar, 'getFitnessScore').returns(10);
			sinon.stub(baz, 'getFitnessScore').returns(9);
			selector.getTournament.returns([ foo, bar, baz ]);

			let result = selector.selectDeterministic();

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

			expect(selector.selectDeterministic()).to.be.null;
		});
	});

	describe('#selectWeighted', function() {
		let selector, foo, bar, baz;

		beforeEach(function() {
			selector = new TournamentSelector();
			foo = new TestChromosome('foo');
			bar = new TestChromosome('bar');
			baz = new TestChromosome('baz');
			sinon.stub(selector, 'getSortedTournament').returns([
				foo,
				bar,
				baz
			]);
			sandbox.stub(TournamentSelector, 'getWeights').returns([
				0.5,
				0.3,
				0.2
			]);
			sandbox.stub(Math, 'random');
		});

		it('gets a sorted tournament, weights, and a random float in [0,1)', function() {
			selector.settings.baseWeight = 0.5;

			selector.selectWeighted();

			expect(selector.getSortedTournament).to.be.calledOnce;
			expect(selector.getSortedTournament).to.be.calledOn(selector);
			expect(TournamentSelector.getWeights).to.be.calledOnce;
			expect(TournamentSelector.getWeights).to.be.calledOn(TournamentSelector);
			expect(TournamentSelector.getWeights).to.be.calledWith(0.5, 3);
			expect(Math.random).to.be.calledOnce;
			expect(Math.random).to.be.calledOn(Math);
		});

		it('uses default baseWeight of 1', function() {
			selector.selectWeighted();

			expect(TournamentSelector.getWeights).to.be.calledOnce;
			expect(TournamentSelector.getWeights).to.be.calledOn(TournamentSelector);
			expect(TournamentSelector.getWeights).to.be.calledWith(1, 3);
		});

		it('returns chromosome based on weights and random', function() {
			Math.random
				.onCall(0).returns(0.49)
				.onCall(1).returns(0.5)
				.onCall(2).returns(0.79)
				.onCall(3).returns(0.8);

			expect(selector.selectWeighted()).to.equal(foo);
			expect(selector.selectWeighted()).to.equal(bar);
			expect(selector.selectWeighted()).to.equal(bar);
			expect(selector.selectWeighted()).to.equal(baz);
		});

		it('returns null if selector is empty', function() {
			selector.getSortedTournament.returns([]);
			TournamentSelector.getWeights.returns([]);

			expect(selector.selectWeighted()).to.be.null;
		});
	});

	describe('#select', function() {
		let selector, foo, bar;

		beforeEach(function() {
			selector = new TournamentSelector();
			foo = new TestChromosome('foo');
			bar = new TestChromosome('bar');

			sinon.stub(selector, 'selectDeterministic').returns(foo);
			sinon.stub(selector, 'selectWeighted').returns(bar);
		});

		context('baseWeight not set', function() {
			it('returns result of #selectDeterministic', function() {
				let result = selector.select();

				expect(selector.selectDeterministic).to.be.calledOnce;
				expect(selector.selectDeterministic).to.be.calledOn(selector);
				expect(result).to.equal(foo);
			});
		});

		context('baseWeight is 1', function() {
			it('returns result of #selectDeterministic', function() {
				selector.settings.baseWeight = 1;

				let result = selector.select();

				expect(selector.selectDeterministic).to.be.calledOnce;
				expect(selector.selectDeterministic).to.be.calledOn(selector);
				expect(result).to.equal(foo);
			});
		});

		context('baseWeight is not 1', function() {
			it('returns result of #selectWeighted', function() {
				selector.settings.baseWeight = 0.75;

				let result = selector.select();

				expect(selector.selectWeighted).to.be.calledOnce;
				expect(selector.selectWeighted).to.be.calledOn(selector);
				expect(result).to.equal(bar);
			});
		});
	});
});
