const Individual = require('../../lib/individual');
const TestChromosome = require('./test-chromosome');

class TestIndividual extends Individual {
	constructor(id) {
		super(new TestChromosome(id));
	}
}

module.exports = TestIndividual;
