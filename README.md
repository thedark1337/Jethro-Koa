# Jethro-Koa  [![Build Status](https://img.shields.io/travis/thedark1337/Jethro-Koa.svg)](https://travis-ci.org/thedark1337/jethro-koa)

> Jethro Logger for KoaJS. Extends [Jethro](https://npmjs.com/package/jethro) to log [KoaJS](https://npmjs.com/package/koa) requests.

### Installation

``` javascript
npm install --save jethro thedark1337/jethro-koa
```

### Contributing

This project utilizes [Mocha](https://npmjs.com/package/mocha) and [ESLint](https://npmjs.com/package/eslint) to test the code style of the project.
Just run the command ` npm test ` and make sure it passes

### Usage

``` javascript
'use strict';

const Koa = require('koa');
const app = module.exports = new Koa();
const Jethro = require('jethro');
const logger = new Jethro();
const KoaLogger = require('jethro-koa');
const requestLogger = new KoaLogger();

logger.addPlugin('koa', requestLogger);

app.use(koaLogger.input());

```

### License

Licensed under the LGPL v3 License

Copyright (C) 2015  Alex Pham (known as Thedark1337)

You can find full license [here.](/LICENSE)
