---
layout: post
title: Regular expression example
date: 2018-06-24 +0900
author: kyhsa93
category: regular expression
cover: "/assets/regular-expression.png"
---

```js
  // 첫 글자가 알파벳이로 알파벳과 숫자가 혼합된 3글자 이상 14글자 이하
  /^[a-z]+[a-z0-9]{3,14}$/g;

  // 알파벳으로 된 1글자 이상 20글자 이하
  /^[a-z]{1,20}$/g;

  // 알파벳과 숫자가 혼합된 10글자 이상 20글자 이하
  /^[a-z0-9]{10,20}$/g;

  // 사이에 -가 들어가있는 3 또는 4 글자로 이루어진 숫자 그룹
  /^\d{3,4}-\d{3,4}-\d{3,4}$/g;

  // email 형식의 문자열
  /^[0-9a-zA-Z]([-_\.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_\.]?[0-9a-zA-Z])*\.[a-zA-Z]{2,3}$/i;
```
