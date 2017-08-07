const ArraySelector = require('./array-selector');

class RouletteSelector extends ArraySelector {
	constructor(settings) {
		super(settings);
		this.fitnessTotal = 0;
	}

	add(chromosome) {
		super.add(chromosome);
		this.fitnessTotal += chromosome.getFitnessScore();
	}

	spin() {
		return this.fitnessTotal * Math.random();
	}

	select() {
		let spinResult = this.spin();
		for (let chromosome of this.chromosomes) {
			let fitness = chromosome.getFitnessScore();
			if (spinResult < fitness) return chromosome;
			spinResult -= fitness;
		}
		return null;
	}
}

module.exports = RouletteSelector;
