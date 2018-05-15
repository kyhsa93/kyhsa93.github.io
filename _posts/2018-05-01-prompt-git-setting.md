---
title: Prompt에 Git branch 표시하기
date: 2018-05-01 +0900
tags:
  - git
---

Git을 터미널에서 사용하다보면 branch를 확인하기위해 `git branch`라는 명령어를 사용해야하는데 prompt에 branch를 표시해주는 설정이다.

가장 먼저 할 일은 `~/.bash_profile`이 있는지 확인한다.

없으면 그냥 만들면 된다.

그리고 아래 코드를 추가해준다.

```
  parse_git_branch() {
      git branch 2> /dev/null | sed -e '/^[^*]/d' -e 's/* \(.*\)/ (\1)/'
  }
  export PS1="\u@\h \W\[\033[32m\]\$(parse_git_branch)\[\033[00m\] $ "
```

`export`는 process 환경변수를 설정해 주는것으로 node application을 실행할때 `process.env`로 접근할 수 있으니 알아두면 도움이 될 수 있다.

저장하고 소스를 실행시켜준다.

```
  source ~/.bash_profile
```

이제 터미널에서 Git이 설정되어있는 directory에 들어갔을때 prompt에 다음과 같이 branch 이름이 나오면 성공이다.

```
  younghoongo@Youngui-MacBook-Pro kyhsa93.github.io (master) $
```

그 밖에 다양한 prompt 설정들을 할 수 있으니 한번씩 찾아보는 것도 나쁘지 않을듯하다.
