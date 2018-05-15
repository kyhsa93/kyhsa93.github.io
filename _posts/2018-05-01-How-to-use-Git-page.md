---
layout: post
title: 블로그 시작하기
date: 2018-05-01 +0900
author: kyhsa93
categories: Jekyll
tags: blog
cover: "/assets/jekyll.png"
---

![Image](../images/jekyll.png){: width="100%" height="20%"}

블로그를 해야지 해야지 생각만 계속하다가 Git page를 보고 이거면 괜찮게 할 수 있겠다 싶어서 만들어 봤다.

어떻게, 얼마나 할지는 미래의 나에게 물어봐야겠지만...

주로 작업할 때 쓰는 것들에 관해 기술하게 될 거 같지만 사실 아직 확실하게 정해놓은 것이 아무것도 없어서 일단 목표는 꾸준히만 하자는 생각이다.

자세한 작성방법, 세팅방법 등은 나중에 따로 정리하겠다.

일단 이 블로그는 Git page, Jekyll을 이용해서 만들었고 theme은 [Junho Baik](https://junhobaik.github.io/jekyll-apply-theme/#_posts-_draft-%ED%8F%B4%EB%8D%94-%EC%83%9D%EC%84%B1)님의 글을 보고 쉽게 따라 할 수 있었다.(좋은 글 감사합니다.)

사실 hexo와 jekyll 중 뭘 사용할지 많이 고민했었는데, Jekyll을 선택한 이유는 Git page에서 Jekyll을 지원한다고 해서 좀 더 괜찮겠지라는 생각이었다.

뭘 쓰던지 큰 차이는 없는 것 같고, 자신이 원하는 걸 사용하면 될 거 같다.

Github repository page에서도 작업을 할 수 있는거 같은데 난 local에서 하는게 더 마음에 들어서 local에서 작업후 push하는 방식으로 작업하고 있다.

만약 테마를 바꾸고 싶다면 zip file을 다운받거나 Git에서 clone 받아서 `/_posts/`, `/_data/`, `/_pages/`, `/_config.yml` 정도만 수정해주면 사용할 수 있을듯하다.

Jekyll은 brew로 설치하면 간단하게 할 수 있었다.

Jekyll이 Ruby로 되어있다는 게 조금 걱정이긴 하지만 큰 문제는 없을 거 같다.

기본적인 설정들이 `/_config.yml`에 주석이랑 같이 잘 작성되어 있어서 따로 쭉 읽어봐야겠다.

navigation 설정은 `/_data/navigation.yml`에서 작성하고, page는 `/_pages`에 생성한다.

Post file 작성 규칙
0. file 위치는 `/_posts/`에 작성한다.
0. file name은 `YYYY-MM-DD-title.md`로 작성한다.
0. file 내용은 MARKDOWN으로 작성한다.

기본적으로 file을 수정한 후 `jekyll serve` 명령어를 사용하면 `/_site/`에 빌드되고 `localhost:4000`으로 브라우저에서 확인할 수 있다.

`/_config.yml`은 수정한 후 다시 빌드 해줘야 한다는걸 잊지말자.

livereload를 사용하려면 `jekyll serve --live`를 사용하면 file을 수정하고 저장하면 자동으로 브라우저에 반영된다.
