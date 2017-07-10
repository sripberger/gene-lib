const { Individual } = require('../../lib');
const _ = require('lodash');
const alphabet = 'abcdefghijklmnopqrstuvwxyz !,';

class Phrase extends Individual {
	constructor(str, target) {
		super();
		this.str = str;
		this.target = target;
	}

	static create(target) {
		let chars = _.times(target.length, () => {
			let charIndex = Math.floor(Math.random() * alphabet.length);
			return alphabet[charIndex];
		});
		return new Phrase(chars.join(''), target);
	}

	calculateFitnessScore() {
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
		return new Phrase(resultChars.join(''), this.target);
	}

	crossover(other) {
		let leftChars = [];
		let rightChars = [];
		for (let i = 0; i < this.str.length; i += 1) {
			if (Math.random() > 0.5) {
				leftChars.push(this.str.charAt(i));
				rightChars.push(other.str.charAt(i));
			} else {
				leftChars.push(other.str.charAt(i));
				rightChars.push(this.str.charAt(i));
			}
		}
		return [
			new Phrase(leftChars.join(''), this.target),
			new Phrase(rightChars.join(''), this.target)
		];
	}
}

module.exports = Phrase;
