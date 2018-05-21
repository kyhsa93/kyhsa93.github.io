---
layout: post
title: What is docker?
date: 2018-05-19 +0900
author: kyhsa93
category: docker
cover: "/assets/docker.png"
---

What is Docker
---

`Docker`는 linux container 기반의 open source 가상화 platform이다.

linux의 container라는 개념을 사용하여 효율적으로 msa(micro architecture service)를 구현할 수 있다.

`Docker` 이전부터 사용해 왔던 VM(Virtual Machine)과 비슷하다고 생각할 수 있으나 사용해보면 훨씬 가볍고 사용하기 좋다는 것을 알 수 있다.

VM은 host OS위에 guest OS 전체를 가상화하고 CPU, Memory 등을 분리시켜서(전가상화, 반가상화) 사용하지만, `Docker`는 Real Machine의 시스템 자원을 공유하여 사용하고 process만 분리하는 방식이기 때문에 VM 보다 효율적인 것을 알 수 있다.

또한, `Docker`는 다양한 프로그램, 실행환경을 컨테이너로 추상화하고 동일한 인터페이스를 제공하여 프로그램의 배포 및 관리를 단순하게 해준다.

백엔드 프로그램, 데이터베이스 서버, 메시지 큐등 어떤 프로그램도 컨테이너로 추상화할 수 있고 local, AWS, Azure, Google cloud등 어디에서든 실행할 수 있다.

`Docker`는 linux container를 기반으로 시작해서 libcontainer를 사용했고 추후에 runC에 합쳐졌다.

Docker image
---

`Docker`에서 container와 함꼐 또 중요한 것이 image이다.

image는 container를 만들기 위한 정보를 모두 가지고 있다.

하나의 image로 여러 개의 container를 만들 수 있으며, 만들어진 container가 변경되어도 image는 변하지 않는다.

또한, 여러 base image를 기반으로 새로운 image를 만들수도 있고, 만든 image를 Dockerhub를 통해 공유 및 배포도 할 수 있다.

`Docker` image는 layer 저장 방식을 사용한다.

layer 저장 방식이란 말 그대로 층을 만드는 방식이다.

기존의 image가 있고 image에 새로운 내용이 추가된다면 새로운 image를 만드는 것이 아니라 기존의 image에 새로 추가된 내용의 layer를 얹어서 저장한다는 것이다.

`Docker`가 image로 container를 만드는 것을 보면 쉽게 알 수 있다.

image로 container를 만드는 과정을 보면 Dockerfile의 명령을 한 줄 실행하고 그 결과를 새로운 layer로 추가하면서 intermediate container를 지우고 만들고 하다가 마지막 명령줄이 실행되고 최종 image id를 출력해 주는 것을 볼 수 있다.

`Docker`로 container를 띄우기까지의 과정을 간단히 정리 해보자면,

0. Dockerfile을 작성
0. 작성한 Dockerfile로 image build
0. build된 image로 container 생성

container를 만들때 docker run -ti 로 container를 만들고 바로 container로 접속할 수 있으며, -d 옵션으로 back ground에서 돌아가게 할 수 도 있다.

여러 개의 container를 띄워놓고 attach 명령으로 각각의 container에 접속해 볼 수 도 있다.

Docker command
---

간단한 Docker 명령어를 정리해 보자면,

```
  docker build
```

작성된 Dockerfile을 가지고 image를 만든다.

-t 옵션으로 image에 이름을 부여할 수 있으며 맨 마지막에 Dockerfile이 있는 경로를 적어준다.

```
  docker iamges
```

현재 사용할 수 있는 image list가 출력된다.

```
  docker rmi [IMAGE]
```

해당 image를 삭제한다.

```
  docker rmi $(docker image ls -a -q)
```

전체 image를 삭제한다.

```
  docker run
```

image로 container를 만들고 실행시킨다.

-ti 옵션을 이용해서 container에 접속할 수 있고, container의 이름을 부여할 수 있다.

```
  docker start
```

stop되어 있는 container를 실행한다.

```
  docker stop
```

실행되고 있는 container를 종료한다.

```
  docker attach
```

실행되고 있는 container에 접속한다.

```
  docker ps
```

현재 실행되고 있는 container list를 출력한다.

-a 옵션을 사용하면 stop되어 있는 container까지 볼 수 있다.

```
  docker rm
```

stop되어 있는 container를 삭제한다.

실행되고 있는 container는 stop을 한 후에 삭제할 수 있다.

```
  docker rm $(docker container ls -a -q)
```

stop되어 있는 container를 전부 삭제한다.

마찬가지로 실행되고 있는 container는 stop을 먼저 해야한다.

Dockerfile을 작성하는 법은 따로 post를 작성해보겠다.

image를 만들때 이름을 부여하지 않으면 \<none>으로 만들어 지고,

container를 만들때 이름을 지정해 주지 않으면 `Docker`가 자동으로 이름을 부여한다.

image를 만들때 image 이름이 같으면 image를 덮어쓰지만,

container를 만들때 container의 이름이 같으면 만들수 없다.

Dockerfile을 작성하는 법은 따로 post를 작성하도록 하겠다.

<div style="text-align: right">
  Image source by
  <a href="https://docs.docker.com/">
    here
  </a>
</div>

