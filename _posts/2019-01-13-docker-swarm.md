---
layout: post
title: Docker Swarm 높은 가용성 달성을 위한 docker 엔진 클러스터 설정
date: 2019-01-13 +0900
author: kyhsa93
category: docker
cover: "/assets/docker.png"
---

웹 기반 어플리케이션의 기능 중 가장 중요한 것은 무엇일까요? 많은 것이 있지만, 높은 가용성이 그 중 하나일 것입니다.
docker swarm은 높은 가용성을 이룰 수 있게 도와줍니다.

docker swarm은 docker 엔진 클러스터를 만들고 유지 관리하는 기술입니다.

docker 엔진은 다른 node에서 호스팅 될 수 있으며 원격 위치에 있는 node는 swarm 모드로 연결될 때 클러스터를 형성합니다.

왜 docker swarm을 사용하는지는 앞에서 언급되었습니다. downtime 없이 높은 가용성을 달성하는 것은 모든 서비스 제공 업체에게 우선 순위입니다.

다른 많은 서비스와 마찬가지로 docker swarm은 자동 로드 밸런싱을 수행합니다. 따라서 DevOps 엔지니어가 실패할 경우 다른 node로 처리 요청을 라우팅 할 필요가 없습니다. 클러스터의 manager는 자동으로 로드밸런싱을 수행합니다.

분산된 액세스는 또 다른 이점입니다. 모든 node에 manager가 쉽게 접근할 수 있습니다. manager는 또한 정기적으로 node에 prompt를 표시하고 downtime을 처리하기 위해 health/status를 추적합니다. 그러나 node는 다른 node, manager에서 실행중인 서비스에 접근하거나 추적할 수 없습니다.

한 줄의 명령어로 node에 실행중인 container의 수를 확인할 수 있고, container의 scale을 변경할 수 있습니다.

어플리케이션을 배포한 후에도 롤링 업데이트를 수행하고 CI(Continuous Integration)을 달성할 수 있습니다. 롤링 업데이트는 한번에 하나의 node에서 실행되고 downtime이 발생하지 않습니다. 또한 업데이트가 실행되는 동안 클러스터의 다른 node로 로드가 분산됩니다.

docker swarm은 manager에 의해 시작되고, swarm 클러스터를 시작하는 인스턴스가 manager가 됩니다. 클러스터 시작 명령은 다음과 같습니다.

```
  docker swarm init --advertise-addr ip-address
```

여기서 -advertise-addr 플래그는 클러스터에 참여하려는 다른 node에 자신을 알리는 것에 사용됩니다. manager의 ip주소는 플래그와 함께 지정해야합니다.

swarm 클러스터를 만드는 위의 명령이 성공하면 클러스터에 join 할 수 있는 토큰이 생성됩니다. 이 토큰은 다른 node가 swarm 클러스터에 참여하는데 사용합니다.

manager docker 엔진에서 생성된 토큰을 복사하여 다른 ndoe의 docker 엔진에서 실행하면됩니다.

클러스터에 join 한 모든 node는 manager로 승격될 수 있습니다. 클러스터에 manager로 join 하고 싶다면 다음 명령을 사용하면 됩니다.

```
  docker swarm join-token manager
```

클러스터에 node로 join 하기 위한 토큰은 다음 명령을 실행하면 됩니다.

```
  docker swarm join-token node
```

클러스터에 join 하려면 원하는 모든 node에서 토큰을 실행하면 됩니다. 모든 작업이 완료되면 docker node list 명령을 실행하여 상태에 따라 클러스터에 join 한 node 수를 확인할 수 있습니다. 명령은 다음과 같습니다.

```
  docker node ls
```

모두 정상적으로 작동하면 docker image가 설치된 경우 swarm service를 시작할 수 있습니다. docker image는 Dockerfile로 build 할 수 있습니다.

docker image가 build 되면 image에서 container를 실행시킬 수 있습니다. 하지만 더 나은 docker swarm service는 더 나은 기능을 제공합니다. service를 만드는 명령은 다음과 같습니다.

```
  docker service create --name service-name -p port:port docker-image-name
```

여기서 name 플래그는 service에 이름을 지정하는데 사용되고, p 옵션은 컨테이너 포트와 호스트 포트에 노출하는데 사용됩니다. 명령의 마지막에 사용할 docker image의 이름을 작성하면 됩니다.

service를 만들때 클러스터의 모든 docker 엔진에서 호스팅 할 수 있습니다. swarm manager가 호스팅될 위치를 결정하지만, 특정 node에 호스팅되어 있더라도 어플리케이션은 클러스터에 join된 모든 node에서 노출된 포트로 접근할 수 있습니다.

swarm은 클러스터의 다른 모든 node가 접근할 수 있도록 포트 번호를 내부적으로 노출하기 때문에, 모든 node에 호스팅되어 있지 않아도 service에 접근이 가능합니다.

docker service list 명령을 실행하여 service가 containerized되었는지 확인할 수 있습니다. 그러나 container를 배치하는데 1분정도 소요될 수 있습니다. 다음은 docker service list를 보여주는 명령입니다.

```
  docker service ls
```

이 명령은 swarm 클러스터가 관리하는 모든 service를 나열합니다.

어플리케이션이 호스팅되는 node/manager를 식별하려면 docker service ps명령 다음에 service 이름이 오는 명령을 실행할 수 있습니다. 명령은 다음과 같습니다.

```
  docker service ps service-name
```

명령 결과에는 service를 시작하는데 사용되는 명령과 함께 어플리케이션이 호스팅되는 node에 대한 세부 정보가 나와 있습니다.

생성된 service를 삭제하는 명령은 다음과 같습니다.

```
  docker service rm service-name
```

container가 모든 node에서 실행되는 service를 만드려면 global mode로 service를 생성할 수 있습니다.
replication mode에서 global mode로 update는 불가하니 service create 명령을 사용하여 생성해야합니다.
명령은 다음과 같습니다.

```
  docker service create --name service-name --mode global -p port:port docker-image-name
```

클러스터에서 실행중인 service의 scale을 지정할 수 있습니다. 명령은 다음과 같습니다.

```
  docker service scale service-name=number
```

명령 실행 후 docker serivce ps 명령을 service 이름과 함께 실행하면 scale이 변경된 service가 node들에서 로드밸런싱되고 분신되는 것을 확인할 수 있습니다.

마지막으로 docker swarm에서 manager가 어플리케이션을 호스팅하지 않고, 프로세스 관리만 하도록 변경하려면 다음 명령을 사용하면 됩니다.

```
  docker node update --availability drain manager-node-name
```

docker node list 명령으로 manager가 클러스터에 참여하고 있는지 확인할 수 있습니다.
