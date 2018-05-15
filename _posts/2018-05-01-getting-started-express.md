---
title: Getting started Express.js
date: 2018-05-01 +0900
tags:
  - node.js
---

Express는 node.js에서 동작하는 Framwork이다.

다른 Framwork 들도 있지만 Express를 가장 많이 사용하는 모양이다.

설치는 npm 으로 하면 된다.

```
  npm install --save express
```

Project root path에 `index.js`를 만들고 아래 코드를 추가한다.

```js
  /**
   * es6 문법인 import를 사용하고 있지만 현재(2018-05-01 기준)
   * node에서 import를 지원하지 않기 때문에 실행되지 않는다.
   * 직접 실행해보려면 아래 예처럼 es5 문법을 사용하거나,
   * babel 등으로 transpile 후 실행해야 한다.
   * ex) const express = require('express');
   */
  import express from 'express';
  const app = express();
  const port = 3000;
  app.listen(port, () => {
    console.log(`express listen on ${port}`);
  });
```

file을 저장한 후에 터미널에서 다음 명령어를 실행한다.

```
  node index.js
```

아래 문구가 나오면 express가 성공적으로 동작하고 있는 것이다.

```
  express listen on 3000
```

이제 3000번 포트로 접속하면 express에 접근할 수 있지만, 아직 기능이 아무것도 없기 때문에 하나씩 만들어야 한다.

여기서는 기본적인 세팅 정도만 구현하겠다.

먼저 필요한 middleware를 추가하기 위해 install 한다.

```
  npm install body-parser compression
```

그리고 `index.js`를 수정한다.

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

file을 저장한 후에 위에서 실행했던 것과 똑같이 실행하여 같은 문구가 나오면 성공한 것이다.

요청을 그대로 응답으로 보내주는 에코 서버를 만들어보자.

다시 `index.js`를 수정한다.

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

서버를 실행시키고 3000번 포트로 POST 요청을 보내보면 POST 데이터가 그대로 응답으로 다시 오는걸 볼 수 있다.

지금은 간단한 예제이기 때문에 `index.js`에 코드를 다 작성했지만, 실제 작업에서는 코드를 효과적으로 분리시키는 것이 필요하다.
