const utils = require('../../lib/utils');
const _ = require('lodash');
const boolChance = require('bool-chance');

describe('utils', function() {
	describe('::getRandomIndex', function() {
		it('returns a random index between 0 and length', function() {
			let length = 10;
			sandbox.stub(_, 'random').returns(3);

			let result = utils.getRandomIndex(length);

			expect(_.random).to.be.calledOnce;
			expect(_.random).to.be.calledOn(_);
			expect(_.random).to.be.calledWithExactly(0, length);
			expect(result).to.equal(3);
		});
	});

	describe('::getRandomRange', function() {
		const length = 10;

		beforeEach(function() {
			sandbox.stub(utils, 'getRandomIndex');
		});

		it('returns two random indices', function() {
			utils.getRandomIndex
				.onFirstCall().returns(3)
				.onSecondCall().returns(7);

			let result = utils.getRandomRange(length);

			expect(utils.getRandomIndex).to.be.calledTwice;
			expect(utils.getRandomIndex).to.always.be.calledOn(utils);
			expect(utils.getRandomIndex).to.always.be.calledWith(length);
			expect(result).to.deep.equal([ 3, 7 ]);
		});

		it('returns smaller of two results first', function() {
			utils.getRandomIndex
				.onFirstCall().returns(7)
				.onSecondCall().returns(3);

			expect(utils.getRandomRange(length)).to.deep.equal([ 3, 7 ]);
		});
	});

	describe('::getRandomIndices', function() {
		const length = 5;

		beforeEach(function() {
			sandbox.stub(boolChance, 'get')
				.onCall(0).returns(false)
				.onCall(1).returns(true)
				.onCall(2).returns(false)
				.onCall(3).returns(false)
				.onCall(4).returns(true);

			sandbox.stub(_, 'sampleSize').returns([ 3, 5 ]);
		});

		it('returns a set of indices with the provided selection probability', function() {
			let probability = 0.3;

			let result = utils.getRandomIndices(length, probability);

			expect(boolChance.get).to.have.callCount(length);
			expect(boolChance.get).to.always.be.calledOn(boolChance);
			expect(boolChance.get).to.always.be.calledWith(probability);
			expect(result).to.deep.equal([ 1, 4 ]);
		});

		it('defaults to selection probability of 0.5', function() {
			let result = utils.getRandomIndices(length);

			expect(boolChance.get).to.have.callCount(length);
			expect(boolChance.get).to.always.be.calledOn(boolChance);
			expect(boolChance.get).to.always.be.calledWith(0.5);
			expect(result).to.deep.equal([ 1, 4 ]);
		});

		it('suports picking a ratio of total', function() {
			let result = utils.getRandomIndices(7, true, 0.3);

			expect(boolChance.get).to.not.be.called;
			expect(_.sampleSize).to.be.calledOnce;
			expect(_.sampleSize).to.be.calledOn(_);
			expect(_.sampleSize).to.be.calledWith([ 0, 1, 2, 3, 4, 5, 6 ], 2);
			expect(result).to.deep.equal([ 3, 5 ]);
		});

		it('defaults to ratio of 0.5', function() {
			let result = utils.getRandomIndices(7, true);

			expect(boolChance.get).to.not.be.called;
			expect(_.sampleSize).to.be.calledOnce;
			expect(_.sampleSize).to.be.calledOn(_);
			expect(_.sampleSize).to.be.calledWith([ 0, 1, 2, 3, 4, 5, 6 ], 3);
			expect(result).to.deep.equal([ 3, 5 ]);
		});
	});

	describe('::singlePointCrossover', function() {
		beforeEach(function() {
			sandbox.stub(utils, 'getRandomIndex').returns(3);
		});

		it('performs a single-point crossover', function() {
			let left = [ 0, 1, 2, 3, 4 ];
			let right = [ 5, 6, 7, 8, 9 ];

			let result = utils.singlePointCrossover(left, right);

			expect(utils.getRandomIndex).to.be.calledOnce;
			expect(utils.getRandomIndex).to.be.calledOn(utils);
			expect(utils.getRandomIndex).to.be.calledWith(left.length);
			expect(result).to.deep.equal([
				[ 0, 1, 2, 8, 9 ],
				[ 5, 6, 7, 3, 4 ]
			]);
		});

		it('supports string arguments', function() {
			let left = 'abcde';
			let right = 'fghij';

			let result = utils.singlePointCrossover(left, right);

			expect(utils.getRandomIndex).to.be.calledOnce;
			expect(utils.getRandomIndex).to.be.calledOn(utils);
			expect(utils.getRandomIndex).to.be.calledWith(left.length);
			expect(result).to.deep.equal([ 'abcij', 'fghde' ]);
		});
	});

	describe('::twoPointCrossover', function() {
		beforeEach(function() {
			sandbox.stub(utils, 'getRandomRange').returns([ 2, 4 ]);
		});

		it('performs a two-point crossover', function() {
			let left = [ 0, 1, 2, 3, 4 ];
			let right = [ 5, 6, 7, 8, 9 ];

			let result = utils.twoPointCrossover(left, right);

			expect(utils.getRandomRange).to.be.calledOnce;
			expect(utils.getRandomRange).to.be.calledOn(utils);
			expect(utils.getRandomRange).to.be.calledWith(left.length);
			expect(result).to.deep.equal([
				[ 0, 1, 7, 8, 4 ],
				[ 5, 6, 2, 3, 9 ]
			]);
		});

		it('supports string arguments', function() {
			let left = 'abcde';
			let right = 'fghij';

			let result = utils.twoPointCrossover(left, right);

			expect(utils.getRandomRange).to.be.calledOnce;
			expect(utils.getRandomRange).to.be.calledOn(utils);
			expect(utils.getRandomRange).to.be.calledWith(left.length);
			expect(result).to.deep.equal([ 'abhie', 'fgcdj' ]);
		});
	});

	describe('::uniformCrossover', function() {
		let left, right;

		beforeEach(function() {
			left = [ 0, 1, 2, 3, 4 ];
			right = [ 5, 6, 7, 8, 9 ];
			sandbox.stub(utils, 'getRandomIndices').returns([ 1, 3, 4 ]);
		});

		it('performs a uniform crossover with args passed to getRandomIndices', function() {
			let result = utils.uniformCrossover(left, right, 'foo', 'bar');

			expect(utils.getRandomIndices).to.be.calledOnce;
			expect(utils.getRandomIndices).to.be.calledOn(utils);
			expect(utils.getRandomIndices).to.be.calledWith(
				left.length,
				'foo',
				'bar'
			);
			expect(result).to.deep.equal([
				[ 0, 6, 2, 8, 9 ],
				[ 5, 1, 7, 3, 4 ]
			]);
		});

		it('supports string left and right arguments', function() {
			left = 'abcde';
			right = 'fghij';

			let result = utils.uniformCrossover(left, right, 'foo', 'bar');

			expect(utils.getRandomIndices).to.be.calledOnce;
			expect(utils.getRandomIndices).to.be.calledOn(utils);
			expect(utils.getRandomIndices).to.be.calledWith(
				left.length,
				'foo',
				'bar'
			);
			expect(result).to.deep.equal([ 'agcij', 'fbhde' ]);
		});
	});

	describe('::pmx', function() {
		beforeEach(function() {
			sandbox.stub(utils, 'getRandomRange').returns([ 2, 6 ]);
		});

		it('performs a partially-mapped crossover', function() {
			let left = [ 1, 2, 3, 4, 5, 6, 7 ];
			let right = [ 5, 4, 6, 7, 2, 1, 3 ];

			let result = utils.pmx(left, right);

			expect(utils.getRandomRange).to.be.calledOnce;
			expect(utils.getRandomRange).to.be.calledOn(utils);
			expect(utils.getRandomRange).to.be.calledWith(left.length);
			expect(result).to.deep.equal([
				[ 3, 5, 6, 7, 2, 1, 4 ],
				[ 2, 7, 3, 4, 5, 6, 1 ]
			]);
		});

		it('supports string arguments', function() {
			let left = 'abcdefg';
			let right = 'edfgbac';

			let result = utils.pmx(left, right);

			expect(utils.getRandomRange).to.be.calledOnce;
			expect(utils.getRandomRange).to.be.calledOn(utils);
			expect(utils.getRandomRange).to.be.calledWith(left.length);
			expect(result).to.deep.equal([ 'cefgbad', 'bgcdefa' ]);
		});
	});
});
