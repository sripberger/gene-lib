const geneLib = require('../../lib');
const _ = require('lodash');
const alphabet = 'abcdefghijklmnopqrstuvwxyz !,';

class Phrase extends geneLib.Chromosome {
	constructor(str, target) {
		super();
		this.str = str;
		this.target = target;
	}

	static get settings() {
		return {
			crossoverRate: 0.2,
			mutationRate: 0.05
		};
	}

	static create(target) {
		let chars = _.times(target.length, () => {
			let charIndex = Math.floor(Math.random() * alphabet.length);
			return alphabet[charIndex];
		});
		return new this(chars.join(''), target);
	}

	getFitness() {
		let diff = 0;
		for (let i = 0; i < this.str.length; i += 1) {
			let charIndex = alphabet.indexOf(this.str[i]);
			let targetIndex = alphabet.indexOf(this.target[i]);
			diff += Math.abs(charIndex - targetIndex);
		}
		return 1 / diff;
	}

	crossover(other) {
		return geneLib.uniformCrossover(this.str, other.str)
			.map((childStr) => new this.constructor(childStr, this.target));
	}

	mutate(rate) {
		let mutationIndices = geneLib.getRandomIndices(this.str.length, rate);
		let resultChars = [];
		for (let i = 0; i < this.str.length; i += 1) {
			let char = this.str[i];
			if (_.includes(mutationIndices, i)) {
				let charIndex = alphabet.indexOf(char);
				let mutation = (Math.random() < 0.5) ? 1 : -1;
				let newIndex = alphabet.length + charIndex + mutation;
				resultChars.push(alphabet[newIndex % alphabet.length]);
			} else {
				resultChars.push(char);
			}
		}
		return new this.constructor(resultChars.join(''), this.target);
	}
}

module.exports = Phrase;
