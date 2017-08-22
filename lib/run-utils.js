const Runner = require('./runner');

exports.runSync = function(settings) {
	return Runner.createSync(settings).runSync().chromosome;
};

exports.runAsync = function(settings) {
	return Runner.createAsync(settings)
		.then((runner) => runner.runAsync())
		.then((best) => best.chromosome);
};
