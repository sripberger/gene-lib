const BreedingScheme = require('../../lib/breeding-scheme');
const sinon = require('sinon');
const _ = require('lodash');
const pasync = require('pasync');
const Population = require('../../lib/population');
const TestIndividual = require('../lib/test-individual');

describe('BreedingScheme', function() {
	let sandbox;

	beforeEach(function() {
		sandbox = sinon.sandbox.create();
	});

	afterEach(function() {
		sandbox.restore();
	});

	it('stores provided crossovers, copies, and settings', function() {
		let individuals = _.times(6, (i) => new TestIndividual(i));
		let crossovers = [
			[ individuals[0], individuals[1] ],
			[ individuals[2], individuals[3] ]
		];
		let copies = [ individuals[4], individuals[5] ];
		let settings = { foo: 'bar' };

		let scheme = new BreedingScheme(crossovers, copies, settings);

		expect(scheme.crossovers).to.equal(crossovers);
		expect(scheme.copies).to.equal(copies);
		expect(scheme.settings).to.equal(settings);
	});

	it('defaults to empty arrays and settings object', function() {
		let scheme = new BreedingScheme();

		expect(scheme.crossovers).to.deep.equal([]);
		expect(scheme.copies).to.deep.equal([]);
		expect(scheme.settings).to.deep.equal({});
	});

	describe('#performCrossovers', function() {
		let scheme, population;

		beforeEach(function() {
			scheme = new BreedingScheme();
			population = new Population();

			sinon.stub(scheme, 'performCrossoversSync').returns(population);
			sinon.stub(scheme, 'performCrossoversAsync').resolves(population);
		});

		context('settings.async is not set', function() {
			it('returns result of #performCrossoversSync', function() {
				let result = scheme.performCrossovers();

				expect(scheme.performCrossoversSync).to.be.calledOnce;
				expect(scheme.performCrossoversSync).to.be.calledOn(scheme);
				expect(result).to.equal(population);
			});
		});

		context('settings.async.crossover is not set', function() {
			it('returns result of #performCrossoversSync', function() {
				scheme.settings.async = {};

				let result = scheme.performCrossovers();

				expect(scheme.performCrossoversSync).to.be.calledOnce;
				expect(scheme.performCrossoversSync).to.be.calledOn(scheme);
				expect(result).to.equal(population);
			});
		});

		context('settings.async.crossover is set', function() {
			it('resolves with result of #performCrossoversAsync', function() {
				scheme.settings.async = { crossover: 1 };

				return scheme.performCrossovers()
					.then((result) => {
						expect(scheme.performCrossoversAsync).to.be.calledOnce;
						expect(scheme.performCrossoversAsync).to.be.calledOn(scheme);
						expect(result).to.equal(population);
					});
			});
		});
	});

	describe('#performCrossoversSync', function() {
		it('combines all crossover and copy results into one population', function() {
			let individuals = _.times(12, (i) => new TestIndividual(i));
			let crossovers = [
				[ individuals[0], individuals[1], individuals[2] ],
				[ individuals[3], individuals[4], individuals[5] ]
			];
			let copies = [ individuals[6], individuals[7] ];
			let scheme = new BreedingScheme(crossovers, copies, {
				crossoverRate: 0.3
			});
			sinon.stub(individuals[0], 'crossoverSync').returns([
				individuals[8],
				individuals[9]
			]);
			sinon.stub(individuals[3], 'crossoverSync').returns([
				individuals[10],
				individuals[11]
			]);

			let result = scheme.performCrossoversSync();

			expect(individuals[0].crossoverSync).to.be.calledOnce;
			expect(individuals[0].crossoverSync).to.be.calledOn(individuals[0]);
			expect(individuals[0].crossoverSync).to.be.calledWith(
				[ individuals[1], individuals[2] ],
				scheme.settings.crossoverRate
			);
			expect(individuals[3].crossoverSync).to.be.calledOnce;
			expect(individuals[3].crossoverSync).to.be.calledOn(individuals[3]);
			expect(individuals[3].crossoverSync).to.be.calledWith(
				[ individuals[4], individuals[5] ],
				scheme.settings.crossoverRate
			);
			expect(result).to.be.an.instanceof(Population);
			expect(result.individuals).to.deep.equal([
				individuals[6],
				individuals[7],
				individuals[8],
				individuals[9],
				individuals[10],
				individuals[11]
			]);
			expect(result.settings).to.equal(scheme.settings);
		});
	});

	describe('::performCrossoversAsync', function() {
		let individuals, crossovers, copies, scheme;

		beforeEach(function() {
			individuals = _.times(12, (i) => new TestIndividual(i));
			crossovers = [
				[ individuals[0], individuals[1], individuals[2] ],
				[ individuals[3], individuals[4], individuals[5] ]
			];
			copies = [ individuals[6], individuals[7] ];
			scheme = new BreedingScheme(crossovers, copies, {
				crossoverRate: 0.3,
				async: { crossover: 4 }
			});

			sandbox.stub(pasync, 'mapLimit').resolves([
				[ individuals[8], individuals[9] ],
				[ individuals[10], individuals[11] ]
			]);
		});

		it('combines all crossover and copy results into one population', function() {
			return scheme.performCrossoversAsync()
				.then((result) => {
					expect(pasync.mapLimit).to.be.calledOnce;
					expect(pasync.mapLimit).to.be.calledOn(pasync);
					expect(pasync.mapLimit).to.be.calledWith(
						crossovers,
						4,
						sinon.match.func
					);
					expect(result).to.be.an.instanceof(Population);
					expect(result.individuals).to.deep.equal([
						individuals[6],
						individuals[7],
						individuals[8],
						individuals[9],
						individuals[10],
						individuals[11]
					]);
					expect(result.settings).to.equal(scheme.settings);
				});
		});

		describe('iteratee', function () {
			let iteratee;

			beforeEach(function() {
				return scheme.performCrossoversAsync()
					.then(() => {
						iteratee = pasync.mapLimit.firstCall.args[2];
					});
			});

			it('resolves with result of Individual#crossoverAsync', function() {
				let foo = new TestIndividual('foo');
				let bar = new TestIndividual('bar');
				let baz = new TestIndividual('baz');
				let fooBar = new TestIndividual('foo-bar');
				let barFoo = new TestIndividual('bar-foo');
				let crossoverResult = [ fooBar, barFoo ];
				sinon.stub(foo, 'crossoverAsync').resolves(crossoverResult);

				return iteratee([ foo, bar, baz ])
					.then((result) => {
						expect(foo.crossoverAsync).to.be.calledOnce;
						expect(foo.crossoverAsync).to.be.calledOn(foo);
						expect(foo.crossoverAsync).to.be.calledWith(
							[ bar, baz ],
							scheme.settings.crossoverRate
						);
						expect(result).to.equal(crossoverResult);
					});
			});
		});
	});
});
