node-fastrpc
============
[![Build Status](https://travis-ci.org/seznam/node-fastrpc.svg?branch=master)](https://travis-ci.org/seznam/node-fastrpc)

Javascript implementation of FastRPC (de-)serialization

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

### FastRPC (de-)serialization
```js
var fastrpc = require('fastrpc');

// Serialize method call
var binaryData = fastrpc.serializeCall(methodName, methodParams);

// Deserialize method call
var data = fastrpc.parse(binaryData);
```

### Base64 (de-)serialization
```js
// Convert binary to base64
var base64Data = fastrpc.btoa(binaryData);

// Convert base64 to binary
var binaryData = fastrpc.atob(base64Data);
```
