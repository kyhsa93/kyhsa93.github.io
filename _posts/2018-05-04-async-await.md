---
layout: post
title: async/await
date: 2018-05-04 +0900
author: kyhsa93
categories: javascript
cover: "/assets/asyncawait.png"
---

Node는 7.6 버전부터 `async/await`를 지원하기 시작했다.

아래는 `async/await`에 대한 간단한 설명이다.

- 비동기 코드를 작성하는 방법이다.
- `callback`과 함께 사용할 수 없다.
- `promise`처럼 non-blocking이다.
- 비동기 코드를 동기 코드처럼 보이게 만들어 준다.
- 함수 앞에 `async`라는 단어가 오게 되며, `awiat`는 `async`로 정의된 함수에서만 사용할 수 있다.

`async/await`의 Error handling은 `try/catch`를 이용한다.

Method chaining으로 처리할 수 있지만, `try/catch`가 훨씬 간결하고 사용하기 편하다.

```js
  try {
    const result = async (param) => {
      const firstResult = await first(param);
      const secondResult = await second(firstResult);
      return secondResult;
    }
  } catch (error) {
    console.log(error);
  }
```

위의 코드를 보면 `async` function안에 있는 `await` function들이 어떻게 실행되는지 한눈에 알아볼 수 있을 것이다.

보는 그대로 `first()`가 성공하면 `second()`가 실행되고 `second()`가 성공하면 결과가 return 된다.

만일 이 코드에서 `error`가 발생하여 `first()`가 실패하게 된다면, `secound()`는 실행되지 않고 `catch` block으로 넘어가게 될 것이다.

`async/await`를 설명할때 보통 `Promise`와 비교하여 많이 설명하는 글 들이 많이 보인다.

확실한건 `Promise`보다 훨씬 간결하고 사용하기 쉬우며 가독성이 좋다는 것이다.

<div style="text-align: right">
  Image source by
  <a href="https://start.jcolemorrison.com/5-tips-and-thoughts-on-async-await-functions/">
    here
  </a>
</div>
