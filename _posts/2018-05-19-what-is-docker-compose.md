---
layout: post
title: What is docker compose?
date: 2018-05-19 +0900
author: kyhsa93
category: docker
cover: "/assets/docker.png"
---

What is docker compose
---

compose는 다중 comtainer Docker 응용 프로그램을 정의하고 실행하기위한 도구이다.

compose를 사용하면 YAML file을 사용하여 응용 프로그램의 서비스를 구성 할 수 있다.

그 후 단일 명령으로 구성에서 모든 서비스를 작성하고 시작한다.

docker-compose를 사용하면 좀 더 정돈된 규칙으로 container를 정의할 수 있다.

docker-compose를 사용하기 위해서는 Dockerfile과 함께 docker-compose.yml이 필요하다.

docker-compose에서는 container 실행에 사용되는 옵션과 container 간의 의존성을 docker-compose.yml에 모두 적어두고 docker-compose 명령으로 실행한다.

docker-compose.yml을 작성할때 기본적으로 yml 문법을 따르기 때문에 두 개의 공백으로 다른 카테고리를 표현한다.

```
  docker-compose build
```

docker-compose.yml로 docker image를 build 한다.

```
  docker-compose up [SERVICE]
```

docker run과 비슷한 기능을 한다고 생각하면 될거 같다.

docker-compose.yml과 각 service의 Dockerfile을 참조하여 image를 build하고 container를 만들고 실행한다.

-d 옵션을 사용하여 back ground에서 실행시킬 수 있고, 실행중인 상태에서 명령을 다시 실행해주면 기반 이미지의 변경 사항이 적용된다.

docker-compose.yml에서 volumes를 host와 guest의 file을 연결해주고 host의 file을 변경한 후 다시 실행하여 container에 반영하는 방법으로 개발할때 deploy처럼 쓸 수 있디.

뒤에 service를 적지 않으면 docker-compose.yml에 작성된 모든 service가 실행된다.

`docker-compose up`으로 만들어진 image와 container는 `Docker` 명령어로 control할 수 있다.

docker-compose.yml
---

```
  version: 'number'
```

docker-compose.yml에 가장 top level에 작성한다.

version에 따라 지원하는 옵션이 다르지만 보통 '2'를 많이 사용한다.

```
  services:
```

이 카테고리에 실행하고자 하는 service들을 정의한다.

여기서 말하는 service란 container로 실행될 것을 말하며, version 밑에 second level로 작성한다.

```
  [SERVICE_NAME]:
```

api, client, database 등 원하는 service 이름을 적는다.

여기에 적는 이름이 docker-compomse 명령을 사용했을때 image 이름으로 들어간다.

이 카테고리가 하나의 container로 만들어지고, 이 카테고리 안에 작성된 옵션들이 container에 적용된다.

```
  image: [IMAGE_NAME]
```

service에 사용될 Docker image를 작성한다.

```
  volumes:
    - hostfile:guestfile
```

host와 guest의 file을 mount 해준다.

```
  environment:
   - [ENV_NAME]=[VALUE]
```

container에 적용될 환경변수를 작성해준다.

```
  healthcheck:
    test: [COMMAND]
    interval: [TIME]
    timeout: [TIME]
    retries: [NUMBER]
```

만약 database service와 api service를 실행하게되면 database user가 만들어지기 전이나, 사용할 준비가 되기전에 api service에서 연결을 시도하면 연결힐 수 없다.

이러한 문제를 해결하기위해 test에 작성된 명령을 interval 간격으로 retries만큼 반복하며 각각의 try에서 timeout을 설정해준다.

```
  build:
   context: [PATH]
   dockerfile: [DOCKERFILE_PATH]
```

Dockerfile을 이용하여 image를 build할때 작성한다.

context는 명령을 실행할 경로, dockerfile은 Dockerfile의 경로를 작성한다.

```
  ports:
   - "hostport:guestport"
```

docker container는 내부 local network를 사용하므로 외부와 접속하기 위해서 port를 연결해줘야한다.

docker network를 사용하면 container에 ip와 이름을 부여하여 사용할 수 있다.

```
  links:
   - [SERVICE_NAME]
```

container가 다른 container를 참조할 수 있게 하기 위해 작성한다.

container안에서 작성된 service name으로 참조할 수 있다.

```
  command: [COMMAND]
```


container를 실행할때 실행할 명령을 적는다.

쉘 스크립트 파일로 작성 가능하다.
