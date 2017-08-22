const geneLib = require('../../lib');
const sinon = require('sinon');
const { defaultRegistry } = require('../../lib/selector-registry');
const runUtils = require('../../lib/run-utils');
const settingsUtils = require('../../lib/settings-utils');
const TestChromosome = require('../lib/test-chromosome');
const TestSelector = require('../lib/test-selector');

describe('geneLib', function() {
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
			geneLib.run(settings);

			expect(settingsUtils.normalize).to.be.calledOnce;
			expect(settingsUtils.normalize).to.be.calledOn(settingsUtils);
			expect(settingsUtils.normalize).to.be.calledWith(settings);
		});

		context('async setting is not set', function() {
			it('returns result of runUtils::runSync with normalized settings', function() {
				let result = geneLib.run(settings);

				expect(runUtils.runSync).to.be.calledOnce;
				expect(runUtils.runSync).to.be.calledOn(runUtils);
				expect(runUtils.runSync).to.be.calledWith(normalizedSettings);
				expect(result).to.equal(best);
			});
		});

		context('async setting is set', function() {
			it('resolves with result of runUtils::runAsync with normalized settings', function() {
				normalizedSettings.async = {};

				return geneLib.run(settings)
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

	describe('::registerSelector', function() {
		it('does the thing', function() {
			sandbox.stub(defaultRegistry, 'register');

			geneLib.registerSelector('test', TestSelector);

			expect(defaultRegistry.register).to.be.calledOnce;
			expect(defaultRegistry.register).to.be.calledOn(defaultRegistry);
			expect(defaultRegistry.register).to.be.calledWith(
				'test',
				TestSelector
			);
		});
	});
});
