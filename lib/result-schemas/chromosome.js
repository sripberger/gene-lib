const _ = require('lodash');
const { isChromosome } = require('../chromosome');
const ResultSchema = require('../result-schema');

/*
 * This file creates the ResultSchema instances used to validate the results of
 * user-provided chromosome operations: `create`, `getFitness`, `crossover`
 * and `mutate`.
 */

/**
 * Checks if a value is an array of chromosomes.
 * @private
 * @param {*} value - Value to check.
 * @returns {Boolean} - true if `value` is an array of chromsomes, false
 *   otherwise.
 */
function isChromosomeArray(value) {
	return _.isArray(value) && _.every(value, (item) => isChromosome(item));
}

let schemas = {
	create: {
		validate: (value) => isChromosome(value),
		description: 'a chromosome'
	},
	getFitness: {
		validate: (value) => _.isNumber(value),
		description: 'a number'
	},
	crossover: {
		validate: (value) => isChromosome(value) || isChromosomeArray(value),
		description: 'a chromosome or an array of chromosomes'
	},
	mutate: {
		validate: (value) => isChromosome(value),
		description: 'a chromosome'
	}
};

module.exports = _.mapValues(schemas, (v, k) => new ResultSchema(k, v));
