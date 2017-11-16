const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

// Ensure error codes are registered.
require('../lib/error-codes');

chai.use(sinonChai);
global.expect = chai.expect;

beforeEach(function() {
	global.sandbox = sinon.sandbox.create();
});

afterEach(function() {
	global.sandbox.restore();
});
