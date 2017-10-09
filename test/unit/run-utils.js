const runUtils = require('../../lib/run-utils');
const Runner = require('../../lib/runner');

describe('runUtils', function() {
	describe('::runSync', function() {
		it('synchronously runs a genetic algorithm with provided settings', function() {
			let settings = { foo: 'bar' };
			let runner = new Runner();
			let runResult = { foo: 'bar' };
			sandbox.stub(Runner, 'createSync').returns(runner);
			sandbox.stub(runner, 'runSync').returns(runResult);

			let result = runUtils.runSync(settings);

			expect(Runner.createSync).to.be.calledOnce;
			expect(Runner.createSync).to.be.calledOn(Runner);
			expect(Runner.createSync).to.be.calledWith(settings);
			expect(runner.runSync).to.be.calledOnce;
			expect(runner.runSync).to.be.calledOn(runner);
			expect(result).to.equal(runResult);
		});
	});

	describe('::runAsync', function() {
		it('asynchronously runs a genetic algorithm with the provided settings', function() {
			let settings = { foo: 'bar' };
			let runner = new Runner();
			let runResult = { foo: 'bar' };
			sandbox.stub(Runner, 'createAsync').resolves(runner);
			sandbox.stub(runner, 'runAsync').resolves(runResult);

			return runUtils.runAsync(settings)
				.then((result) => {
					expect(Runner.createAsync).to.be.calledOnce;
					expect(Runner.createAsync).to.be.calledOn(Runner);
					expect(Runner.createAsync).to.be.calledWith(settings);
					expect(runner.runAsync).to.be.calledOnce;
					expect(runner.runAsync).to.be.calledOn(runner);
					expect(result).to.equal(runResult);
				});
		});
	});
});
