const Runner = require('./runner');
const settingsUtils = require('./settings-utils');

exports.run = function(settings) {
	let normalizedSettings = settingsUtils.normalize(settings);
	if (!normalizedSettings.async) return exports.runSync(normalizedSettings);
	return exports.runAsync(normalizedSettings);
};

exports.runSync = function(settings) {
	return Runner.createSync(settings).runSync().chromosome;
};

exports.runAsync = function(settings) {
	return Runner.createAsync(settings)
		.then((runner) => runner.runAsync())
		.then((best) => best.chromosome);
};
