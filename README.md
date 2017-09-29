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
		// You must always implement this method.
	}

	crossover(other) {
		// Return an array of children based on some crossover with other.
		// You must implement this if and only if you set the crossover rate,
		// or if the compoundCrossover setting is true.
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


## Run Method Settings

- **chromosomeClass**: This is your chromosome class constructor. It need not
  actually inherit from `gene-lib`'s `Chromosome` class, but it must implement
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

As a convenience, `gene-lib` performs checks against the crossover rate
internally. Normally, if two parents are selected and are determined to not
cross over with each other, they are simply copied into the next generation
without invoking the `crossover` method at all. This is what allows you to
skip implementing the `crossover` method if your crossover rate is zero.

This is great for most genetic algorithms, where crossovers either do or don't
happen on at the chromosome level. Sometimes, however, it's useful to break your
chromosomes down into component genes, each of which may or may not cross over
with its counterpart gene in another chromosome.

One such GA could be used to solve the
[ordered clustered traveling salesman problem](https://www.hindawi.com/journals/tswj/2014/258207/).
The path through each segment would be a gene, and crossover rate checks would
need to occur at the gene level rather than the chromosome level.

To do this, set the `compoundCrossover` option to true. This will cause the
`crossover` method to be invoked for every selected set of parents. The
crossoverRate will be passed to the `crossover` method as its last argument.
You should do your rate checks against this argument in order to maintain the
user's ability to easily tweak the crossover rate through `geneLib::run`
settings:

```js
const { Chromosome } = require('gene-lib');

class CompoundChromosome extends Chromosome {
	create() {
		// Return a new instance, as usual.
	}

	getFitness() {
		// Return fitness, as usual.
	}

	crossover(other, rate) {
		// Check each gene for crossover individually while creating children.
	}
}

module.exports = WeirdChromosome;
```

```js
const geneLib = require('gene-lib');
const CompoundChromosome = require('./path/to/compound-chromosome');

let result = geneLib.run({
	chromosomeClass: CompoundChromosome
	generationSize: 100
	generationLimit: 1000,
	crossoverRate: 0.5,
	compoundCrossover: true
});
```


## Unusual Crossovers

For most GA's, you'll have exactly two parents and exactly two chidren per
crossover. Just in case you need it, however, `gene-lib` provides you with the
ability to change either of these numbers using the parentCount and childCount
settings.

The parentCount must always be greater than one, and the childCount must always
be positive. In addition, the childCount must be a factor of the generationSize.
Otherwise, it would not be possible to create a generation of that size through
crossover operations.

Even though these are configurable, your crossover method must always accept
the same number of parents and return the same number of children.

The following example does crossovers with three parents and one child:

```js
const { Chromosome } = require('gene-lib');

class WeirdChromosome extends Chromosome {
	create() {
		// Return a new instance, as usual.
	}

	getFitness() {
		// Return fitness, as usual.
	}

	crossover(a, b) {
		// Return a crossover of this, a, and b, producing only one child.
		// You may return this child by itself, without wrapping it in an array.
	}
}

module.exports = WeirdChromosome;
```

```js
const geneLib = require('gene-lib');
const WeirdChromosome = require('./path/to/weird-chromosome');

let result = geneLib.run({
	chromosomeClass: WeirdChromosome
	generationSize: 100
	generationLimit: 1000,
	crossoverRate: 0.7,
	parentCount: 3,
	childCount: 1
});
```


## Caching Fitness On Chromosomes

Normally, the `#getFitness` method is only called once on each chromosome.
Its result is stored internally as part of the `::run`  method, so you don't
need to worry about caching it yourself. In some cases, however, you may want
access to the fitness in the other chromosome methods. As a convenience for
these cases, `gene-lib` provides the `CachingChromosome` base class:

```js
const { CachingChromosome } = require('gene-lib');
const _ = require('lodash');

class MyCachingChromosome extends CachingChromosome {
	calculateFitness() {
		// Implement this instead of #getFitness. The first #getFitness call
		// will invoke this method and return its result. All subsequent
		// #getFitness calls will return the same result without invoking
		// #calculateFitness again.
	}

	crossover(other) {
		// Assume doCrossover produces an array of child instances.
		let children = doCrossover(this, other);

		// Return only the highest-fitness child. The fitness result will be
		// reused later when gene-lib needs it.
		return _.maxBy(children, (child) => child.getFitness());
	}
}

module.exports = MyCachingChromosome;
```


## Custom Selectors

`gene-lib` comes with tournament and roulette selection methods. If you need
others, create one by extending the `Selector` class:

```js
const { Selector } = require('gene-lib');

class MySelector extends Selector {
	constructor(settings) {
		// Settings object will be provided by the settings.selectorSettings
		// ::run argument.
		super(settings);

		// Do any additional initialization here.
	}

	add(individual) {
		// Store individual in the selector. The individual will be an object
		// with two properties: 'fitness' and 'chromosome'.
	}

	select() {
		// Return a single stored individual.
	}
}

module.exports = MySelector;
```

Then provide the selector to the run method:

```js
const geneLib = require('geneLib');
const MyChromosome = require('./path/to/my-chromosome');
const MySelector = require('./path/to/my-selector');

let result = geneLib.run({
	chromosomeClass: MyChromosome,
	selectorClass: MySelector,
	generationSize: 100,
	generationLimit: 1000,
	crossoverRate: 0.7,
	mutationRate: 0.01
});

```


### Array Selectors

Since most selectors will store individuals in an array, the `ArraySelector`
base class is provided as a convenience. Its constructor creates an empty
array on `this.individuals`, and its `#add` method simply pushes the provided
individual onto that array:

```js
const { ArraySelector } = require('gene-lib');

class MyArraySelector extends ArraySelector {
	select() {
		// Return a single individual from this.individuals.
	}
}

module.exports = MyArraySelector;
```


### Registering New Selectors

If you need your custom selection methods to be used more easily, you can
register them globally with `gene-lib`:

```js
const geneLib = require('geneLib');
const MySelector = require('./path/to/my-selector');

geneLib.registerSelector('my-selector', MySelector);
```

```js
const geneLib = require('geneLib');
const MyChromosome = require('./path/to/my-chromosome');

let result = geneLib.run({
	chromosomeClass: MyChromosome,
	selector: 'my-selector',
	generationSize: 100,
	generationLimit: 1000,
	crossoverRate: 0.7,
	mutationRate: 0.01
});
```


## Asynchronous Operations

In Node frameworks it is common to support potentially asynchronous operations
by simply wrapping the user-provided result with
[`Promise::resolve`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/resolve).
This allows the user to return a promise for asynchronous operation, or anything
else for synchronous operation.

For genetic algorithms, however, this approach has too great an impact on
performance, as it requires thousands of promises to be created every second.
Instead, `gene-lib` assumes that every operation will be synchronous by default,
since this will be the case for most genetic algorithms. If any operation in
your GA needs to be asynchronous, you must declare it to be so explicitly using
the `settings.async` `::run` argument.

For example, if your `#getFitness` method must make a request to a database,
have it return a promise that resolves with the fitness. Then set the
`getFitness` property on `settings.async`:

```js
const geneLib = require('gene-lib');
const MyChromosome = require('./path/to/my-chromosome');

geneLib.run({
	chromosomeClass: MyChromosome,
	generationSize: 100,
	generationLimit: 1000,
	crossoverRate: 0.7,
	mutationRate: 0.01,
	async: {
		getFitness: true
	}
})
	.then((result) => {
		// As you can see, since async was set, ::run now returns a promise
		// that will resolve with the result.
	});
```

You can make any combination of operations asynchronous if you wish. Even
selector operations, though this will of course require a custom selector:

```js
const geneLib = require('gene-lib');
const MyChromosome = require('./path/to/my-chromosome');
const MySelector = require('./path/to/my-selector');

geneLib.run({
	chromosomeClass: MyChromosome,
	selectorClass: MySelector,
	generationSize: 100,
	generationLimit: 1000,
	crossoverRate: 0.7,
	mutationRate: 0.01,
	async: {

		// Chromosome operations.
		create: true,
		getFitness: true,
		crossover: true,
		mutate: true,

		// Selector operations.
		add: true,
		select: true
	}
})
	.then((result) => {
		// This will probably be really slow, but you can do it if you want.
	});
```


### Concurrencies

By default, asynchronous operations are done in series, but concurrency is
supported. Simply provide the maximum number of simultaneous operations as the
value in the `async` object:

```js
const geneLib = require('gene-lib');
const MyChromosome = require('./path/to/my-chromosome');

geneLib.run({
	chromosomeClass: MyChromosome,
	generationSize: 100,
	generationLimit: 1000,
	crossoverRate: 0.7,
	mutationRate: 0.01,
	async: {
		create: 4,
		getFitness: 2,
	}
})
	.then((result) => {
		// This will allow 4 concurrent ::create calls during the chromosome
		// creation stage, and 2 concurrent #getFitness calls during fitness
		// calculation stages.
	});
```

If concurrent operations involve a request to some external service-- as they
often will-- make sure not to set these concurrencies too high, otherwise
you might overload that service with simultaneous requests.


## Utility Functions

## Phrase Solver Example

## Similar Libraries
