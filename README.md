# gene-lib

An object-oriented genetic algorithm framework with support for asynchronous
operations at any stage of the algorithm.


## Creating a Chromosome Class

Start by creating a chromosome class and implementing the required methods:

```js
const { Chromosome } = require('gene-lib');

class MyChromosome extends Chromosome {
	constructor() {
		// Initialize MyChromosome instance, as needed.
	}

	static create(arg) {
		// Return a new instance of MyChromosome for the first generation.
		// Argument can be specified in settings later.
	}

	getFitness() {
		// Return a number representing the chromosome's fitness.
	}

	crossover(other) {
		// Return an array of children based on some crossover with other.
		// You must implement this if and only if you set the crossover rate.
	}

	mutate(rate) {
		// Return a mutated copy, based on the provided rate.
		// You must implement this if and only if you set the mutation rate.
	}
}

module.exports = MyChromosome;
```


## Invoking the Run Method

Once your Chromosome class is created, you can easily run the GA using the
`geneLib::run` method. The following will run 1000 generations of 100
individuals, with a crossover rate of 0.2 and a mutation rate of 0.5. The
selection method defaults to deterministic binary tournament:

```js
const geneLib = require('gene-lib');
const MyChromosome = require('./path/to/my-chromosome');

let result = geneLib.run({
	chromosomeClass: MyChromosome,
	generationSize: 100,
	generationLimit: 1000,
	createArg: 'create argument',
	crossoverRate: 0.2,
	mutationRate: 0.05
});

console.log(result);
// `result` will be the best instance of MyChromosome produced by the GA.
```


## Settings Breakdown

- **chromosomeClass**: This is your chromosome class constructor. It need not
  actually inherit from gene-lib's `Chromosome` class, but it must implement
  all required methods shown above, including the static `create` method.
- **createChromosome**: As an alternative to chromosomeClass, you may specify
  a factory function that simply returns a chromosome object each time it is
  invoked. These objects must implement all required instance methods, including
  `getFitness` and potentially `crossover` and/or `mutate`.
- **createArg**: Can be used to specify an argument for the `create` method or
  `createChromosome` function, if any.
- **createArgs**: If you want multiple create arguments, use this instead of
  `createArg` and specify them as an array.
- **selector**: Specify the selection method, as a string. Defaults to
  'tournament', indicating tournament selection. Also available is 'roulette'
  for fitness-proportional selection. Custom selectors can be added using the
  `geneLib::registerSelector` method, described later in this README.
- **selectorClass**: Instead of using the selector option, you may specify a
  custom selector class directly here.
- **selectorSettings**: Specify options specific to your selection method, as
  a nested object. Check the documentation for your selecor for more info.
  In the case of tournament selection, you can specify the following:
    - **tournamentSize**: Number of individuals selected for the tournament.
      Defaults to 2, for binary tournament.
    - **baseWeight**: Probability of selecting the top individual in the
      tournament. Defaults to 1, for a deterministic tournament.
- **generationSize***: Specifies the number of individuals in each generation.
  This setting must be provided, and it must be a positive integer that is also
  a multiple of the childCount.
- **generationLimit**: Specifies the maximum number of generations to run.
  Defaults to infinity, meaning the algorithm will not stop until a solution
  is found, as specified by the solutionFitness setting.
- **solutionFitness**: If an individual ever meets or exceeds this fitness,
  the algorithm will stop and return that individual, even if the
  generationLimit has not yet been reached. Defaults to Infinity.
- **crossoverRate**: The fraction of individuals in each generation that should
  be produced through crossover operations, on average. Defaults to zero. You'll
  want to set either this, the mutationRate, or both, otherwise generations will
  not evolve and your GA will do nothing useful.
- **compoundCrossover**: Set to true to bypass internal rate-checking of
  crossover operations. See 'Compound Crossovers' below for more information.
- **parentCount**: Can be used to specify the number of parents per crossover
  operation. Must be an integer greater than 1. Defaults to 2. See 'Unsusual
  Crossovers' below for more information.
- **childCount**: Can be used to specify the number of children per crossover
  operation. Must be a positive integer that is also a factor of the
  generationSize. Defaults to 2. See 'Unsusual Crossovers' below for more
  information.
- **mutationRate**: Fractional rate of mutation. Defaults to zero. You'll want
  to set either this, the crossoverRate, or both, otherwise generations will not
  evolve and your GA will do nothing useful.


## Compound Crossovers

## Unusual Crossovers

## Caching Chromosomes

## Custom Selectors

## Asynchronous Operations

## Phrase Solver Example

## Similar Libraries
