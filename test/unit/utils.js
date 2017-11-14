const utils = require('../../lib/utils');
const _ = require('lodash');
const boolChance = require('bool-chance');

describe('utils', function() {
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
		it('returns a set of indices for a uniform crossover', function() {
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

	describe('::pickCrossoverIndices', function() {
		it('returns random set of indices of half original length', function() {
			let length = 5;
			sandbox.stub(_, 'sampleSize').returns([ 1, 4 ]);

			let result = utils.pickCrossoverIndices(length);

			expect(_.sampleSize).to.be.calledOnce;
			expect(_.sampleSize).to.be.calledOn(_);
			expect(_.sampleSize).to.be.calledWith([ 0, 1, 2, 3, 4 ], 2);
			expect(result).to.deep.equal([ 1, 4 ]);
		});
	});

	describe('::singlePointCrossover', function() {
		beforeEach(function() {
			sandbox.stub(utils, 'getCrossoverPoint').returns(3);
		});

		it('performs a single-point crossover', function() {
			let left = [ 0, 1, 2, 3, 4 ];
			let right = [ 5, 6, 7, 8, 9 ];

			let result = utils.singlePointCrossover(left, right);

			expect(utils.getCrossoverPoint).to.be.calledOnce;
			expect(utils.getCrossoverPoint).to.be.calledOn(utils);
			expect(utils.getCrossoverPoint).to.be.calledWith(left.length);
			expect(result).to.deep.equal([
				[ 0, 1, 2, 8, 9 ],
				[ 5, 6, 7, 3, 4 ]
			]);
		});

		it('supports string arguments', function() {
			let left = 'abcde';
			let right = 'fghij';

			let result = utils.singlePointCrossover(left, right);

			expect(utils.getCrossoverPoint).to.be.calledOnce;
			expect(utils.getCrossoverPoint).to.be.calledOn(utils);
			expect(utils.getCrossoverPoint).to.be.calledWith(left.length);
			expect(result).to.deep.equal([ 'abcij', 'fghde' ]);
		});
	});

	describe('::twoPointCrossover', function() {
		beforeEach(function() {
			sandbox.stub(utils, 'getCrossoverRange').returns([ 2, 4 ]);
		});

		it('performs a two-point crossover', function() {
			let left = [ 0, 1, 2, 3, 4 ];
			let right = [ 5, 6, 7, 8, 9 ];

			let result = utils.twoPointCrossover(left, right);

			expect(utils.getCrossoverRange).to.be.calledOnce;
			expect(utils.getCrossoverRange).to.be.calledOn(utils);
			expect(utils.getCrossoverRange).to.be.calledWith(left.length);
			expect(result).to.deep.equal([
				[ 0, 1, 7, 8, 4 ],
				[ 5, 6, 2, 3, 9 ]
			]);
		});

		it('supports string arguments', function() {
			let left = 'abcde';
			let right = 'fghij';

			let result = utils.twoPointCrossover(left, right);

			expect(utils.getCrossoverRange).to.be.calledOnce;
			expect(utils.getCrossoverRange).to.be.calledOn(utils);
			expect(utils.getCrossoverRange).to.be.calledWith(left.length);
			expect(result).to.deep.equal([ 'abhie', 'fgcdj' ]);
		});
	});

	describe('::uniformCrossover', function() {
		beforeEach(function() {
			sandbox.stub(utils, 'getCrossoverIndices').returns([ 1, 3, 4 ]);
		});

		it('performs a uniform crossover', function() {
			let left = [ 0, 1, 2, 3, 4 ];
			let right = [ 5, 6, 7, 8, 9 ];

			let result = utils.uniformCrossover(left, right);

			expect(utils.getCrossoverIndices).to.be.calledOnce;
			expect(utils.getCrossoverIndices).to.be.calledOn(utils);
			expect(utils.getCrossoverIndices).to.be.calledWith(left.length);
			expect(result).to.deep.equal([
				[ 0, 6, 2, 8, 9 ],
				[ 5, 1, 7, 3, 4 ]
			]);
		});

		it('supports string arguments', function() {
			let left = 'abcde';
			let right = 'fghij';

			let result = utils.uniformCrossover(left, right);

			expect(utils.getCrossoverIndices).to.be.calledOnce;
			expect(utils.getCrossoverIndices).to.be.calledOn(utils);
			expect(utils.getCrossoverIndices).to.be.calledWith(left.length);
			expect(result).to.deep.equal([ 'agcij', 'fbhde' ]);
		});
	});

	describe('::pmx', function() {
		beforeEach(function() {
			sandbox.stub(utils, 'getCrossoverRange').returns([ 2, 6 ]);
		});

		it('performs a partially-mapped crossover', function() {
			let left = [ 1, 2, 3, 4, 5, 6, 7 ];
			let right = [ 5, 4, 6, 7, 2, 1, 3 ];

			let result = utils.pmx(left, right);

			expect(utils.getCrossoverRange).to.be.calledOnce;
			expect(utils.getCrossoverRange).to.be.calledOn(utils);
			expect(utils.getCrossoverRange).to.be.calledWith(left.length);
			expect(result).to.deep.equal([
				[ 3, 5, 6, 7, 2, 1, 4 ],
				[ 2, 7, 3, 4, 5, 6, 1 ]
			]);
		});

		it('supports string arguments', function() {
			let left = 'abcdefg';
			let right = 'edfgbac';

			let result = utils.pmx(left, right);

			expect(utils.getCrossoverRange).to.be.calledOnce;
			expect(utils.getCrossoverRange).to.be.calledOn(utils);
			expect(utils.getCrossoverRange).to.be.calledWith(left.length);
			expect(result).to.deep.equal([ 'cefgbad', 'bgcdefa' ]);
		});
	});
});
