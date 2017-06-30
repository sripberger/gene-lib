const Individual = require('../../lib/individual');

class TestIndividual extends Individual {
	constructor(id) {
		super();
		this.id = id;
	}
}

module.exports = TestIndividual;
