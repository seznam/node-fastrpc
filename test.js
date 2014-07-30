var assert = require('assert');
var expect = require('chai').expect;
var nodePkg = require('./package.json');
var bowerPkg = require('./bower.json');
var frpc = require('./frpc.js');

var method = "method";
var params = [
    2589983,                             // int
    true,                                // bool
    false,                               // bool
    (100).toFixed(2),                    // double
    "Name",                              // string
    new Date("1987/12/22 17:20:29"),     // datetime
    101 >> 1,                            // binary
    7,                                   // positive
    -8,                                  // negative
    {                                    // struct
        name:"David",
        surname:"Rus",
        date:new Date("1987/12/22 17:20:29")
    },
    [0,1,"text"],                        // array
    null                                 // null
];

var frpcBinaryBase64Data = "yhECAWgGbWV0aG9kOh+FJxEQIAYxMDAuMDAgBE5hbWUo/M2bziHqqGh5MDgyOAdACFADBG5hbWUgBURhdmlkB3N1cm5hbWUgA1J1cwRkYXRlKPzNm84h6qhoeTBYA0AAOAEgBHRleHRg";

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
            var frpcData = frpc.serializeCall(method, params);
            assert.equal(typeof(frpcData), "object");
            assert.equal(frpcData.length, 105);
        });

        it('frpc binary data to base64', function(){
            var frpcBase64Data = frpc.btoa(frpc.serializeCall(method, params));
            assert.equal(frpcBase64Data, frpcBinaryBase64Data);
        });
    });

    describe('deserialize call', function(){
        it('base64 to binary data', function(){
            var frpcData = frpc.atob(frpcBinaryBase64Data);
            assert.equal(frpcData.length, 105);
        });

        it('binary data to json object', function(){
            var data = frpc.parse(frpc.atob(frpcBinaryBase64Data));
            assert.equal(data.method, method);

            for (var i = 0; i < data.params.length; i++) {
                if (i == 5) {
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
