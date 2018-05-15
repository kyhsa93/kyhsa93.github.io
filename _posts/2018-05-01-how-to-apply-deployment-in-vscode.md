---
title: VScode에 deploy 설정하기
date: 2018-05-01 +0900
tags:
  - vscode
---

VScode를 사용하면서 가끔 deploy를 사용한다.

사실 local test 환경을 잘 구축한다면 필요없는 기능이라고 생각하고 있긴 하다.

거의 사용하지는 않는데 어쩌다 한 번씩 쓸 일이 생기는 거 같아서 설정만 해놓고 있다.

VScode를 실행시키고 `command + p`를 누르고, `>setting`을 입력하여 `Workspace Settings`를 열어준다

```
"deploy": {
  "packages": [
    {
      "name": "project name",
      "description": "description",
      "files": [
        "**/*.js",
        "/*.json"
      ],
      "exclude": [
        "./**"
      ],
      "deployOnSave": true
    }
  ],
  "targets": [
    {
      "type": "server type",
      "name": "server name",
      "description": "",
      "dir": "deployment target directory path",
      "host": "host IP", "port": 22,
      "user": "server user",

      "checkBeforeDeploy": true,
      "privateKey": "private key path in your computer"
    }
  ]
}
```

`name`은 별로 상관없는듯하다.

AWS EC2에 deploy 하는데 `deployOnChange`, `deployOnSave` 모두 써봤는데 file을 수정하고 저장했을 때 자동으로 deploy 되지 않는 현상이 있었다.

설정을 뭘 빼먹었던 건지 아직 잘 모르겠으나 거의 사용하지 않는 기능이라서 그냥 file 수정하고 저장한 다음 `command + p`하고 `>deploy`해서 쓰고 있다.
