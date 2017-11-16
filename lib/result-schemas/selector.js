const _ = require('lodash');
const Individual = require('../individual');
const ResultSchema = require('../result-schema');

/*
 * This file creates the ResultSchema instances used to validate the results of
 * potentially-user-provided selector operations: `add`, and `select`.
 */

let schemas = {
	add: {
		isValid: (value) => !value || !_.isFunction(value.then),
		description: 'a non-promise'
	},
	select: {
		isValid: (value) => value instanceof Individual,
		description: 'a single individual'
	}
};

module.exports = _.mapValues(schemas, (v, k) => new ResultSchema(k, v));
