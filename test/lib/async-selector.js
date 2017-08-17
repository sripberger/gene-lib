const { TournamentSelector } = require('../../lib');

class AsyncSelector extends TournamentSelector {
	add(individual) {
		return new Promise((resolve) => {
			setImmediate(() => {
				super.add(individual);
				resolve();
			});
		});
	}

	select() {
		return Promise.resolve(super.select());
	}
}

module.exports = AsyncSelector;
