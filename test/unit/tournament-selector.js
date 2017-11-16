const TournamentSelector = require('../../lib/tournament-selector');
const ArraySelector = require('../../lib/array-selector');
const _ = require('lodash');
const sinon = require('sinon');
const XError = require('xerror');
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

	describe('::validateSettings', function() {
		let settings;

		function testInvalidSize(size) {
			settings.tournamentSize = size;

			expect(() => TournamentSelector.validateSettings(settings))
				.to.throw(XError).that.satisfies((err) => {
					expect(err.code).to.equal(XError.INVALID_ARGUMENT);
					expect(err.message).to.equal(
						'tournamentSize must be an integer greater than 1.'
					);
					expect(err.data).to.deep.equal({
						tournamentSize: settings.tournamentSize
					});
					return true;
				});
		}

		function testInvalidWeight(weight) {
			settings.baseWeight = weight;

			expect(() => TournamentSelector.validateSettings(settings))
				.to.throw(XError).that.satisfies((err) => {
					expect(err.code).to.equal(XError.INVALID_ARGUMENT);
					expect(err.message).to.equal(
						'baseWeight must be a number in (0.5, 1].'
					);
					expect(err.data).to.deep.equal({
						baseWeight: settings.baseWeight
					});
					return true;
				});
		}

		beforeEach(function() {
			settings = {
				tournamentSize: 3,
				baseWeight: 0.51
			};
		});

		it('does nothing for valid settings', function() {
			TournamentSelector.validateSettings(settings);
		});

		it('throws if tournamentSize is not an integer', function() {
			testInvalidSize(2.5);
		});

		it('throws if tournamentSize is one', function() {
			testInvalidSize(1);
		});

		it('throws if tournamentSize is less than one', function() {
			testInvalidSize(0);
		});

		it('throws if baseWeight is not a number', function() {
			testInvalidWeight('foo');
		});

		it('throws if baseWeight is equal to 0.5', function() {
			testInvalidWeight(0.5);
		});

		it('throws if baseWeight is less than to 0.5', function() {
			testInvalidWeight(0.49);
		});

		it('throws if baseWeight is greater than 1', function() {
			testInvalidWeight(1.01);
		});

		it('allows baseWeight of 1', function() {
			settings.baseWeight = 1;

			TournamentSelector.validateSettings(settings);
		});
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
		it('returns a random subset of settings.tournamentSize', function() {
			let foo = new TestIndividual('foo');
			let bar = new TestIndividual('bar');
			let baz = new TestIndividual('baz');
			let qux = new TestIndividual('qux');
			let selector = new TournamentSelector({ tournamentSize: 3 });
			selector.add(foo, bar, baz, qux);
			sandbox.stub(_, 'sampleSize').returns([ foo, bar, baz ]);

			let result = selector.getTournament();

			expect(_.sampleSize).to.be.calledOnce;
			expect(_.sampleSize).to.be.calledOn(_);
			expect(_.sampleSize).to.be.calledWith(
				selector.individuals,
				selector.settings.tournamentSize
			);
			expect(result).to.deep.equal([ foo, bar, baz ]);
		});
	});

	describe('#getSortedTournament', function() {
		it('returns result of #getTournament sorted by fitness descending', function() {
			let selector = new TournamentSelector();
			let foo = new TestIndividual('foo');
			let bar = new TestIndividual('bar');
			let baz = new TestIndividual('baz');
			foo.fitness = 8;
			bar.fitness = 10;
			baz.fitness = 9;
			sinon.stub(selector, 'getTournament').returns([ foo, bar, baz ]);

			let result = selector.getSortedTournament();

			expect(selector.getTournament).to.be.calledOnce;
			expect(selector.getTournament).to.be.calledOn(selector);
			expect(result).to.deep.equal([ bar, baz, foo ]);
		});
	});

	describe('#selectDeterministic', function() {
		let selector;

		beforeEach(function() {
			selector = new TournamentSelector();
			sinon.stub(selector, 'getTournament');
		});

		it('returns highest-scoring individual from tournament', function() {
			let foo = new TestIndividual('foo');
			let bar = new TestIndividual('bar');
			let baz = new TestIndividual('baz');
			foo.fitness = 8;
			bar.fitness = 10;
			baz.fitness = 9;
			selector.getTournament.returns([ foo, bar, baz ]);

			let result = selector.selectDeterministic();

			expect(selector.getTournament).to.be.calledOnce;
			expect(selector.getTournament).to.be.calledOn(selector);
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
			foo = new TestIndividual('foo');
			bar = new TestIndividual('bar');
			baz = new TestIndividual('baz');
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

		it('returns individual based on weights and random float', function() {
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
			foo = new TestIndividual('foo');
			bar = new TestIndividual('bar');

			sinon.stub(selector, 'selectDeterministic').returns(foo);
			sinon.stub(selector, 'selectWeighted').returns(bar);
		});

		context('settings.baseWeight is 1', function() {
			it('returns result of #selectDeterministic', function() {
				selector.settings.baseWeight = 1;

				let result = selector.select();

				expect(selector.selectDeterministic).to.be.calledOnce;
				expect(selector.selectDeterministic).to.be.calledOn(selector);
				expect(result).to.equal(foo);
			});
		});

		context('settings.baseWeight is not 1', function() {
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
