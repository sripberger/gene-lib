const XError = require('xerror');

class Selector {
	constructor(settings = {}) {
		this.settings = settings;
	}

	add() {
		throw new XError(XError.UNSUPPORTED_OPERATION);
	}

	select() {
		throw new XError(XError.UNSUPPORTED_OPERATION);
	}
}

module.exports = Selector;
