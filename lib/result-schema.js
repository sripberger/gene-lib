const _ = require('lodash');
const XError = require('xerror');

/**
 * Contains methods for validating the results of user-provided operations.
 * Each instance is for a specific operation, with a specific expected result.
 * @private
 * @param {String} operation - Operation name.
 * @param {Object} obj - Schema as a plain object.
 *   @param {String} obj.description - Text description of the expected value,
 *     for use in error messages.
 *   @param {Function} obj.validate - A function that receives a value. It
 *     should return true if the value is valid, false otherwise.
 */
class ResultSchema {
	constructor(operation, obj) {
		this.operation = operation;
		this.description = obj.description;
		this.validate = obj.validate;
	}

	/**
	 * Use to validate results of synchronous operations.
	 * @param {*} value - Return value of operation.
	 * @returns {*} - Will return `value` if it is valid. Will throw with an
	 *   appropriate error message, otherwise.
	 */
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
			XError.INVALID_RESULT,
			message,
			{ returnedValue: value }
		);
	}

	/**
	 * Use to validate results of asynchronous operations.
	 * @param {*} value - Return value of operation.
	 * @returns {Promise} - Will resolve with the same result as value, if value
	 *   is a promise and its result passes the validation check. Otherwise,
	 *   this method will reject with an appropriate error message.
	 */
	validateAsync(value) {
		if (!value || !_.isFunction(value.then)) {
			return Promise.reject(new XError(
				XError.INVALID_RESULT,
				`${this.operation} must return a promise if ` +
				`async.${this.operation} is set.`,
				{ returnedValue: value }
			));
		}
		return value.then((result) => {
			if (this.validate(result)) return result;
			throw new XError(
				XError.INVALID_RESULT,
				`${this.operation} must resolve with ${this.description}.`,
				{ promiseResult: result }
			);
		});
	}
}

module.exports = ResultSchema;
