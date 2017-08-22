const runUtils = require('../../lib/run-utils');
const sinon = require('sinon');
const Runner = require('../../lib/runner');
const settingsUtils = require('../../lib/settings-utils');
const TestChromosome = require('../lib/test-chromosome');
const TestIndividual = require('../lib/test-individual');

describe('runUtils', function() {
	let sandbox;

	beforeEach(function() {
		sandbox = sinon.sandbox.create();
	});

	afterEach(function() {
		sandbox.restore();
	});

	describe('::run', function() {
		let settings, normalizedSettings, best;

		beforeEach(function() {
			settings = { foo: 'bar' };
			normalizedSettings = { baz: 'qux' };
			best = new TestChromosome('best');

			sandbox.stub(settingsUtils, 'normalize').returns(
				normalizedSettings
			);
			sandbox.stub(runUtils, 'runSync').returns(best);
			sandbox.stub(runUtils, 'runAsync').resolves(best);
		});

		it('normalizes provided settings', function() {
			runUtils.run(settings);

			expect(settingsUtils.normalize).to.be.calledOnce;
			expect(settingsUtils.normalize).to.be.calledOn(settingsUtils);
			expect(settingsUtils.normalize).to.be.calledWith(settings);
		});

		context('async setting is not set', function() {
			it('returns result of ::runSync with normalized settings', function() {
				let result = runUtils.run(settings);

				expect(runUtils.runSync).to.be.calledOnce;
				expect(runUtils.runSync).to.be.calledOn(runUtils);
				expect(runUtils.runSync).to.be.calledWith(normalizedSettings);
				expect(result).to.equal(best);
			});
		});

		context('async setting is set', function() {
			it('resolves with result of ::runAsync with normalized settings', function() {
				normalizedSettings.async = {};

				return runUtils.run(settings)
					.then((result) => {
						expect(runUtils.runAsync).to.be.calledOnce;
						expect(runUtils.runAsync).to.be.calledOn(runUtils);
						expect(runUtils.runAsync).to.be.calledWith(
							normalizedSettings
						);
						expect(result).to.equal(best);
					});
			});
		});
	});

	describe('::runSync', function() {
		it('synchronously runs a genetic algorithm with provided settings', function() {
			let settings = { foo: 'bar' };
			let runner = new Runner();
			let best = new TestIndividual('best');
			sandbox.stub(Runner, 'createSync').returns(runner);
			sandbox.stub(runner, 'runSync').returns(best);

			let result = runUtils.runSync(settings);

			expect(Runner.createSync).to.be.calledOnce;
			expect(Runner.createSync).to.be.calledOn(Runner);
			expect(Runner.createSync).to.be.calledWith(settings);
			expect(runner.runSync).to.be.calledOnce;
			expect(runner.runSync).to.be.calledOn(runner);
			expect(result).to.equal(best.chromosome);
		});
	});

	describe('::runAsync', function() {
		it('asynchronously runs a genetic algorithm with the provided settings', function() {
			let settings = { foo: 'bar' };
			let runner = new Runner();
			let best = new TestIndividual('best');
			sandbox.stub(Runner, 'createAsync').resolves(runner);
			sandbox.stub(runner, 'runAsync').resolves(best);

			return runUtils.runAsync(settings)
				.then((result) => {
					expect(Runner.createAsync).to.be.calledOnce;
					expect(Runner.createAsync).to.be.calledOn(Runner);
					expect(Runner.createAsync).to.be.calledWith(settings);
					expect(runner.runAsync).to.be.calledOnce;
					expect(runner.runAsync).to.be.calledOn(runner);
					expect(result).to.equal(best.chromosome);
				});
		});
	});
});
