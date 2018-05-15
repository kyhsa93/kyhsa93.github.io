---
layout: post
title: JSDoc으로 문서 만들기
date: 2018-05-01 +0900
author: kyhsa93
categories: javascript
cover: "/assets/jsdoc.png"
---

문서화에 대한 고민은 모든 개발자가 하는 고민 중 하나가 아닐까 생각한다.

잘 정리된 문서가 있고 누군가 항상 문서를 최신화해주면 참 좋겠지만, 애석하게도 번번이 문서를 수정하는 일은 굉장히 번거롭고 심지어 문서가 아예 없는 경우는...

생각해보니 자동으로 문서화 해주는 게 없을 리가 없다고 생각되긴 했다. 

사실 문서로 만들면 markdown 밖에 생각하지 않고 있었기 때문에 이번에 한번 새로운 걸 써보자고 마음먹고 찾은 게 JSDoc이었다.

여기 올려놓은 설정은 다른 블로그를 참고하여 만들었던건데 

npm으로 JSDoc을 install 한다.

```
  npm install jsdoc jsdoc-route-plugin
```

project root path에 jsdoc.conf file을 만들고 아래 코드를 추가한다.

```json
{
  "tags": {
    "allowUnknownTags": false,
    "dictionaries": ["jsdoc","closure"]
  },
  "source": {
    "include": ["target directory or file"],
    "exclude": ["ignore directory or file"],
    "includePattern": ".+\\.js(doc|x)?$",
    "excludePattern": "(^|\\/|\\\\)_"
  },
  "plugins": [
    "plugins/markdown",
    "jsdoc-route-plugin" // plugin for make api endpoint documentation
  ],
  "templates": {
    "cleverLinks": false,
    "monospaceLinks": false,
    "default": {
      "outputSourceFiles": false
    }
  },
  "opts": {
    "recurse": true,
    "encoding": "utf8",
    "destination": "./docs"
  }
}
```

설정은 끝났고 아래 명령으로 실행해 볼 수 있다.

```
  jsdoc -c jsdoc.conf
```

<div style="text-align: right">
  Image source by
  <a href="https://medium.com/4thought-studios/documenting-javascript-projects-f72429da2eea">
    here
  </a>
</div>
