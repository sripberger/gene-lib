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
		it('throws unsupported operation with message', function() {
			let selector = new Selector();

			expect(() => selector.add())
				.to.throw(XError).that.satisfies((err) => {
					expect(err.code).to.equal(XError.UNSUPPORTED_OPERATION);
					expect(err.message).to.equal(
						'Selector subclass must override the #add method.'
					);
					return true;
				});
		});
	});

	describe('#select', function() {
		it('throws unsupported operation with message', function() {
			let selector = new Selector();

			expect(() => selector.select())
				.to.throw(XError).that.satisfies((err) => {
					expect(err.code).to.equal(XError.UNSUPPORTED_OPERATION);
					expect(err.message).to.equal(
						'Selector subclass must override the #select method.'
					);
					return true;
				});
		});
	});
});
