const _ = require('lodash');
const XError = require('xerror');

class ResultSchema {
	constructor(operation, obj) {
		this.operation = operation;
		this.description = obj.description;
		this.validate = obj.validate;
	}

	validateSync(value) {
		if (this.validate(value)) return value;
		let message;
		if (value && _.isFunction(value.then)) {
			message = `${this.operation} returned a promise, ` +
				`but async.${this.operation} was not set.`;
		} else {
			message = `${this.operation} must return ${this.description}.`;
		}
		throw new XError(
			XError.INVALID_ARGUMENT,
			message,
			{ returnedValue: value }
		);
	}

	validateAsync(value) {
		if (!value || !_.isFunction(value.then)) {
			return Promise.reject(new XError(
				XError.INVALID_ARGUMENT,
				`${this.operation} must return a promise if ` +
				`async.${this.operation} is set.`,
				{ returnedValue: value }
			));
		}
		return value.then((result) => {
			if (this.validate(result)) return result;
			throw new XError(
				XError.INVALID_ARGUMENT,
				`${this.operation} must resolve with ${this.description}.`,
				{ promiseResult: result }
			);
		});
	}
}

module.exports = ResultSchema;
