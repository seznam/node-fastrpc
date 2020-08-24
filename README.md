node-fastrpc
============
[![Build Status](https://travis-ci.org/seznam/node-fastrpc.svg?branch=master)](https://travis-ci.org/seznam/node-fastrpc)

Javascript implementation of [FastRPC](https://github.com/seznam/fastrpc)
(de-)serialization.

# Installation

### node.js

```sh
npm install fastrpc --save
```

### Bower

```sh
bower install fastrpc --save
```

## Example

```js
var fastrpc = require('fastrpc');

// Serialize method call
var binaryData = fastrpc.serializeCall(methodName, methodParams);

// Deserialize method call
var data = fastrpc.parse(binaryData);
```
