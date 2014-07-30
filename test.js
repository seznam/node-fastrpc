var assert = require('assert');
var expect = require('chai').expect;
var nodePkg = require('./package.json');
var bowerPkg = require('./bower.json');
var frpc = require('./frpc');

var method = "method";
var params = [
    567188429000,                        // int
    -567188429000,                       // negative int
    true,                                // bool
    false,                               // bool
    (100).toFixed(2),                    // double
    "Name",                              // string
    new Date("1987/12/22 17:20:29"),     // datetime
    101 >> 1,                            // binary
    7,                                   // positive
    -8,                                  // negative
    {                                    // struct
        name: "David",
        surname: "Rus",
        date: new Date("1987/12/22 17:20:29")
    },
    [0, 1, "text"],                      // array
    null                                 // null
];

var frpcBinaryBase64Data = "yhECAWgGbWV0aG9kPMiYEA+ERMiYEA+EERAgBjEwMC4wMCAETmFtZSj8zZvOIeqoaHkwODI4B0AIUAMEbmFtZSAFRGF2aWQHc3VybmFtZSADUnVzBGRhdGUo/M2bziHqqGh5MFgDQAA4ASAEdGV4dGA=";

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

    describe('serialize call', function(){
        it('object to binary data', function(){
            var frpcData = new Buffer(frpc.serializeCall(method, params));
            var b64 = frpcData.toString('base64');
            assert.equal(b64, frpcBinaryBase64Data);
        });
    });

    describe('deserialize call', function(){
        it('binary data to json object', function(){
            var data = frpc.parse(new Buffer(frpcBinaryBase64Data, 'base64'));
            assert.equal(data.method, method);

            for (var i = 0; i < data.params.length; i++) {
                if (i == 6) {
                    console.log(data.params[i]);
                    console.log(params[i]);
                    assert.equal(data.params[i].getTime(), params[i].getTime());
                } else {
                    if (typeof(data.params[i]) == "object") {
                        assert.equal(JSON.stringify(data.params[i]), JSON.stringify(params[i]));
                    } else {
                        assert.equal(data.params[i], params[i]);
                    }
                }
            }
        });
    });
});
