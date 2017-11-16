const _ = require('lodash');
const Individual = require('../individual');
const ResultSchema = require('../result-schema');

let schemas = {
	add: {
		validate: (value) => !value || !_.isFunction(value.then),
		description: 'a non-promise'
	},
	select: {
		validate: (value) => value instanceof Individual,
		description: 'a single individual'
	}
};

module.exports = _.mapValues(schemas, (v, k) => new ResultSchema(k, v));
