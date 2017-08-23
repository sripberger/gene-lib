const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.use(sinonChai);
global.expect = chai.expect;

beforeEach(function() {
	global.sandbox = sinon.sandbox.create();
});

afterEach(function() {
	global.sandbox.restore();
});
