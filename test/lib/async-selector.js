const _ = require('lodash');
const { TournamentSelector } = require('../../lib');

class AsyncSelector extends TournamentSelector {
	static get settings() {
		return _.assign({}, super.settings, {
			async: {
				add: true,
				select: true
			}
		});
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
