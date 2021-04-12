(function(module, win) {
    /**
     * @class FRPC parser a serializator
     */
    var TYPE_MAGIC     = 25;
    var TYPE_CALL      = 13;
    var TYPE_RESPONSE  = 14;
    var TYPE_FAULT     = 15;

    var TYPE_INT       = 1;
    var TYPE_BOOL      = 2;
    var TYPE_DOUBLE    = 3;
    var TYPE_STRING    = 4;
    var TYPE_DATETIME  = 5;
    var TYPE_BINARY    = 6;
    var TYPE_INT8P     = 7;
    var TYPE_INT8N     = 8;
    var TYPE_STRUCT    = 10;
    var TYPE_ARRAY     = 11;
    var TYPE_NULL      = 12;

    /**
     * @param {number} number
     */
    var Double = function(number) {
        this.number = number;
    };

    var _arrayBuffers = false;
    var _hints = null;
    var _path = [];
    var _data = [];
    var _pointer = 0;

    /**
     * @param {number[]} data
     * @param {{ arrayBuffers?: boolean }} [options]
     * @returns {object}
     */
    var parse = function(data, options) {
        _arrayBuffers = options && options.arrayBuffers || false;
        _pointer = 0;
        _data = data;

        var magic1 = _getByte();
        var magic2 = _getByte();

        if (magic1 != 0xCA || magic2 != 0x11) {
            _data = [];
            throw new Error("Missing FRPC magic");
        }

        /* zahodit zbytek hlavicky */
        _getByte();
        _getByte();

        var first = _getInt(1);
        var type = first >> 3;
        if (type == TYPE_FAULT) {
            var num = _parseValue();
            var msg = _parseValue();
            _data = [];
            throw new Error("FRPC/"+num+": "+msg);
        }

        var result = null;

        switch (type) {
            case TYPE_RESPONSE:
                result = _parseValue();
                if (_pointer < _data.length) {
                    _data = [];
                    throw new Error("Garbage after FRPC data");
                }
            break;

            case TYPE_CALL:
                var nameLength = _getInt(1);
                var name = _decodeUTF8(nameLength);
                var params = [];
                while (_pointer < _data.length) { params.push(_parseValue()); }
                _data = [];
                return {method:name, params:params};
            break;

            default:
                _data = [];
                throw new Error("Unsupported TYPE "+type);
            break;
        }

        _data = [];
        return result;
    };

    /**
     * @deprecated Do not treat FastRPC type `binary`, type `double` respectively, as native JS class `Array`,
     * type `number` respectively, with hint. Treat FastRPC type `binary`, type `double` respectively, as native JS
     * class `ArrayBuffer`, non-native JS class `Double` respectively, instead.
     * @param {string} method
     * @param {array} data
     * @param {object || string} hints Napoveda datovych typu:
     * pokud string, pak typ (skalarni) hodnoty "data". Pokud objekt,
     * pak mnozina dvojic "cesta":"datovy typ"; cesta je teckami dodelena posloupnost
     * klicu a/nebo indexu v datech. Typ je "float" nebo "binary".
     *//**
     * @param {string} method
     * @param {array} data
     * @returns {number[]}
     */
    var serializeCall = function(method, data, hints) {
        var result = serialize(data, hints);

        /* utrhnout hlavicku pole (dva bajty) */
        result.shift(); result.shift();

        var encodedMethod = _encodeUTF8(method);
        result.unshift.apply(result, encodedMethod);
        result.unshift(encodedMethod.length);

        result.unshift(TYPE_CALL << 3);
        result.unshift(0xCA, 0x11, 0x02, 0x01);

        return result;
    };

    /**
     * @deprecated Do not treat FastRPC type `binary`, type `double` respectively, as native JS class `Array`,
     * type `number` respectively, with hint. Treat FastRPC type `binary`, type `double` respectively, as native JS
     * class `ArrayBuffer`, non-native JS class `Double` respectively, instead.
     * @param {?} data
     * @param {object} hints hinty, ktera cisla maji byt floaty a kde jsou binarni data (klic = cesta, hodnota = "float"/"binary")
     * @returns {number[]}
     *//**
     * @param {?} data
     * @returns {number[]}
     */
    var serialize = function(data, hints) {
        var result = [];
        _path = [];
        _hints = hints;

        _serializeValue(result, data);

        _hints = null;
        return result;
    };

    var _parseValue = function() {
        /* pouzite optimalizace:
         * - zkracena cesta ke konstantam v ramci redukce tecek
         * - posun nejpouzivanejsich typu nahoru
         */
        var first = _getInt(1);
        var type = first >> 3;
        var lengthBytes;

        switch (type) {
            case TYPE_STRING:
                var lengthBytes = (first & 7) + 1;
                var length = _getInt(lengthBytes);
                return _decodeUTF8(length);
            break;

            case TYPE_STRUCT:
                var result = {};
                var lengthBytes = (first & 7) + 1;
                var members = _getInt(lengthBytes);
                while (members--) { _parseMember(result); }
                return result;
            break;

            case TYPE_ARRAY:
                var result = [];
                var lengthBytes = (first & 7) + 1;
                var members = _getInt(lengthBytes);
                while (members--) { result.push(_parseValue()); }
                return result;
            break;

            case TYPE_BOOL:
                return (first & 1 ? true : false);
            break;

            case TYPE_INT:
                var length = first & 7;
                var max = Math.pow(2, 8*length);
                var result = _getInt(length);
                if (result >= max/2) { result -= max; }
                return result;
            break;

            case TYPE_DATETIME:
                _getByte();
                var ts = _getInt(4);
                for (var i=0;i<5;i++) { _getByte(); }
                return new Date(1000*ts);
            break;

            case TYPE_DOUBLE:
                return _getDouble();
            break;

            case TYPE_BINARY:
                var lengthBytes = (first & 7) + 1;
                var length = _getInt(lengthBytes);
                if (_arrayBuffers) {
                    var typedArray = new Uint8Array(length);
                    for (var i=0;i<length;i++) { typedArray[i] = _getByte(); }
                    return typedArray.buffer;
                }
                var result = [];
                while (length--) { result.push(_getByte()); }
                return result;
            break;

            case TYPE_INT8P:
                var length = (first & 7) + 1;
                return _getInt(length);
            break;

            case TYPE_INT8N:
                var length = (first & 7) + 1;
                return -_getInt(length);
            break;

            case TYPE_NULL:
                return null;
            break;

            default:
                throw new Error("Unkown TYPE " + type);
            break;
        }
    };

    var _append = function(arr1, arr2) {
        var len = arr2.length;
        for (var i=0;i<len;i++) { arr1.push(arr2[i]); }
    };

    var _parseMember = function(result) {
        var nameLength = _getInt(1);
        var name = _decodeUTF8(nameLength);
        result[name] = _parseValue();
    };

    /**
     * In little endian
     */
    var _getInt = function(bytes) {
        var result = 0;
        var factor = 1;

        for (var i=0;i<bytes;i++) {
            result += factor * _getByte();
            factor *= 256;
        }

        return result;
    };

    var _getByte = function() {
        if ((_pointer + 1) > _data.length) { throw new Error("Cannot read byte from buffer"); }
        return _data[_pointer++];
    };

    var _decodeUTF8 = function(length) {
        /* pouzite optimalizace:
         * - pracujeme nad stringem namisto pole; FF i IE to kupodivu (!) maji rychlejsi
         * - while namisto for
         * - cachovani fromCharcode, _data i _pointer
         * - vyhozeni _getByte
         */
        var remain = length;
        var result = "";
        if (!length) { return result; }

        var c = 0, c1 = 0, c2 = 0;
        var SfCC = String.fromCharCode;
        var data = _data;
        var pointer = _pointer;

        while (1) {
            remain--;
            c = data[pointer];
            pointer += 1;  /* FIXME safari bug */
            if (c < 128) {
                result += SfCC(c);
            } else if ((c > 191) && (c < 224)) {
                c1 = data[pointer];
                pointer += 1; /* FIXME safari bug */
                result += SfCC(((c & 31) << 6) | (c1 & 63));
                remain -= 1;
            } else if (c < 240) {
                c1 = data[pointer++];
                c2 = data[pointer++];
                result += SfCC(((c & 15) << 12) | ((c1 & 63) << 6) | (c2 & 63));
                remain -= 2;
            } else if (c < 248) { /* 4 byte stuff, throw away */
                pointer += 3;
                remain -= 3;
            } else if (c < 252) { /* 5 byte stuff, throw away */
                pointer += 4;
                remain -= 4;
            } else { /* 6 byte stuff, throw away */
                pointer += 5;
                remain -= 5;
            }

            /* pokud bylo na vstupu nevalidni UTF-8, mohli jsme podlezt... */
            if (remain <= 0) { break; }
        }

        /* normalne je v tuto chvili remain = 0; pokud byla ale na vstupu chyba, mohlo klesnout pod nulu. vratime pointer na spravny konec stringu */
        _pointer = pointer + remain;

        return result;
    };

    var _encodeUTF8 = function(str) {
        var result = [];
        for (var i=0;i<str.length;i++) {
            var c = str.charCodeAt(i);
            if (c < 128) {
                result.push(c);
            } else if ((c > 127) && (c < 2048)) {
                result.push((c >> 6) | 192);
                result.push((c & 63) | 128);
            } else {
                result.push((c >> 12) | 224);
                result.push(((c >> 6) & 63) | 128);
                result.push((c & 63) | 128);
            }
        }
        return result;
    };

    var _getDouble = function() {
        var bytes = [];
        var index = 8;
        while (index--) { bytes[index] = _getByte(); }

        var sign = (bytes[0] & 0x80 ? 1 : 0);

        var exponent = (bytes[0] & 127) << 4;
        exponent += bytes[1] >> 4;

        if (exponent === 0) { return Math.pow(-1, sign) * 0; }

        var mantissa = 0;
        var byteIndex = 1;
        var bitIndex = 3;
        index = 1;

        do {
            var bitValue = (bytes[byteIndex] & (1 << bitIndex) ? 1 : 0);
            mantissa += bitValue * Math.pow(2, -index);

            index++;
            bitIndex--;
            if (bitIndex < 0) {
                bitIndex = 7;
                byteIndex++;
            }
        } while (byteIndex < bytes.length);

        if (exponent == 0x7ff) {
            if (mantissa) {
                return NaN;
            } else {
                return Math.pow(-1, sign) * Infinity;
            }
        }

        exponent -= (1 << 10) - 1;
        return Math.pow(-1, sign) * Math.pow(2, exponent) * (1+mantissa);
    };

    var _serializeValue = function(result, value) {
        if (value === null) {
            result.push(TYPE_NULL << 3);
            return;
        }

        switch (typeof(value)) {
            case "string":
                var strData = _encodeUTF8(value);
                var intData = _encodeInt(strData.length);

                var first = TYPE_STRING << 3;
                first += (intData.length-1);

                result.push(first);
                _append(result, intData);
                _append(result, strData);
            break;

            case "number":
                if (_getHint() == "float") { /* float */
                    _serializeAsDouble(result, value);
                } else { /* int */
                    var first = (value >= 0 ? TYPE_INT8P : TYPE_INT8N);
                    first = first << 3;

                    var data = _encodeInt(Math.abs(value));
                    first += (data.length-1);

                    result.push(first);
                    _append(result, data);
                    /*
                    if (value < 0) { value = ~value; }
                    var intData = _encodeInt(value);
                    var first = TYPE_INT << 3;
                    first += intData.length;

                    result.push(first);
                    result.push.apply(result, intData);
                    */
                }
            break;

            case "boolean":
                var data = TYPE_BOOL << 3;
                if (value) { data += 1; }
                result.push(data);
            break;

            case "object":
                if (value instanceof ArrayBuffer) {
                    _serializeAsBinary(result, value);
                } else if (value instanceof Date) {
                    _serializeDate(result, value);
                } else if (value instanceof Array) {
                    _serializeArray(result, value);
                } else if (value instanceof Double) {
                    _serializeAsDouble(result, value.number);
                } else {
                    _serializeStruct(result, value);
                }
            break;

            default: /* undefined, function, ... */
                throw new Error("FRPC does not allow value "+value);
            break;
        }
    };

    var _serializeAsBinary = function(result, data) {
        var isArrayBuffer = data instanceof ArrayBuffer;
        var first = TYPE_BINARY << 3;
        var intData = _encodeInt(isArrayBuffer ? data.byteLength : data.length);
        first += (intData.length-1);

        result.push(first);
        _append(result, intData);
        _append(result, isArrayBuffer ? new Uint8Array(data) : data);
    };

    var _serializeArray = function(result, data) {
        if (_getHint() == "binary") { /* binarni data */
            _serializeAsBinary(result, data);
            return;
        }

        var first = TYPE_ARRAY << 3;
        var intData = _encodeInt(data.length);
        first += (intData.length-1);

        result.push(first);
        _append(result, intData);

        for (var i=0;i<data.length;i++) {
            _path.push(i);
            _serializeValue(result, data[i]);
            _path.pop();
        }
    };

    var _serializeStruct = function(result, data) {
        var numMembers = 0;
        for (var p in data) { numMembers++; }

        var first = TYPE_STRUCT << 3;
        var intData = _encodeInt(numMembers);
        first += (intData.length-1);

        result.push(first);
        _append(result, intData);

        for (var p in data) {
            var strData = _encodeUTF8(p);
            result.push(strData.length);
            _append(result, strData);
            _path.push(p);
            _serializeValue(result, data[p]);
            _path.pop();
        }
    };

    var _serializeDate = function(result, date) {
        result.push(TYPE_DATETIME << 3);

        /* 1 bajt, zona */
        var zone = date.getTimezoneOffset()/15; /* pocet ctvrthodin */
        if (zone < 0) { zone += 256; } /* dvojkovy doplnek */
        result.push(zone);

        /* 4 bajty, timestamp */
        var ts = Math.round(date.getTime() / 1000);
        if (ts < 0 || ts >= Math.pow(2, 31)) { ts = -1; }
        if (ts < 0) { ts += Math.pow(2, 32); } /* dvojkovy doplnek */
        var tsData = _encodeInt(ts);
        while (tsData.length < 4) { tsData.push(0); } /* do 4 bajtu */
        _append(result, tsData);

        /* 5 bajtu, zbyle haluze */
        var year = date.getFullYear()-1600;
        year = Math.max(year, 0);
        year = Math.min(year, 2047);
        var month = date.getMonth()+1;
        var day = date.getDate();
        var dow = date.getDay();
        var hours = date.getHours();
        var minutes = date.getMinutes();
        var seconds = date.getSeconds();

        result.push( (seconds & 0x1f) << 3 | (dow & 0x07) );
        result.push( ((minutes & 0x3f) << 1) | ((seconds & 0x20) >> 5) | ((hours & 0x01) << 7) );
        result.push( ((hours & 0x1e) >> 1) | ((day & 0x0f) << 4) );
        result.push( ((day & 0x1f) >> 4) | ((month & 0x0f) << 1) | ((year & 0x07) << 5) );
        result.push( (year & 0x07f8) >> 3 );
    };

    var _serializeAsDouble = function(result, number) {
        var first = TYPE_DOUBLE << 3;
        var floatData = _encodeDouble(number);

        result.push(first);
        _append(result, floatData);
    };

    /**
     * Zakoduje KLADNE cele cislo, little endian
     */
    var _encodeInt = function(data) {
        if (!data) { return [0]; }

        var result = [];
        var remain = data;

        while (remain) {
            var value = remain % 256;
            remain = (remain-value)/256;
            result.push(value);
        }

        return result;
    };

    /**
     * Zakoduje IEEE-754 double
     */
    var _encodeDouble = function(num) {
        var result = [];

        var expBits = 11;
        var fracBits = 52;
        var bias = (1 << (expBits - 1)) - 1;

        var sign, exponent, fraction;
        if (isNaN(num)) {
            exponent = (1 << expBits) - 1;
            fraction = 1;
            sign = 0;
        } else if (num === Infinity || num === -Infinity) {
            exponent = (1 << expBits) - 1;
            fraction = 0;
            sign = (num < 0 ? 1 : 0);
        } else if (num === 0) {
            exponent = 0;
            fraction = 0;
            sign = (1/num === -Infinity ? 1 : 0);
        } else { /* normal number */
            sign = num < 0;
            var abs = Math.abs(num);

            if (abs >= Math.pow(2, 1 - bias)) {
                var ln = Math.min(Math.floor(Math.log(abs) / Math.LN2), bias);
                exponent = ln + bias;
                fraction = abs * Math.pow(2, fracBits - ln) - Math.pow(2, fracBits);
            } else {
                exponent = 0;
                fraction = abs / Math.pow(2, 1 - bias - fracBits);
            }
        }

        var bits = [];
        for (var i = fracBits; i>0; i--) {
            bits.push(fraction % 2 ? 1 : 0);
            fraction = Math.floor(fraction/2);
        }

        for (var i = expBits; i>0; i--) {
            bits.push(exponent % 2 ? 1 : 0);
            exponent = Math.floor(exponent/2);
        }
        bits.push(sign ? 1 : 0);

        num = 0;
        var index = 0;
        while (bits.length) {
            num += (1 << index) * bits.shift();
            index++;
            if (index == 8) {
                result.push(num);
                num = 0;
                index = 0;
            }
        }
        return result;
    };

    /**
     * Vrati aktualni hint, na zaklade "_path" a "_hints"
     * @returns {string || null}
     */
    var _getHint = function() {
        if (!_hints) { return null; }
        if (typeof(_hints) != "object") { return _hints; } /* skalarni varianta */
        return _hints[_path.join(".")] || null;
    };

    var PublicExports = {
        Double: Double,
        serializeCall: serializeCall,
        serialize: serialize,
        parse: parse
    };

    if (module) {
        module.exports = PublicExports;
    } else if (win) {
        win.FastRPC = PublicExports;
    }
})(typeof(module) == "undefined" ? null : module, typeof(window) == "undefined" ? null : window);
