const { TournamentSelector } = require('../../lib');

class AsyncSelector extends TournamentSelector {
	static get async() {
		return {
			add: 1,
			select: 1
		};
	}

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
