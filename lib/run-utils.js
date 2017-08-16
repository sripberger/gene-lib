const Runner = require('./runner');

exports.run = function(settings) {
	return Runner.create(exports.processSettings(settings))
		.then((runner) => runner.run())
		.then((result) => result.chromosome);
};
