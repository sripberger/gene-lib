const ArraySelector = require('./array-selector');

class RouletteSelector extends ArraySelector {
	constructor(settings) {
		super(settings);
		this.fitnessTotal = 0;
	}

	add(individual) {
		super.add(individual);
		this.fitnessTotal += individual.getFitnessScore();
	}

	spin() {
		return this.fitnessTotal * Math.random();
	}

	select() {
		let spinResult = this.spin();
		for (let individual of this.individuals) {
			let fitness = individual.getFitnessScore();
			if (spinResult < fitness) return individual;
			spinResult -= fitness;
		}
		return null;
	}
}

module.exports = RouletteSelector;
