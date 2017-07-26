const utils = require('../../lib/utils');
const sinon = require('sinon');
const _ = require('lodash');

describe('utils', function() {
	let sandbox;

	beforeEach(function() {
		sandbox = sinon.sandbox.create();
	});

	afterEach(function() {
		sandbox.restore();
	});

	describe('::boolChance', function() {
		beforeEach(function() {
			sandbox.stub(Math, 'random').returns(0.5);
		});

		it('gets a random float in [0, 1)', function() {
			utils.boolChance();

			expect(Math.random).to.be.calledOnce;
			expect(Math.random).to.be.calledOn(Math);
		});

		it('returns true if random float is less than rate', function() {
			expect(utils.boolChance(0.51)).to.be.true;
		});

		it('returns false if random float is equal than rate', function() {
			expect(utils.boolChance(0.5)).to.be.false;
		});

		it('returns false if random float is greater than rate', function() {
			expect(utils.boolChance(0.49)).to.be.false;
		});

		it('returns false if rate is undefined', function() {
			expect(utils.boolChance()).to.be.false;
		});
	});

	describe('::getCrossoverPoint', function() {
		it('returns a random index between 0 and length', function() {
			let length = 10;
			sandbox.stub(_, 'random').returns(3);

			let result = utils.getCrossoverPoint(length);

			expect(_.random).to.be.calledOnce;
			expect(_.random).to.be.calledOn(_);
			expect(_.random).to.be.calledWithExactly(0, length);
			expect(result).to.equal(3);
		});
	});

	describe('::getCrossoverRange', function() {
		const length = 10;

		beforeEach(function() {
			sandbox.stub(utils, 'getCrossoverPoint');
		});

		it('returns two crossover points', function() {
			utils.getCrossoverPoint
				.onFirstCall().returns(3)
				.onSecondCall().returns(7);

			let result = utils.getCrossoverRange(length);

			expect(utils.getCrossoverPoint).to.be.calledTwice;
			expect(utils.getCrossoverPoint).to.always.be.calledOn(utils);
			expect(utils.getCrossoverPoint).to.always.be.calledWith(length);
			expect(result).to.deep.equal([ 3, 7 ]);
		});

		it('returns smaller of two results first', function() {
			utils.getCrossoverPoint
				.onFirstCall().returns(7)
				.onSecondCall().returns(3);

			expect(utils.getCrossoverRange(length)).to.deep.equal([ 3, 7 ]);
		});
	});

	describe('::getCrossoverIndices', function() {
		it('does the thing', function() {
			let length = 5;
			sandbox.stub(utils, 'boolChance')
				.onCall(0).returns(false)
				.onCall(1).returns(true)
				.onCall(2).returns(false)
				.onCall(3).returns(false)
				.onCall(4).returns(true);

			let result = utils.getCrossoverIndices(length);

			expect(utils.boolChance).to.have.callCount(length);
			expect(utils.boolChance).to.always.be.calledOn(utils);
			expect(utils.boolChance).to.always.be.calledWith(0.5);
			expect(result).to.deep.equal([ 1, 4 ]);
		});
	});

	describe('::pmx', function() {
		it('performs a partially-mapped crossover', function() {
			let left = [ 1, 2, 3, 4, 5, 6, 7 ];
			let right = [ 5, 4, 6, 7, 2, 1, 3 ];
			sandbox.stub(utils, 'getCrossoverRange').returns([ 2, 6 ]);

			let result = utils.pmx(left, right);

			expect(utils.getCrossoverRange).to.be.calledOnce;
			expect(utils.getCrossoverRange).to.be.calledOn(utils);
			expect(utils.getCrossoverRange).to.be.calledWith(left.length);
			expect(result).to.deep.equal([
				[ 3, 5, 6, 7, 2, 1, 4 ],
				[ 2, 7, 3, 4, 5, 6, 1 ]
			]);
		});
	});
});
