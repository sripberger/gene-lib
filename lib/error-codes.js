const XError = require('xerror');

XError.registerErrorCode('invalid_result', {
	message: 'Invalid result from a user-provided method or function.'
});
