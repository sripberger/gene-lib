const XError = require('xerror');

class Selector {
	constructor(settings = {}) {
		this.settings = settings;
	}

	add() {
		throw new XError(XError.UNSUPPORTED_OPERATION);
	}

	getSize() {
		throw new XError(XError.UNSUPPORTED_OPERATION);
	}

	getBest() {
		throw new XError(XError.UNSUPPORTED_OPERATION);
	}

	select() {
		throw new XError(XError.UNSUPPORTED_OPERATION);
	}

	getNext() {
		return new this.constructor(this.settings);
	}
}

module.exports = Selector;
