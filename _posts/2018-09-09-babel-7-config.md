---
layout: post
title:  "Babel 7.0 config"
date: 2018-09-09 +0900
author: kyhsa93
categories: javascript
cover:  "/assets/babel.png"
---

Babel is javascript transpiler.

I am using babel to use my code made es6 with node.js.

But babel version is upgraded 7.0 and that configuration is changed.

Firstly, package scope(`@babel`) is used in package.json.

Following json is currently i use in my project.

```json
"devDependencies": {
    "@babel/cli": "^7.0.0-beta.54",
    "@babel/core": "^7.0.0-beta.54",
    "@babel/node": "^7.0.0-beta.54",
    "@babel/plugin-proposal-decorators": "^7.0.0-beta.54",
    "@babel/plugin-proposal-export-namespace-from": "^7.0.0-beta.54",
    "@babel/plugin-proposal-function-sent": "^7.0.0-beta.54",
    "@babel/plugin-proposal-numeric-separator": "^7.0.0-beta.54",
    "@babel/plugin-proposal-object-rest-spread": "^7.0.0-beta.54",
    "@babel/plugin-proposal-throw-expressions": "^7.0.0-beta.54",
    "@babel/plugin-transform-modules-commonjs": "^7.0.0-beta.54",
    "@babel/preset-env": "^7.0.0-beta.54"
  }
```

Babel is upgraded and than it's performance is better about 60%.

And configuration preset and plugins in `.babelrc` changed.

Yearly supported plugins is deprecated.

Following json is currently i use in my `.babelrc`

```json
{
  "presets": [
    ["@babel/preset-env", {
      "targets": {
        "node": "6.12.2"
      }
    }]
  ],
  "plugins": [
    ["@babel/plugin-proposal-decorators", { "legacy": true }],
    "@babel/plugin-proposal-function-sent",
    "@babel/plugin-proposal-export-namespace-from",
    "@babel/plugin-proposal-numeric-separator",
    "@babel/plugin-proposal-throw-expressions",
    "@babel/plugin-proposal-object-rest-spread"
  ]
}

```

Babel cli is changed, but my cli in shell script used is like following code.

```sh
  babel index.js -o lib/index.js
  babel src -d lib/src
```

Option for transpiling each file is -o, transpling directory is -d.
