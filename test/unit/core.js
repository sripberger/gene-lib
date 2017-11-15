const geneLib = require('../../lib');
const XError = require('xerror');
const { defaultRegistry } = require('../../lib/selector-registry');
const runUtils = require('../../lib/run-utils');
const settingsUtils = require('../../lib/settings-utils');
const TestSelector = require('../lib/test-selector');

describe('geneLib', function() {
	let settings, normalizedSettings, runResult;

	beforeEach(function() {
		settings = { foo: 'bar' };
		normalizedSettings = { baz: 'qux' };
		runResult = { foo: 'bar' };

		sandbox.stub(settingsUtils, 'normalize').returns(normalizedSettings);
	});

	describe('::run', function() {
		it('resolves with result of runUtils::runAsync with normalized settings', function() {
			sandbox.stub(runUtils, 'runAsync').resolves(runResult);

			return geneLib.run(settings)
				.then((result) => {
					expect(settingsUtils.normalize).to.be.calledOnce;
					expect(settingsUtils.normalize).to.be.calledOn(
						settingsUtils
					);
					expect(settingsUtils.normalize).to.be.calledWith(settings);
					expect(runUtils.runAsync).to.be.calledOnce;
					expect(runUtils.runAsync).to.be.calledOn(runUtils);
					expect(runUtils.runAsync).to.be.calledWith(
						normalizedSettings
					);
					expect(result).to.equal(runResult);
				});
		});
	});

	describe('::runSync', function() {
		beforeEach(function() {
			sandbox.stub(runUtils, 'runSync').returns(runResult);
		});

		it('returns result of runUtils::runSync with normalized settings', function() {
			let result = geneLib.runSync(settings);

			expect(settingsUtils.normalize).to.be.calledOnce;
			expect(settingsUtils.normalize).to.be.calledOn(settingsUtils);
			expect(settingsUtils.normalize).to.be.calledWith(settings);
			expect(runUtils.runSync).to.be.calledOnce;
			expect(runUtils.runSync).to.be.calledOn(runUtils);
			expect(runUtils.runSync).to.be.calledWith(normalizedSettings);
			expect(result).to.equal(runResult);
		});

		it('throws invalid argument if async is set', function() {
			normalizedSettings.async = { foo: 'bar' };

			expect(() => geneLib.runSync(settings))
				.to.throw(XError).that.satisfies((err) => {
					expect(err.code).to.equal(XError.INVALID_ARGUMENT);
					expect(err.message).to.equal(
						'::runSync does not allow asynchronous operations.'
					);
					expect(err.data).to.deep.equal({
						async: normalizedSettings.async
					});
					expect(runUtils.runSync).to.not.be.called;
					return true;
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
