const Selector = require('../../lib/selector');
const XError = require('xerror');

describe('Selector', function() {
	it('stores provided settings object', function() {
		let settings = { foo: 'bar' };

		let selector = new Selector(settings);

		expect(selector.settings).to.equal(settings);
	});

	it('defaults to an empty settings object', function() {
		let selector = new Selector();

		expect(selector.settings).to.deep.equal({});
	});

	describe('#add', function() {
		it('throws unsupported operation error', function() {
			let selector = new Selector();

			expect(() => selector.add())
				.to.throw(XError)
				.with.property('code')
				.that.equals(XError.UNSUPPORTED_OPERATION);
		});
	});

	describe('#getSize', function() {
		it('throws unsupported operation error', function() {
			let selector = new Selector();

			expect(() => selector.getSize())
				.to.throw(XError)
				.with.property('code')
				.that.equals(XError.UNSUPPORTED_OPERATION);
		});
	});

	describe('#getBest', function() {
		it('throws unsupported operation error', function() {
			let selector = new Selector();

			expect(() => selector.getBest())
				.to.throw(XError)
				.with.property('code')
				.that.equals(XError.UNSUPPORTED_OPERATION);
		});
	});

	describe('#select', function() {
		it('throws unsupported operation error', function() {
			let selector = new Selector();

			expect(() => selector.select())
				.to.throw(XError)
				.with.property('code')
				.that.equals(XError.UNSUPPORTED_OPERATION);
		});
	});

	describe('#getNext', function() {
		// Simple derived class to ensure correct inherited behavior.
		class TestSelector extends Selector {}

		it('returns a new instance with same settings object', function() {
			let selector = new TestSelector({ foo: 'bar' });

			let result = selector.getNext();

			expect(result).to.be.an.instanceof(TestSelector);
			expect(result.settings).to.equal(selector.settings);
			expect(result).to.not.equal(selector);
		});
	});
});
