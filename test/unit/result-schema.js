const ResultSchema = require('../../lib/result-schema');
const XError = require('xerror');

describe('ResultSchema', function() {
	const operation = 'operation';
	const description = 'description';
	let validate, schema;

	beforeEach(function() {
		validate = sandbox.stub().returns(true);
		schema = new ResultSchema(operation, { description, validate });
	});

	it('initializes instance from operation name and object', function() {
		expect(schema.operation).to.equal(operation);
		expect(schema.description).to.equal(description);
		expect(schema.validate).to.equal(validate);
	});

	describe('#validateSync', function() {
		it('invokes validate with provided value', function() {
			schema.validateSync('foo');

			expect(validate).to.be.calledOnce;
			expect(validate).to.be.calledWith('foo');
		});

		it('returns provided value if validate returns true', function() {
			expect(schema.validateSync('foo')).to.equal('foo');
		});

		it('throws if validate returns false', function() {
			validate.returns(false);

			expect(() => schema.validateSync('foo'))
				.to.throw(XError).that.satisfies((err) => {
					expect(err.code).to.equal(XError.INVALID_RESULT);
					expect(err.message).to.equal(
						`${operation} must return ${description}.`
					);
					expect(err.data).to.deep.equal({ returnedValue: 'foo' });
					return true;
				});
		});

		it('includes async help in error message if value is a promise', function() {
			let promise = Promise.resolve('foo');
			validate.returns(false);

			expect(() => schema.validateSync(promise))
				.to.throw(XError).that.satisfies((err) => {
					expect(err.code).to.equal(XError.INVALID_RESULT);
					expect(err.message).to.equal(
						`${operation} returned a promise, but ` +
						`async.${operation} was not set.`
					);
					expect(err.data).to.deep.equal({ returnedValue: promise });
					return true;
				});
		});

		it('properly handles undefined values', function() {
			validate.returns(false);

			expect(() => schema.validateSync(undefined))
				.to.throw(XError).that.satisfies((err) => {
					expect(err.code).to.equal(XError.INVALID_RESULT);
					expect(err.message).to.equal(
						`${operation} must return ${description}.`
					);
					expect(err.data).to.deep.equal({
						returnedValue: undefined
					});
					return true;
				});
		});
	});

	describe('#validateAsync', function() {
		it('rejects if provided value is not a promise', function() {
			return schema.validateAsync('foo')
				.then(() => {
					throw new Error('Promise should have rejected.');
				}, (err) => {
					expect(err).to.be.an.instanceof(XError);
					expect(err.code).to.equal(XError.INVALID_RESULT);
					expect(err.message).to.equal(
						`${operation} must return a promise if ` +
						`async.${operation} is set.`
					);
					expect(err.data).to.deep.equal({ returnedValue: 'foo' });
				});
		});

		it('invokes validate with promise result', function() {
			return schema.validateAsync(Promise.resolve('foo'))
				.then(() => {
					expect(validate).to.be.calledOnce;
					expect(validate).to.be.calledWith('foo');
				});
		});

		it('resolves with result if validate returns true', function() {
			return schema.validateAsync(Promise.resolve('foo'))
				.then((result) => {
					expect(result).to.equal('foo');
				});
		});

		it('rejects if validate returns false', function() {
			validate.returns(false);

			return schema.validateAsync(Promise.resolve('foo'))
				.then(() => {
					throw new Error('Promise should have rejected.');
				}, (err) => {
					expect(err).to.be.an.instanceof(XError);
					expect(err.code).to.equal(XError.INVALID_RESULT);
					expect(err.message).to.equal(
						`${operation} must resolve with ${description}.`
					);
					expect(err.data).to.deep.equal({ promiseResult: 'foo' });
				});
		});

		it('properly handles undefined values', function() {
			return schema.validateAsync(undefined)
				.then(() => {
					throw new Error('Promise should have rejected.');
				}, (err) => {
					expect(err).to.be.an.instanceof(XError);
					expect(err.code).to.equal(XError.INVALID_RESULT);
					expect(err.message).to.equal(
						`${operation} must return a promise if ` +
						`async.${operation} is set.`
					);
					expect(err.data).to.deep.equal({
						returnedValue: undefined
					});
				});
		});
	});
});
