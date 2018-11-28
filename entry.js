'use strict';

const packageName = require('./package.json').name;
require('ts-node').register({
  ignore: [`/node_modules/(?!${packageName}/)`],
  project: `${__dirname}/tsconfig.json`,
  transpileOnly: true,
});
require('./src/index');
