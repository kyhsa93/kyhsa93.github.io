---
layout: post
title: Getting started Express.js
date: 2018-05-01 +0900
author: kyhsa93
category: node.js
cover: "/assets/express.png"
---

express is commonly used framework on node.js

Use npm to install express in project.

```
  npm install --save express
```

Make `index.js` in project root path and insert following code.

```js
  /**
   * This code is follow es6 syntax
   * so you have to use commonjs syntax or use tranpiler like babel.
   * (2018-05-01)
   */
  import express from 'express';
  const app = express();
  const port = 3000;
  app.listen(port, () => {
    console.log(`express listen on ${port}`);
  });
```

Save `index.js` and run cammand in your terminal.

```
  node index.js
```

If you can see that text in your terminal, express app is successed.

```
  express listen on 3000
```

Now if you connect localhost:3000 you can access your express app.

Next step is install middleware. 

```
  npm install body-parser compression
```

And then modify your `index.js` like following code.

```js
  import express from 'express';
  import bodyParser from 'body-parser';
  import compression from 'compression';
  const app = express();
  const port = 3000;
  app.use(bodyParser.json(
    // options
  ));
  app.use(bodyParser.urlencoded({
    extended: true,
    // options
  }));
  app.use(compression({ filter: (request, response) => {
    if (request.headers['x-no-compression']) return false;
    return compression.filter(request, response);
  }}));
  app.disable('x-powered-by');
  app.listen(port, () => {
    console.log(`express listen on ${port}`);
  });
```

Save file and if you run the same thing as above, you will get success.

Let's make echo server that work response your http request.

Modify `index.js` again.

```js
  import express from 'express';
  import bodyParser from 'body-parser';
  import compression from 'compression';

  const app = express();
  const port = 3000;

  // middleware
  app.use(bodyParser.json(
    // options
  ));
  app.use(bodyParser.urlencoded({
    extended: true,
    // options
  }));
  app.use(compression({ filter: (request, response) => {
    if (request.headers['x-no-compression']) return false;
    return compression.filter(request, response);
  }}));
  app.disable('x-powered-by');

  // endpoint
  app.post('/echo', (request, response) => {
    response.status(200).send(request.body)
  });

  // app listening
  app.listen(port, () => {
    console.log(`express listen on ${port}`);
  });
```

Now run your server, send http POST request on localhost:3000 you can receive your requested data.

<div style="text-align: right">
  Image source by
  <a href="https://www.npmjs.com/package/express">
    here
  </a>
</div>
