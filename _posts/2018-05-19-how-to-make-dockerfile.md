---
layout: post
title: How to make Dockerfile
date: 2018-05-19 +0900
author: kyhsa93
category: docker
cover: "/assets/docker.png"
---

`Dockerfile` 공식 reference는 [여기](https://docs.docker.com/engine/reference/builder/)를 참고하면 된다.

Docker engine에는 container image를 만들기위한 자동화 도구가 포함되어 있다.

container image는 `docker commit` command를 사용하여 수동으로 만들 수 있지만 자동으로 image를 만드는 process를 사용하면 많은 이점이 있다.

0. conatainer image를 code로 저장할 수 있다.
0. 유지 관리 및 upgrade를 위해 container image를 신속하고 정확하게 다시 만들 수 있다.
0. container image와 개발 주기 간의 연속 통합을 제공한다.

이 자동화를 수행하는 Docker 구성 요소는 `Dockerfile`과 `docker build` command이다

0. `Dockerfile`
 - 새로운 container image를 만드는 데 필요한 command를 포함하는 text file이다.
 - 이러한 command에는 기반으로 사용할 기존 image의 ID, image를 만드는 과정 중 실행할 command 및 container image의 새 instance가 배포될 때 실행될 command가 포함된다.
0. Docker build
 - `Dockerfile`을 사용하고 image를 만드는 과정을 trigger하는 Docker engine command이다.

Dockerfile introduction
---

`Dockerfile`은 확장명이 없어야 한다.

`Dockerfile` command는 container image를 만드는 데 필요한 과정을 Docker engine에 제공한다.

이러한 command는 순차적으로 수행된다.

Dockerfil command에 대한 공식 refernce는 [여기](https://docs.docker.com/engine/reference/builder/)를 참조하면 된다.

```
  FROM <image>
```

FROM은 새로운 image를 만들때 사용할 image를 설정한다.

예를 들어 `FROM ubuntu:16.04`를 사용하면 ubuntu 16.04가 현재 시스템에 없는 경우 Docker engine이 image를 download하여, 생성될 image에 ubuntu 16.04가 OS로 적용된다.

```
  MAINTAINER <name>
```

`Dockerfile`을 관리하는 사람의 이름 또는 메일을 적는다.

build에 영항을 주지는 않는다.

```
  RUN <command>
```

RUN은 image가 생성될때 실행될 command를 지정한다.

install software, make file or directory, make environment와 같은 항목을 포함할 수 있다.

```
  COPY <source> <destination>
  COPY ["<source>", "<destination>"]
```

copy는 file 및 directory를 container에 복사한다.

file 및 directory는 `Dockerfile`의 상대 경로에 있어야 한다.

destination directory가 없다면 자동으로 생성한다.

원본 또는 대상에 공백이 포함된 경우 경로를 대괄호와 큰따옴표로 묶어야한다.

```
  ADD <source> <destination>
  ADD ["<source>", "<destination>"]
```

COPY와 매우 유사하지만 추가 기능을 포함하고 있다.

ADD는 host에서 container image로 file을 복사할 뿐만 아니라 URL이 지정된 원격 위치에서 file을 복사할 수도 있다.

source에 압축 파일을 입력하는 경우 자동으로 압축을 풀어준다.

원본 또는 대상에 공백이 포함된 경우 경로를 대괄호와 큰따옴표로 묶어야한다.

```
  WORKDIR <directory>
```

RUN, CMD 등 다른 `Dockerfile` command가 실행될 directory를 설정한다.

WORKDIR 뒤에 오는 command 들은 모두 설정된 directory에서 실행된다.

```
  CMD <command>
  CMD ["<executable>", "<param>"]
```

container image의 instance를 배포할 때 실행할 기본 명령을 설정한다.

`Dockerfile`에서 CMD를 여러 개 지정하는 경우 마지막 명령만 실행된다.

한번에 여러 개의 프로그램을 실행하고 싶다면 shell script file을 작성하여 실행해주면 된다.

원본 또는 대상에 공백이 포함된 경우 경로를 대괄호와 큰따옴표로 묶어야한다.

```
  EXPOSE<port> [<port>...]
```

Docker container가 실행되었을 때 listening port를 지정한다.

여러 port를 지정할 수 있다.

```
  VOLUME ["/data"]
```

container 외부에 file system을 mount 할 때 사용한다.

```
  ENV <key> <value>
  ENV <key>=<value>
```

container에서 사용할 환경변수를 지정한다.

container를 실행할 때 `-e` 옵션을 사용하면 기존 값을 override하게 된다.

`Escape Character`

`Dockerfile` command가 여러 줄에 걸쳐 계속되어야 하는 경우 사용한다.

기본 `Dockerfile` escape character는 `\`이다.

escape character를 수정하려면 `Dockerfile`의 첫 번쨰 줄에 escape character parser 지시문을 작성한다.

escape character parser 지시문은 [여기](https://docs.docker.com/engine/reference/builder/#escape)를 참조하면 된다.

Docker build
---

```
  docker build [OPTION] PATH
```

`Dockerfile`을 만들고 저장한 다음 `docker build`를 실행하여 새 image를 만들 수 있다.

`docker build`는 여러 가지 옵션 매개 변수와 `Dockerfile`의 경로를 사용한다.

build를 실행하면 `Dockerfile`을 한 줄씩 실행하고 image에 저장하고 마지막 줄까지 실행하면 최종 성공한 image id를 출력한다.

build를 실행할 때마다 image layer를 저장하고 다시 build할 때 `Dockerfile`이 변경되지 않았다면 기존에 저장된 image를 cache처럼 그대로 사용한다.

Docker duild에 대한 전체 설명은 [여기](https://docs.docker.com/engine/reference/commandline/build/#build)를 참조하면 된다.

참고: [MS](https://docs.microsoft.com/en-us/virtualization/windowscontainers/manage-docker/manage-windows-dockerfile)
