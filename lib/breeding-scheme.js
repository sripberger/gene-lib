const _ = require('lodash');
const pasync = require('pasync');
const Population = require('./population');

class BreedingScheme {
	constructor(crossovers = [], copies = [], settings = {}) {
		this.crossovers = crossovers;
		this.copies = copies;
		this.settings = settings;
	}

	performCrossovers() {
		let { async } = this.settings;
		if (!async || !async.crossover) return this.performCrossoversSync();
		return this.performCrossoversAsync();
	}

	performCrossoversSync() {
		let { crossovers, copies, settings } = this;
		let { crossoverRate } = settings;
		let crossoverResults = crossovers.map((crossover) => {
			let individual = _.head(crossover);
			let others = _.tail(crossover);
			return individual.crossover(others, crossoverRate);
		});
		return new Population(_.concat(copies, _.flatten(crossoverResults)));
	}

	performCrossoversAsync() {
		let { crossovers, copies, settings } = this;
		let { crossoverRate, async } = settings;
		return pasync.mapLimit(
			crossovers,
			async.crossover,
			(crossover) => {
				let individual = _.head(crossover);
				let others = _.tail(crossover);
				return individual.crossoverAsync(others, crossoverRate);
			}
		)
			.then((crossoverResults) => {
				let offspring = _.concat(copies, _.flatten(crossoverResults));
				return new Population(offspring);
			});
	}
}

module.exports = BreedingScheme;
