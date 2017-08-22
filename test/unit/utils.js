const utils = require('../../lib/utils');
const sinon = require('sinon');
const _ = require('lodash');
const boolChance = require('bool-chance');

describe('utils', function() {
	let sandbox;

	beforeEach(function() {
		sandbox = sinon.sandbox.create();
	});

	afterEach(function() {
		sandbox.restore();
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
		it('returns randomly-determined set of crossover indices', function() {
			let length = 5;
			sandbox.stub(boolChance, 'get')
				.onCall(0).returns(false)
				.onCall(1).returns(true)
				.onCall(2).returns(false)
				.onCall(3).returns(false)
				.onCall(4).returns(true);

			let result = utils.getCrossoverIndices(length);

			expect(boolChance.get).to.have.callCount(length);
			expect(boolChance.get).to.always.be.calledOn(boolChance);
			expect(boolChance.get).to.always.be.calledWith(0.5);
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
