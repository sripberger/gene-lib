const Chromosome = require('../../lib/chromosome');

class TestChromosome extends Chromosome {
	constructor(id) {
		super();
		this.id = id;
	}
}

module.exports = TestChromosome;
