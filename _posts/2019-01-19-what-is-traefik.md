---
layout: post
title: what is traefik
date: 2019-01-19 +0900
author: kyhsa93
category: docker
cover: "https://raw.githubusercontent.com/containous/traefik/master/docs/img/traefik.logo.png"
---

Traefik은 마이크로 서비스를 쉽게 배포할 수 있도록 해주는 최신 HTTP reverse proxy 및 로드밸런서입니다. traefik은 기존 인프라 구성 요소 (Docker, Swarm mode, Kubernetes, Marathon, Consul, Etcd, Rancher, Amazon ECS 등)와 통합되어 자동으로 동적으로 구성됩니다. 오케스트레이터에서 traefik을 가리키는 것이 유일하게 필요한 작업입니다.

오케스트레이터 (Swarm 또는 Kubernetes와 같은) 또는 서비스 레지스트리 (etcd 또는 consul과 같은)의 도움으로 여러가지 마이크로 서비스를 배포하게된다면 사용자가 서비스에 접근할 수 있어야하고, 또 서비스에 접근하기 위한 reverse proxy가 필요합니다.

기존의 reverse proxy에서는 경로 및 하위 도메인을 각 마이크로 서비스에 연결할 각각의 경로를 구성해야합니다. 하루에 여러 서비스를 추가, 제거, 삭제, 업그레이드 또는 확장하는 환경에서는 경로를 최신 상태로 유지하는 작업이 필요합니다.

traefik은 서비스 레지스트리/오케스트레이터 api를 청취하고 즉시 마이크로 서비스가 외부 인터넷에 연결되도록 경로를 생성합니다. 이러한 과정이 자동으로 이루어 지기 때문에 추가적인 작업이 필요하지 않습니다.

그러나 일부 경로를 수동으로 구성하는것이 필요할 경우도 traefik에서 지원하고 있습니다.

traefik에는 다음과 같은 몇가지 특징이 있습니다.

0. 실시간 자동 업데이트로 재시작할 필요가 없습니다.
0. 다중 로드밸런싱 알고리즘을 지원합니다.
0. Let's Ecrypt (wildcard 인증서 지원)를 활용하여 마이크로 서비스에 https 제공
0. circuit breakers, retry
0. 클러스터모드에서 높은 가용성
0. 간단한 web UI 제공
0. websocket, http/2, grpc 준비중(?)
0. (Rest, Prometheus, Datadog, Statsd, InfluxDB) metric 제공
0. access log 유지
0. 빠른 속도
0. Rest API 노출
0. single binary file로 package 되어있고, 작은 docker image로 사용가능

이 quickstart에서는 docker compose를 사용하여 시연합니다.

docker-compose.yml에 traefik 이미지를 사용하는 reverse-proxy 서비스를 정의합니다.

```yml
  services:
    reverse-proxy:
      image: traefik
      command: --api --docker # web UI를 활성화하고 traefik이 docker event를 listen하게 합니다.
      ports:
        - "80:80" # http port
        - "8080:8080" # web UI (enabled by --api)
      volumes:
        - /var/run/docker.sock:/var/run/docker.socket # traefik이 docker event를 listen하게 합니다.
```

--api flag를 사용하여 web UI를 활성화하면 서비스 구성요소들이 노출될 수 있습니다.

reverse-proxy를 다음 명령으로 실행합니다.

```bash
  docker-compose up -d reverse-proxy
```

브라우저에서 http://localhost:8080에 접속하여 traefik의 대시 보드를 볼 수 있습니다.

traefik 인스턴스를 설치하고 실행했으므로 새로운 서비스를 배포합니다.

docker-compose.yml 파일의 끝에 아래 내용을 추가합니다.

```yml
  whoami:
    image: containous/whoami # ip 주소를 보여주는 container입니다.
    labels:
      - "traefik.frontend.rule=Host:whoami.docker.localhost"
```

위의 whoami 내용은 배치된 시스텝 (ip 주소, 호스트 등)에 대한 정보를 출력하는 간단한 웹 서비스를 정의합니다.

whoami를 다음 명령으로 실행합니다.

```bash
  docker-compose up -d whoami
```

브라우저(http://localhost:8080)로 돌아가서 traefik이 새 컨테이너를 자동으로 감지하고 자체 구성을 업데이트 했는지 확인할 수 있습니다.

traefik이 새로운 서비스를 발견하면 해당 경로를 작성하여 호출할 수 있습니다. curl을 사용하여 확인해보겠습니다.

```bash
  curl -H Host:whoami.docker.localhost http://127.0.0.1
```

다음 명령을 사용하여 whoami 서비스의 scale scale을 늘려줍니다.

```bash
  docker-compose scale whoami=2
```

브라우저(http://localhost:8080)로 돌아가서 traefik이 자동으로 새로운 컨테이너를 감지했는지 확인할 수 있습니다.

다음 명령을 두 번 실행하여 traefik이 서비스의 두 인스턴스에 대해 로드밸런싱을 수행하는것을 확인할 수 있습니다.

```bash
  curl -H Host:whoami.docker.localhost http://127.0.0.1
```

traefik이 서비스 경로를 자동으로 작성하고 로드밸런싱을 수행하는 방법에 대한 기본 지식을 얻었으므로 이제 [documentation](https://docs.traefik.io/)를 확인해 보시고 사용해 보시기 바랍니다.
