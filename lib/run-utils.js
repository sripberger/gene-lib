const Runner = require('./runner');
const settingsUtils = require('./settings-utils');

exports.run = function(settings) {
	let processedSettings = settingsUtils.process(settings);
	if (!processedSettings.async) return exports.runSync(processedSettings);
	return exports.runAsync(processedSettings);
};

exports.runSync = function(settings) {
	return Runner.createSync(settings).runSync().chromosome;
};

exports.runAsync = function(settings) {
	return Runner.createAsync(settings)
		.then((runner) => runner.runAsync())
		.then((best) => best.chromosome);
};
