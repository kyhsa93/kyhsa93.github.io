---
layout: post
title: 많이 쓰는 Git 명령어 정리
date: 2018-05-02 +0900
author: kyhsa93
categories: git
cover: "/assets/git.png"
---

Git은 아마 가장 많이 쓰이는 코드 관리 도구 중 하나이지 않을까 싶다.

버전 관리 시스템, 형상관리 시스템 이름들이 있지만, Git-scm을 보면 기존에 사용하던 VCS와 미묘하게 달라서 VCS를 사용하던 경험을 버려야 한다고 소개하고 있다.

그러면서 바로 다음에 설명하는 내용이 '차이가 아닌 스냅 샷'이라고 말하고 있다.

Git은 프로젝트의 그 시점의 스냅 샷을 저장한다는 것이다.

다음은 거의 매일 쓰는 Git 명령어를 적어보았다.

```
  git init
```
Git 저장소를 만드는 명령어이다.

기존에 만들어 두었던 directory에 들어가서 명령어를 실행하면 `.git`이 만들어진다.

```
  git clone <url> 
```
Git hub에 있는 프로젝트를 local 환경으로 내려받는 명령어이다.

원격 저장소의 url과 local에 만들 directory 이름을 적어준다.

```
  git status
```
file의 상태를 확인하는 명령어이다. 

file을 생성, 수성, 삭제 후 명령어를 사용하면 file들의 상태를 보여준다.

```
  git diff 
```
file의 변경사항을 보여주는 명령어이다.

이 명령어로는 file의 변경사항만 보여주기 때문에 새로 생성한 file은 보이지 않는다.

file의 변경된 부분을 보여준다.

staged 상태의 file은 보이지 않는다.

```
  git add 
```
file을 수정 후 staged 상태로 만들어 주는 명령어이다.

수정된 file은 unstaged 상태인데 이 명령어로 staged 상태로 만들어 줘야 한다.

새로 생성된 file은 untracking file이므로 add 명령어로 staged 상태로 만들어 줘야 commit으로 변경사항을 저장할 수 있다.

staged 상태로 만든 후 다시 file을 수정하게 되면 다시 staged 상태로 만들어 줘야 한다.

```
  git commit
```
Staging area에 속한 스냅 샷을 commit 한다.

수정은 했지만, staged 상태가 아닌 file들은 commit 되지 않는다.

명령어를 사용하면 새로운 commit이 생기고 원격저장소에 push 할 수 있는 상태가 된다.

마지막 commit 내용을 수정하고 싶다면 --amend 옵션을 사용하면 된다.

```
  git log
```
현재 branch의 commit log를 보여주는 명령어이다.

유용한 옵션들이 있으나 여기서는 다루지 않겠다.

```
  git cherry-pick <commit>
```
특정 commit을 가져오는 명령어이다.

명령어 뒤에 commit 번호를 적어주면 원하는 commit을 현재 branch 가장 마지막에 추가해 준다.

```
  git reset <option> <target>
```
commit을 뒤로 돌리는 명령어이다.

--soft 옵션은 staged 상태로 만들어 주고, --hard 옵션은 변경사항을 완전히 지워준다.

옵션 뒤에 HEAD~, HEAD^ 등으로 되돌아갈 commit의 시점을 정해준다.

사실 reset은 조금 위험한 방법이기 때문에 권장하지는 않는다.

```
git revert 
```
만약 잘못된 commit을 하여 되돌아가고 싶다면 revert를 추천한다.

commit 한 내용의 정반대인 commit을 만들어서 commit 된 내용을 되돌리는 방법이다.

명령어 뒤에 commit 번호를 적어주면 된다.

```
git remote
```
현재 프로젝트의 remote를 추가, 변경, 삭제할 수 있다.

```
git pull
```
원격 저장소의 branch의 데이터를 local로 가져와서 local branch의 branch와 merge 한다.

local branch에 변경 내용이나 commit이 다르면 conflict가 발생할 수 있다.

```
git push
```
local의 프로젝트를 원격 저장소에 작성한다.

원격 저장소와 commit 된 내용이 다르면 reject 될 수 있다.

push로 원격 저장소에 작성하기 전에 pull로 local에서 merge를 하고 push 하기를 추천한다.

```
git branch
```
현재 프로젝트에 있는 branch를 조회, 삭제, 추가할 수 있다.

원격 저장소의 branch도 조작할 수 있다.

```
git checkout
```
현재 프로젝트에 있는 다른 branch로 이동할 때 많이 사용한다.

checkout과 reset이 각각 branch와 commit을 이동할 때 사용하는데 혼용해서 사용하는 때도 있는 것 같다.

file을 이동할 수도 있다는 이야기를 들었는데 그렇게는 사용해 보지 않아서 정확한 정보는 문서를 찾아보기를 추천한다.

명령어마다 여러 옵션이 있고 더 좋은 사용법들이 있으니 시간 날 때마다 한 번씩 들여다보는 것도 많은 도움이 될 듯하다.

자세한 내용은 [Git-scm](https://git-scm.com)에 잘 설명되어 있다.

<div style="text-align: right">
  Image source by
  <a href="https://steemit.com/kr/@stunstunstun/git-1-git-flow">
    here
  </a>
</div>
