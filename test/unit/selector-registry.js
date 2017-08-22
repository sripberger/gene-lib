const SelectorRegistry = require('../../lib/selector-registry');
const XError = require('xerror');

describe('SelectorRegistry', function() {
	const FooSelector = () => {};
	const BarSelector = () => {};
	let registry;

	beforeEach(function() {
		registry = new SelectorRegistry();
	});

	it('stores an empty object for selector classes', function() {
		expect(registry.classes).to.deep.equal({});
	});

	describe('.defaultRegistry', function() {
		it('is set to an instance', function() {
			let { defaultRegistry } = SelectorRegistry;

			expect(defaultRegistry).to.be.an.instanceof(SelectorRegistry);
		});

		it('always returns the same instance', function() {
			let result = SelectorRegistry.defaultRegistry;
			let otherResult = SelectorRegistry.defaultRegistry;

			expect(result).to.equal(otherResult);
		});
	});

	describe('#register', function() {
		beforeEach(function() {
			registry.register('foo', FooSelector);
			registry.register('bar', BarSelector);
		});

		it('sets key for selector class', function() {
			expect(registry.classes).to.have.keys([ 'foo', 'bar' ]);
			expect(registry.classes.foo).to.equal(FooSelector);
			expect(registry.classes.bar).to.equal(BarSelector);
		});

		it('throws invalid argument if key is already set', function() {
			expect(() => registry.register('foo', () => {}))
				.to.throw(XError).that.satisfies((err) => {
					expect(err.code).to.equal(XError.INVALID_ARGUMENT);
					expect(err.message).to.equal('Selector key \'foo\' is already registered.');
					return true;
				});
		});
	});

	describe('#get', function() {
		beforeEach(function() {
			registry.classes = {
				foo: FooSelector,
				bar: BarSelector
			};
		});

		it('returns entry for provided key', function() {
			expect(registry.get('foo')).to.equal(FooSelector);
		});

		it('throws invalid argument if key is not set', function() {
			expect(() => registry.get('baz'))
				.to.throw(XError).that.satisfies((err) => {
					expect(err.code).to.equal(XError.INVALID_ARGUMENT);
					expect(err.message).to.equal('Selector key \'baz\' is not registered.');
					return true;
				});
		});
	});

	describe('#clear', function() {
		it('removes all registered keys', function() {
			registry.register('foo', FooSelector);
			registry.register('bar', BarSelector);

			registry.clear();

			expect(registry.classes).to.deep.equal({});
		});
	});
});
