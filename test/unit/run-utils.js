const runUtils = require('../../lib/run-utils');
const sinon = require('sinon');
const Runner = require('../../lib/runner');
const settingsUtils = require('../../lib/settings-utils');
const TestIndividual = require('../lib/test-individual');

describe.skip('runUtils', function() {
	let sandbox;

	beforeEach(function() {
		sandbox = sinon.sandbox.create();
	});

	afterEach(function() {
		sandbox.restore();
	});

	describe('::run', function() {
		it('runs a genetic algorithm with the provided settings', function() {
			let settings = { foo: 'bar' };
			let processedSettings = { baz: 'qux' };
			let runner = new Runner();
			let best = new TestIndividual('best');
			sandbox.stub(settingsUtils, 'processSettings').returns(processedSettings);
			sandbox.stub(Runner, 'create').resolves(runner);
			sandbox.stub(runner, 'run').resolves(best);

			return runUtils.run(settings)
				.then((result) => {
					expect(settingsUtils.processSettings).to.be.calledOnce;
					expect(settingsUtils.processSettings).to.be.calledOn(settingsUtils);
					expect(settingsUtils.processSettings).to.be.calledWith(settings);
					expect(Runner.create).to.be.calledOnce;
					expect(Runner.create).to.be.calledOn(Runner);
					expect(Runner.create).to.be.calledWith(processedSettings);
					expect(runner.run).to.be.calledOnce;
					expect(runner.run).to.be.calledOn(runner);
					expect(result).to.equal(best.chromosome);
				});
		});
	});
});
