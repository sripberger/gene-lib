const { Chromosome, uniformCrossover } = require('../../lib');
const _ = require('lodash');
const alphabet = 'abcdefghijklmnopqrstuvwxyz !,';

class Phrase extends Chromosome {
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
			let charIndex = alphabet.indexOf(this.str.charAt(i));
			let targetIndex = alphabet.indexOf(this.target.charAt(i));
			diff += Math.abs(charIndex - targetIndex);
		}
		return 1 / diff;
	}

	mutate(rate) {
		let resultChars = [];
		for (let i = 0; i < this.str.length; i += 1) {
			let char = this.str.charAt(i);
			if (Math.random() > rate) {
				resultChars.push(char);
			} else {
				let charIndex = alphabet.indexOf(char);
				let mutation = (Math.random() < 0.5) ? 1 : -1;
				let resultIndex = alphabet.length + charIndex + mutation;
				let resultChar = alphabet.charAt(resultIndex % alphabet.length);
				resultChars.push(resultChar);
			}
		}
		return new this.constructor(resultChars.join(''), this.target);
	}

	crossover(other) {
		return uniformCrossover(this.str, other.str)
			.map((childStr) => new this.constructor(childStr, this.target));
	}
}

module.exports = Phrase;
