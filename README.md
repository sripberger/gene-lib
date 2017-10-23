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
		// Argument(s) can be specified in settings later.
	}

	getFitness() {
		// Return a number representing the chromosome's fitness.
		// You must always implement this method.
	}

	crossover(other) {
		// Return an array of children based on some crossover with other.
		// You must implement this if and only if you set the crossover rate,
		// or if the manualCrossoverCheck setting is true.
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
individuals, with a crossover rate of 0.2 and a mutation rate of 0.05. The
selection method defaults to deterministic binary tournament:

```js
const geneLib = require('gene-lib');
const MyChromosome = require('./path/to/my-chromosome');

geneLib.run({
	chromosomeClass: MyChromosome,
	generationSize: 100,
	generationLimit: 1000,
	createArg: 'create argument',
	crossoverRate: 0.2,
	mutationRate: 0.05
})
	.then(() => {
		console.log(result);
		/*
		{
			generationCount: Number of generations that were run.
			best: {
				fitness: Highest fitness produced by the GA,
				chromosome: Best MyChromosome instance produced by the GA
			},
			individuals: [
				Array of all individuals in final generation, each
				with the same properties as `best` above.
			]
		}
		*/
	});
```

The `::run` method will place processing for each generation at the end of the
event loop queue. This helps prevent it from blocking execution for too long,
which you definitely want in most cases. See the first entry in
[this article](https://www.toptal.com/nodejs/top-10-common-nodejs-developer-mistakes)
for a great explanation of why this is.


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
  generationLimit has not yet been reached. Defaults to Infinity. Set to false
  to disable this behavior completely.
- **crossoverRate**: The fraction of individuals in each generation that should
  be produced through crossover operations, on average. Defaults to zero. You'll
  want to set either this, the mutationRate, or both, otherwise generations will
  not evolve and your GA will do nothing useful.
- **manualCrossoverCheck**: Set to true to bypass internal rate-checking of
  crossover operations. See 'Manual Crossover Checks' below for more
  information.
- **parentCount**: Can be used to specify the number of parents per crossover
  operation. Must be an integer greater than 1. Defaults to 2. See 'Unsusual
  Crossovers' below for more information.
- **childCount**: Can be used to specify the number of children per crossover
  operation. Must be a positive integer that is also a factor of the
  generationSize. Defaults to 2. See 'Unusual Crossovers' below for more
  information.
- **mutationRate**: Fractional rate of mutation. Defaults to zero. You'll want
  to set either this, the crossoverRate, or both, otherwise generations will not
  evolve and your GA will do nothing useful.
- **async**: Set to specify asynchronous operation. Set any of its properties
  to true to cause that operation to become asynchronouse. Set a property to a
  number to specify concurrency, which is otherwise assumed to be 1. See the
  'Asynchronous Operations' section below for more information.
    - **async.add**: Setting for selector `#add` operations.
	- **async.selector**: Setting for selector `#select` operations.
	- **async.create**: Setting for chromosome `::create` operations.
	- **async.getFitness**: Setting for chromosome `#getFitness` operations.
	- **async.crossover**: Setting for chromosome `#crossover` operations.
	- **async.mutate**: Setting for chromosome `#mutate` operations.
- **onGeneration**: A function that will be invoked after each generation,
  including the 0-th generation. Receives an argument indicating the current
  state of the algorithm, in the same format as the final result, described
  above.


## Class-Level Settings

Some of the settings above are directly tied to your chromosome and/or selector
implementations. For these, it could make more sense to specify the settings
on the chromosome or selector classes themselves. To do this, simply have a
static `settings` property on the appropriate class. You can do this with a
getter:

```js
const { Chromosome } = require('gene-lib')

class MyChromosome extends Chromosome {
	static get settings() {
		return {
			crossoverRate: 0.2,
			mutationRate: 0.05
		};
	}

	// Other chromosome methods...
}
module.exports = MyChromosome;
```

or by simply assigning it:

```js
const { Selector } = require('gene-lib');

class MySelector extends Selector()  {
	// Implement selector here...
}

MySelector.settings = {
	selectorSettings: { foo: 'bar' }
};

module.exports = MySelector;
```

Settings provided directly to the `::run` method will always take priority over
class-level settings, and not all settings are supported on the class level.

Supported class-level settings for selectors include:

- **selectorSettings**: Will become defaults to be applied to any
  selectorSettings provided to the `::run` method.
- **async.add**
- **async.select**

Supported class-level settings for chromosomes include:

- **solutionFitness**
- **crossoverRate**
- **manualCrossoverCheck**
- **parentCount**
- **childCount**
- **mutationRate**
- **async.create**
- **async.getFitness**
- **async.crossover**
- **async.mutate**


## Manual Crossover Checks

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

To do this, set the `manualCrossoverCheck` option to true. This will cause the
`crossover` method to be invoked for every selected set of parents. The
crossoverRate will be passed to the `crossover` method as its last argument.
You should do your rate checks against this argument in order to maintain the
ability to easily tweak the crossover rate through `geneLib::run` settings:

```js
const { Chromosome } = require('gene-lib');

class ManualChromosome extends Chromosome {
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

module.exports = ManualChromosome;
```

```js
const geneLib = require('gene-lib');
const ManualChromosome = require('./path/to/manual-chromosome');

geneLib.run({
	chromosomeClass: ManualChromosome
	generationSize: 100
	generationLimit: 1000,
	crossoverRate: 0.5,
	manualCrossoverCheck: true
})
	.then((result) => {
		// ...
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

geneLib.run({
	chromosomeClass: WeirdChromosome
	generationSize: 100
	generationLimit: 1000,
	crossoverRate: 0.7,
	parentCount: 3,
	childCount: 1
})
	.then((result) => {
		// ...
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

geneLib.run({
	chromosomeClass: MyChromosome,
	selectorClass: MySelector,
	generationSize: 100,
	generationLimit: 1000,
	crossoverRate: 0.7,
	mutationRate: 0.01
})
	.then((result) => {
		// ...
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

geneLib.run({
	chromosomeClass: MyChromosome,
	selector: 'my-selector',
	generationSize: 100,
	generationLimit: 1000,
	crossoverRate: 0.7,
	mutationRate: 0.01
})
	.then((result) => {
		// ...
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
		// ...
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
		// ...
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
		// ...
	});
```

If concurrent operations involve a request to some external service-- as they
often will-- make sure not to set these concurrencies too high, otherwise
you might overload that service with simultaneous requests.


## Fully Synchronous Operation

If you're 100% sure that you won't need to unblock execution for the entire
run, you can force it to take place in a single event loop iteration using the
`::runSync` method:

```js
const geneLib = require('gene-lib');
const MyChromosome = require('./path/to/my-chromosome');

let result = geneLib.runSync({
	chromosomeClass: MyChromosome,
	generationSize: 100,
	generationLimit: 1000,
	createArg: 'create argument',
	crossoverRate: 0.2,
	mutationRate: 0.05
});

// ...
```

As you can see, the result is returned directly instead of being wrapped in a
promise. Of course, when using this method, none of the `async` settings above
are supported. This method will throw if you attempt to use them.

This method will be slightly faster than `::run` and maybe a little more
convenient in some cases, but save yourself some trouble and avoid using it in
web services or other multi-user applications. You should *only* use it if
you're writing a command-line script or some other application that does not
need to share its thread.


## Utility Methods

In addition to everything described thus far, `gene-lib` also comes with some
utility methods to help you with your chromosome methods. `::getCrossoverRange`,
for example, can help with a two-point crossover:

```js
const lodash = require('lodash');
const geneLib = require('geneLib');
const { Chromosome } = geneLib;

class MyChromosome extends Chromosome {
	// ...

	crossover(other) {
		// Assume 'genes' is an array property on each chromosome, containing
		// its genetic data, and all chromosomes have the same number of genes:
		let [ start, end ] = geneLib.getCrossoverRange(this.genes.length);

		// Create two new instances. Assume they each have an empty genes array.
		let children = _.times(2, () => new MyChromosome());

		// Iterate through parents, copying genes into one child or another
		// based on the crossover range.
		for (let i = 0; i < this.genes.length; i += 1) {
			if (_.inRange(i, start, end)) {
				children[1].genes[i] = this.genes[i];
				children[0].genes[i] = other.genes[i];
			} else {
				children[0].genes[i] = this.genes[i];
				children[1].genes[i] = other.genes[i];
			}
		}

		// And we're done.
		return children;
	}
}

module.exports = MyChromosome;
```

Utilities include:

- `::getCrossoverPoint` for single point crossovers.
- `::getCrossoverRange` demonstrated above.
- `::getCrossoverIndices` for uniform crossover with a ratio of 0.5.
- `::pmx` Performs a [partially matched crossover](http://www.wardsystems.com/manuals/genehunter/crossover_of_enumerated_chromosomes.htm)
  between two arrays.

Check out the api docs for more information.


## Phrase Solver Example

For a simple example of `gene-lib` in action, check out the
[phrase solver](https://github.com/sripberger/gene-lib/blob/master/test/lib/phrase.js)
in the
[integration tests](https://github.com/sripberger/gene-lib/blob/master/test/integration/phrase-solver.js).


## Similar Projects

Currently on npm there are a lot of competing projects in this space without a
clear winner. I created `gene-lib` mainly for my own enjoyment and because all
of the existing projects had something about them I that didn't quite like.

- [darwin-js](https://www.npmjs.com/package/darwin-js) - Similar idea, but far,
  simpler. Can be both a good thing and a bad thing. As of this writing, it only
  supports asynchronous fitness scoring, and even that must occur in series.
- [genetic](https://www.npmjs.com/package/genetic) - I think this is a bit more
  targeted towards browsers. Everything is callback-based, which avoids the
  issue of creating lots of unnecessary promises, but that does make it a bit
  less nice to use, depending on who you ask.
- [genetic-js](https://www.npmjs.com/package/genetic-js) - Seems to be one of
  the more popular ones. I'm not a big fan of the api or its documentation,
  though much of that is just personal preference, I guess.
- [geneticalgorithm](https://www.npmjs.com/package/geneticalgorithm) - Gives me
  similar feelings to `genetic-js`.

There are a lot more that I couldn't hope to list here. Feel free to search
around on npm, if you're interested. I won't tell you which one to use, though
I hope I've made a pretty good case for `gene-lib`.
