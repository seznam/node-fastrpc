var assert = require('assert');
var expect = require('chai').expect;
var nodePkg = require('./package.json');
var bowerPkg = require('./bower.json');
var frpc = require('./frpc');

var testDate = "1987-12-22T16:20:29.000Z";
var method = "method";
var params = [
    123,                                 // int
    true,                                // bool
    false,                               // bool
    (100).toFixed(2),                    // double
    "Name",                              // string
    new Date(testDate),                  // datetime
    101 >> 1,                            // binary
    567188429000,                        // positive
    -567188429000,                       // negative
    {                                    // struct
        name: "David",
        surname: "Rus",
        date: new Date(testDate)
    },
    [0, 1, "text"],                      // array
    null                                 // null
];

var testDataBase64 = "yhECAWgGbWV0aG9kOHsRECAGMTAwLjAwIAROYW1lKADNm84h6ihoeTA4MjzImBAPhETImBAPhFADBG5hbWUgBURhdmlkB3N1cm5hbWUgA1J1cwRkYXRlKADNm84h6ihoeTBYA0AAOAEgBHRleHRg";
var testDataBuffer = new Buffer(testDataBase64, 'base64');

before(function() {
    // Force UTC as a local timezone

    Date.prototype.real_getTimezoneOffset = Date.prototype.getTimezoneOffset;
    Date.prototype.real_getHours = Date.prototype.getHours;
    Date.prototype.real_getMinutes = Date.prototype.getMinutes;

    Date.prototype.getHours = function() {
        var offset = parseInt(this.real_getTimezoneOffset() / 60);
        return this.real_getHours() + offset;
    };

    Date.prototype.getMinutes = function() {
        var offset = this.real_getTimezoneOffset() % 60;
        return this.real_getMinutes() + offset;
    };

    Date.prototype.getTimezoneOffset = function() {
        return 0;
    };
});

describe('node-fastrpc', function() {
    describe('metadata', function() {
        it('bower.json vs. package.json', function() {
            assert.equal(nodePkg.name, bowerPkg.name);
            assert.equal(nodePkg.version, bowerPkg.version);
            assert.equal(nodePkg.description, bowerPkg.description);
            assert.equal(nodePkg.license, bowerPkg.license);
            assert.equal(nodePkg.main, bowerPkg.main);
        });
    });

    describe('methods', function(){
        it('serializeCall()', function(){
            var bin = frpc.serializeCall(method, params);
            var data = new Buffer(bin);
            expect(data).to.deep.equal(testDataBuffer);
        });

        it('parse()', function(){
            var data = frpc.parse(testDataBuffer);
            expect(data.method).to.be.equal(method);
            expect(JSON.stringify(data.params)).to.deep.equal(JSON.stringify(params));
        });
    });
});
