---
layout: post
title: How to use git fork in team
date: 2018-05-20 +0900
author: kyhsa93
categories: git
cover: "/assets/git.png"
---

open source project에 참여하기 위해 내 git hub 계정에 repository를 fork하여 작업 후 commit을 pull request하는 방식으로 fork를 많이 사용하는것 같다.

전에 같이 일하던 분들에게 배웠던 방식이긴 한데 개인 project가 아닌 팀 project에서 fork를 활용하는 방법이 매우 효율적이었다고 생각이 되서 정리를 해보려 한다.

private repository를 fork해서 사용하다가 팀원이 갑작스럽게 이탈하였을 경우 fork한 repository가 없어지지 않을까 걱정하는 사람들이 있는거 같은데,

팀원이 organization에서 제외되는 순간 repository가 개인 계정에서 없어지게 되니 너무 걱정하지 마시길.(organization repository라도 public repository는 없어지지 않는다.)

일단 순서는 이렇다.

0. organization repository에서 개인 repository로 fork한다.
0. 내 계정에 있는 fork된 repository에서 local로 clone 받는다.
0. 내 계정을 origin remote로 두고 remote에 organization repository를 추가한다.

일단 여기까지 하면 준비는 끝났다.

작업을 하고 작업 내용이 반영되는 순서는 이렇다.

0. local에서 작업을 하고 commit 후 내 계정의 repository로 push한다.
0. 내 계정의 repository에서 organization repository로 pull request한다.
0. 팀원들의 code review를 받고 모든 팀원이 appove했을때 organization repository애 반영한다.
0. organization repository에 반영 후 내 local에서 organization repository를 pull하여 local을 최신화 시켜준다.

diagram으로 그려보면 이런 모양이 된다. 

<a href="/assets/git-fork-diagram.png" data-lightbox="falcon9-large" data-title="git fork diagram">
  <img src="/assets/git-fork-diagram.png" title="git fork diagram">
</a>

forked repository와 local 사이의 화살표가 양방향인 이유는 두 저장소를 이용하여 organization으로 반영될 내용만 완벽하게 정리하여 pull request를 하기 위해서 이다.

merge, rebase 등 작업은 모두 local에서 이루어진 후 push되어야하고 organization repository에는 merge commit 등은 없도록 실제 작업 내용에 대한 commit만 있도록 하는것이다.

organization repository를 깔끔하게 관리할 수도 있지만 더 중요한 것은 organization repository로 들어오는 모든 내용은 pull request로 들어온다는 것에 더 의미가 있는거 같다.

물론 hotfix 같은 것은 충분한 code review를 받지 못하고 반영될 수 있겠지만 이것은 팀원들과의 협의를 통해 최소한의 approve 수를 정한 다거나, hotfix가 필요할때 따로 요청을 한다던지 하는 방법을 사용하면 될 것이다.

작업을 하고 반영하는 과정이 조금 번거로워 질 수 있겠지만 이걸로 얻을 수 있는 이점도 생각해보면 충분히 고려해볼 만한 사항일 것이다.