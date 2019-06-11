---
layout: post
title: 30 Docker Interview Questions to Ace DevOps Interview
date: 2019-02-02 +0900
author: kyhsa93
category: docker
cover: "/assets/docker.png"
---

# Q1: What is the need for DevOps?

요즘은 큰 기능들을 배포하는 것 대신, 작은 기능들이 일련의 배포로 사용자에게 전달될 수 있는지 시도하고 있습니다. 이것은 사용자들에게 빠른 피드백을 받고 더 나은 품질의 소프트웨어를 제공하는 등 많은 이점을 가집니다. 이를 위해 기업은 다음과 같은 조건을 수행해야 합니다.

0. 배포 횟수의 증가
0. 새로운 배포에 대한 보다 적은 실패 확률
0. 수정 간 리드 타임 단축
0. 새로운 릴리즈 충돌 시 빠른 복구 시간

DevOps는 이러한 모든 요구 사항을 충족시키고 원활한 소프트웨어 제공을 달성하는데 도움을 줍니다.

# Q2: What is Docker?

* Docker는 응용 프로그램과 모든 종속성을 컨테이너 형식으로 패키지화하여 응용 프로그램이 개발, 테스트 또는 생산과 같은 모든 환경에서 원활하게 작동하도록 보장하는 컨테이너화 플랫폼입니다.
* Docker 컨테이너는 코드, 런타임, 시스템 도구, 시스템 라이브러리 등 서버에 설치할 수 있는 모든 것을 실행하는 데 필요한 모든 것을 포함하는 완전한 파일 시스템에 소프트웨어 조각을 래핑힙니다.
* 따라서 소프트웨어가 환경과 관계없이 항상 동일하게 실행됩니다.

# Q3: What is the advantages of DevOps?

기술적 이점:

* 지속적인 소프트웨어 배포
* 낮은 복잡도의 복구
* 빠른 문제 해결

비지니스 이점:

* 빠른 기능 배포
* 안정된 운영환경
* 유지보수보다 더 많은 시간 사용가능

## Q4: What is the function of CI (Continuous Integration) server?

CI server 기능은 여러 개발자가 만들고 변경한 모든 사항을 지속해서 통합하고 오류를 확인하는 것입니다. 하루에 여러 번 코드를 빌드해야 하며, 모든 커밋이 끝나면 코드가 손상된 경우 어떤 커밋에서 발생했는지 탐지할 수 있어야 합니다.

## Q5: How to build environment-agnostic systems with Docker?

이것을 해결하는 데에는 세 가지 기능이 있습니다

* Volumes
* 환경변수 주입
* read-only 파일 시스템

## Q6: What is the difference between the COPY and ADD commands in a Dockerfile?

`ADD`와 `COPY`는 기능적으로 비슷하고 일반적으로도 그렇게 말하지만 `COPY`가 바람직합니다.

그 이유는 `ADD` 보다 `COPY`가 투명하기 때문입니다. `COPY`는 컨테이너에 로컬 파일의 기본 복사만 지원하며 `ADD`에는 즉시 명확하지 않은 일부 기능(로컬 전용 tar 추출 및 원격 URL 지원)이 있습니다. 결과적으로 `ADD`의 가장 좋은 용도는 `ADD rootfs.tar.xz / `와 같이 이미지에 로컬 tar 파일 자동 추출입니다.

## Q7: What is Docker image?

Docker image는 Docker 컨테이너의 소스입니다. 즉, Docker image는 컨테이너를 만드는데 사용됩니다. image는 `build` 명령으로 생성되며 `run` 으로 시작하면 컨테이너가 생성됩니다. image는 Docker 레지스트리에 저장되므로 이미지가 다른 이미지의 계층로 구성되도록 설계되어 네트워크를 통해 이미지를 전송할 때 최소한의 데이터만 전송할 수 있습니다.

## Q8: What is Docker container?

Docker container는 응용 프로그램과 모든 종속성을 포함하지만, 호스트 운영 체제의 사용자 공간에서 격리된 프로세스로 실행되는 다른 컨테이너와 커널을 공유합니다. Docker 컨테이너는 특정 인프라에 묶여 있지 않습니다. 모든 컴퓨터, 인프라 및 클라우드에서 실행됩니다.

## Q9: What is Docker hub?

Docker hub는 코드 저장소에 연결하고, 이미지를 빌드하고, 테스트하고, 수동으로 푸시된 이미지를 저장하고, Docker 클라우드에 대한 링크를 제공하여 호스트에 이미지를 배포할 수 있게 해주는 클라우드 기반 레지스트리 서비스입니다. 개발 파이프 라인 전체에서 컨테이너 이미지 검색, 배포 및 변경 관리, 사용자 및 팀 공동 작업, 워크플로우 자동화를 위한 중앙 집중식 자원을 제공합니다.

## Q10: What are the various status that a Docker container can be in at any given point in time?

Docker 컨테이너 상태에는 네 가지가 있습니다

* running
* paused
* restarting
* exited

## Q11: Is there a way to identify the status of a Docker container?

Docker 컨테이너 상태는 다음 명령으로 확인할 수 있습니다.

```bash
  docker ps -a
```

호스트에 있는 사용할 수 있는 컨테이너를 현재 상태와 함께 보여줍니다. 이를 이용해 쉽게 컨테이너의 상태를 확인할 수 있습니다.

## Q12: What are the most common instructions in Dockerfile?

Dockerfile에서 흔히 쓰이는 구문은 다음과 같습니다.

* `FROM`: base image로 사용할 이미지를 구문 뒤에 작성합니다. 모든 Dockerfile에서 `FROM`은 첫 번째 구문입니다.
* `LABEL`: `LABEL`을 사용하여 프로젝트, 모듈, 라이센스 등으로 이미지를 구성합니다. Dockerfile을 프로그래밍 방식으로 처리하는 데 사용할 수 있는 key/value 값을 지정할 수 있습니다.
* `RUN`: 현재 이미지 위에 새 계층의 명령을 실행합니다.
* `CMD`: 컨테이너를 실행할 때 사용할 기본값입니다. Dockerfile에서 여러 `CMD`를 사용할 때 마지막에 사용된 구문이 사용됩니다.

## Q13: What type of applications - Stateless or Stateful are more suitable for Docker Container?

Docker 컨테이너용 stateless 응용 프로그램을 만드는 것이 좋습니다. 애플리케이션 밖에서 컨테이너를 생성하고 애플리케이션의 매개 변수를 가져올 수 있습니다. 그러면 Production 환경과 QA 환경에서 같은 컨테이너를 사용하고 다른 환경변수를 사용할 수 있습니다. 이 방식은 서로 다른 환경에서의 이미지 재사용을 도와줍니다. 또한, stateless 애플리케이션은 컨테이너의 스캐일을 조정하는데 더욱 쉽습니다.

## Q14: Explain basic Docker usage workflow

0. 모든 것은 Dockerfile에서 시작합니다. Dockerfile은 이미지의 소스코드입니다.
0. Dockerfile이 생성되었으면, 컨테이너의 이미지를 `build` 합니다. 이미지는 Dockerfile의 컴파일된 버전입니다.
0. 컨테이너를 위한 이미지가 완성되었으면, 알맞은 registry에 구성합니다. registry는 git repository와 같이 이미지를 `pull`, `push` 할 수 있습니다.
0. 이제 이미지를 사용하여 컨테이너를 `run` 할 수 있습니다. 실행 중인 컨테이너는 여러 측면에서 가상 시스템과 매우 유사합니다. (하이퍼 바이저 제외)

## Q15: What is the difference between Docker Image and Layer?

* Image: Docker image는 read-only 시리즈에서 빌드된 것입니다.
* Layer: 각각의 layer들은 이미지의 Dockerfile에 의해 재구성될 수 있습니다.

다음 네 가지 명령을 포함한 Dockerfile은 각각의 layer를 구성합니다.

```Dockerfile
  FROM ubuntu:15.04
  COPY . /app
  RUN make /app
  CMD python /app/app.py
```

중요한것은, 각각의 layer는 이전 layer와의 차이만을 갖습니다.

## Q16: What is virtualisation?

초기의 가상화는 논리적으로 여러 응용 프로그램을 동시에 실행할 수 있도록 메인 프레임을 나누는 방법으로 간주하였습니다. 그러나 기업과 오픈 소스 커뮤니티가 단일 방식으로 명령어를 처리하는 방법을 제공하고 단일 x86 기반 시스템에서 여러 운영 체제를 동시에 실행할 수 있게 하면서 시나리오가 크게 바뀌었습니다.

실제 효과는 가상화를 통해 같은 하드웨어에서 완벽히 다른 두 개의 OS를 실행할 수 있다는 것입니다. 각 게스트 OS는 부트스트랩, 커널 로드 등의 모든 프로세스를 거칩니다. 예를 들어 게스트 OS가 호스트 OS나 다른 게스트에 대한 전체 접근 권한을 얻지 못하는 것과 같이 매우 엄격한 보안을 유지할 수 있습니다.

가상화 방법은 하드웨어를 게스트 운영 체제로 모방하는 방법과 게스트 운영 환경을 에뮬레이트하는 방법에 따라 분류할 수 있습니다. 주로 다음과 같은 세 가지 유형의 가상화가 있습니다.

* 에뮬레이션
* 반 가상화
* 컨테이너 기반 가상화

## Q17: What is Hypervisor

하이퍼 바이저는 게스트 가상 머신이 작동되는 가상 환경을 만들어 처리 합니다. 게스트 시스템을 감독하고 필요에 따라 자원이 게스트에게 할당되도록 합니다. 하이퍼 바이저는 실제 시스템과 가상 시스템 사이에 있어 가상 시스템에 가상화 서비스를 제공합니다. 이를 실현하기 위해 가상 컴퓨터에서 게스트 운영 체제 작업을 차단하고 호스트 컴퓨터의 운영 체제에서 작업을 에뮬레이트합니다.

클라우드를 중심으로 한 가상화 기술의 급속한 발전은 젠(Xen), VMware Player, KVM 등과 같은 하이퍼 바이저를 사용하여 하나의 물리적 서버에 여러 개의 가상 서버를 생성할 수 있게 함으로써 가상화 사용을 더욱 촉진 시켰습니다. Intel VT 및 AMD-V와 같은 범용 프로세서에 하드웨어 지원이 통합되었습니다.

## Q18: What is Docker Swarm?

Docker Swarm은 Docker를 위한 native 클러스터입니다. Docker host pool을 단일 가상 Docker host로 사용할 수 있게 합니다. Docker Swarm은 표준 Docker API를 제공하며 이미 Docker 데몬과 통신하는 모든 도구는 Swarm을 사용하여 여러 호스트로 확장할 수 있습니다.

## Q19: How will you monitor Docker in production?

Docker는 Docker stats 및 Docker events와 같은 도구를 제공하여 Docker를 프로덕션 환경에서 모니터링합니다. 이 명령으로 중요한 통계에 대한 보고서를 얻을 수 있습니다.

* docker stats: 컨테이너 id를 사용하여 docker stats를 호출하면 컨테이너의 CPU, 메모리 사용량 등이 표시됩니다. linux의 top 명령과 유사합니다.
* docker events: docker events는 docker 데몬에서 발생하는 활동 스트림을 표시하는 명령입니다.

일반적인 docker events 중 일부는 attach, commit, die, detach, rename, destroy 등입니다. 우리는 또한 다양한 옵션을 사용하여 관심 있는 이벤트를 제한하거나 필터링할 수 있습니다.

## Q20: What is an orphant volume and how to remove it?

orphant volume은 컨테이너가 없는 볼륨입니다. Docker v1.9 이전 버전에서는 orphant volume을 제거하는 것이 매우 어려웠습니다.

## Q21: What is Paravirtualization?

타입 1 하이퍼 바이저라고도하는 반 가상화는 하드웨어 또는 bare-metal에서 직접 실행되며 가상화 서비스가 실행 중인 가상 컴퓨터에 직접 제공됩니다. 운영 체제, 가상화된 하드웨어 및 실제 하드웨어가 협업하여 최적의 성능을 얻을 수 있도록 도와줍니다. 이러한 하이퍼 바이저는 일반적으로 크기가 작고 광범위한 자원이 필요하지 않습니다. 

예로는 Xen, KVM 등이 있습니다.

## Q22: How is Docker different from a virtual machine?

Docker는 가상화 방법론이 아닙니다. 실제로 컨테이터 기반 가상화 또는 운영 체제 수준 가상화를 구현하는 다른 도구를 사용합니다. 이를 위해 Docker는 초기에 LXC 드라이버를 사용하고 있었고 `libcontainer`를 거쳐 현재는 `runc`로 변경되었습니다. Docker는 주로 응용 프로그램 컨테이너 내부의 응용 프로그램 배포 자동화에 중점을 둡니다. 응용 프로그램 컨테이너는 단일 서비스를 패키지하고 실행하도록 설계됐지만 시스템 컨테이너는 가상 시스템과 같은 여러 프로세스를 실행하도록 설계되었습니다. 따라서 Docker 컨테이너 시스템의 컨테이너 관리 또는 응용 프로그램 배포 도구로 간주합니다.

* 가상 시스템과 달리 컨테이너는 운영 체제 커널을 부팅 할 필요가 없으므로 컨테이너를 1초 안에 만들 수 있습니다. 이 기능을 통해 컨테이너 기반 가상화는 다른 가상화 방식보다 독특하고 바람직합니다.
* 컨테이너 기반 가상화는 호스트 시스템에 오버 헤드를 거의 또는 전혀 추가하지 않기 때문에 컨테이너 기반 가상화는 거의 기본 성능을 갖습니다.
* 컨테이너 기반 가상화의 경우 다른 가상화와 달리 추가 소프트웨어가 필요하지 않습니다.
* 호스트 시스템의 모든 컨테이너는 추가 자원이 필요하지 않은 호스트 시스템의 스케줄러를 공유합니다.
* 컨테이너 상태 (Docker 또는 LXC 이미지)는 가상 시스템 이미지에 비해 크기가 작으므로 컨테이너 이미지를 배포하기 쉽습니다.
* 컨테이너의 자원 관리는 cgroup을 통해 수행됩니다. Cgroup은 컨테이너가 할당된 것보다 많은 자원을 소비하는 것을 허용하지 않습니다. 그러나 현재 호스트 컴퓨터의 모든 자원은 가상 컴퓨터에서 볼 수 있지만 사용할 수는 없습니다. 이는 컨테이너와 호스트 시스템에서 top 또는 htop을 동시에 실행하여 구현할 수 있습니다. 모든 환경의 출력이 비슷하게 보입니다.

## Q23: Can you explain dockerfile ONBUILD instruction?

`ONBUILD` 명령은 이미지에 이미지가 다른 빌드 용 기재로서 사용되는 경우, 나중에 실행하기 위한 트리거 명령을 추가합니다. 이는 다른 이미지 (예 : 응용 프로그램 빌드 환경 또는 사용자별 구성으로 사용자 정의 될 수 있는 데몬)를 빌드하기 위해 기본으로 사용될 이미지를 빌드하는 경우에 유용합니다.

## Q24: Is it good practice to run stateful applications on Docker? What are the scenarios where Docker best fits in?

Statefull Docker 응용 프로그램의 문제점은 기본적으로 컨테이너 파일 시스템에 상태 (데이터)를 저장한다는 것입니다. 일단 소프트웨어 버전을 업데이트하거나 다른 컴퓨터로 옮기고 싶다면 거기에서 데이터를 검색하기가 어렵습니다.

필요한 것은 컨테이너에 볼륨을 바인드하고 볼륨에 데이터를 저장하는 것입니다.

`docker run -v hostFolder:/containerfolder` 사용하여 컨테이너를 실행하는 경우에 /containerfolder 대한 변경 사항은 hostfolder에 유지됩니다 . nfs 드라이브를 사용하여 유사한 작업을 수행할 수 있습니다. 그런 다음 호스트 시스템에서 응용 프로그램을 실행할 수 있으며 상태는 nfs 드라이브에 저장됩니다.

## Q25: Can you run Docker containers natively on Windows?

Windows Server 2016을 사용하면 Windows에서 Docker 컨테이너를 기본적으로 실행할 수 있으며 Windows Nano Server에서는 컨테이너 내부에서 실행되는 경량 OS를 사용하므로 고유 플랫폼에서 .NET 응용 프로그램을 실행할 수 있습니다.

## Q26: How does Docker run containers in non-Linux systems?

컨테이너 개념은 Linux 커널 버전 2.6.24에 추가된 네임 스페이스 기능으로 가능합니다. 컨테이너는 ID를 모든 프로세스에 추가하고 모든 시스템 호출에 새로운 접근 제어 검사를 추가합니다. 이전에 전역 네임 스페이스의 개별 인스턴스를 만들 수 있는 clone () 시스템 호출을 통해 접근 할 수 있습니다.

Linux 커널에서 사용할 수 있는 기능 덕분에 컨테이너가 가능하다면, Linux가 아닌 시스템이 컨테이너를 실행하는 방법에 대한 분명한 의문이 있습니다. Mac 및 Windows 용 Docker는 Linux VM 을 사용하여 컨테이너를 실행합니다. Virtual Box VM에서 컨테이너를 실행하는 데 사용되는 Docker Toolbox 그러나 최신 Docker는 Windows에서 Hyper-V를 사용하고 Mac에서는 Hypervisor.framework를 사용합니다.

## Q27: How containers works at low level?

2006 년 경에 Google 직원 중 일부를 포함한 사람들은 새로운 Linux 커널 레벨 기능인 네임 스페이스를 구현했습니다 (이전의 아이디어는 FreeBSD에 있었습니다). OS의 한 기능은 네트워크 및 디스크와 같은 글로벌 자원을 프로세스에 공유할 수 있게 하는 것입니다. 이러한 글로벌 자원이 같은 네임 스페이스에서 실행되는 프로세스에만 표시되도록 네임 스페이스에 래핑 되었을 때 어떻게 할까요? 예를 들어, 디스크 덩어리를 가져와서 네임 스페이스 X에 넣은 다음 Y 네임 스페이스에서 실행 중인 프로세스는 디스크를 보거나 접근 할 수 없습니다. 마찬가지로 네임 스페이스 X의 프로세스는 네임 스페이스 Y에 할당된 메모리의 모든 항목에 접근 할 수 없습니다. 물론 X의 프로세스는 네임 스페이스 Y의 프로세스를 보거나 말할 수 없으므로 전역 자원에 대해 가상화 및 격리를 제공합니다.

Docker가 작동하는 방식입니다. 각 컨테이너는 자체 네임 스페이스에서 실행되지만 다른 모든 컨테이너와 정확히 같은 커널을 사용합니다. 고립은 커널이 프로세스에 할당된 네임 스페이스를 알고 API 호출 중에 프로세스가 자체 네임 스페이스의 자원에만 접근 할 수 있도록 하기 때문에 발생합니다.

## Q28: Name some limitations of containers vs VM

* VM과 같은 컨테이너에서는 완벽히 다른 OS를 실행할 수 없습니다. 그러나 같은 커널을 공유하기 때문에 Linux의 다른 배포판을 실행할 수 있습니다. 격리 수준은 VM 에서처럼 강력하지 않습니다. 사실 "게스트"컨테이너가 초기 구현에서 호스트를 대신할 수 있는 방법이 있었습니다.
* 또한 새 컨테이너를 로드 할 때 VM의 경우처럼 OS의 전체 복사본이 시작되지 않음을 알 수 있습니다.
* 모든 컨테이너는 같은 커널을 공유합니다. 이것이 컨테이너가 경량인 이유입니다.
* 또한 VM과 달리 컨테이너의 메모리를 미리 할당할 필요가 없습니다. 운영 체제의 새 복사본을 실행하지 않기 때문입니다. 이를 통해 하나의 OS에서 수천 개의 컨테이너를 실행하면서 샌드 박스화할 수 있습니다.이 컨테이너는 자체 VM에서 별도의 OS 사본을 실행하는 경우 불가능할 수도 있습니다.

## Q29: How to use Docker with multiple environments?

라이브 환경에 더 적합한 앱 설정을 변경하고 싶을 것입니다. 이러한 변경 사항은 다음과 같습니다.

* 코드가 컨테이너 안에 있고 외부에서 변경할 수 없도록 응용 프로그램 코드의 볼륨 바인딩 제거
* 호스트의 다른 포트에 바인딩
* 환경 변수를 다르게 설정 (예 : 로깅의 상세 표시를 줄이거나 전자 메일 보내기 사용)
* 중단 시간을 피하기 위해 재시작 정책 지정 (예 : restart : always)
* 추가 서비스 추가 (예 : 로그 애그리 게이터)

이러한 이유 때문에 프로덕션에 적합한 구성을 지정하는 추가 Compose 파일을 정의하려고 할 것입니다. 이 구성 파일은 원래 작성 파일에서 변경하려는 내용만 포함하면 됩니다.

## Q30: Why Docker compose does not wait for a container to be ready before moving on to start next service in dependency order?

compose는 항상 컨테이너를 실행하고 중지할 때 다음에 의해 의존성을 가집니다. depends_on, links, volumes_from, 및 network_mode: "services ...".

그러나 시작을 위해 Compose는 컨테이너가 "준비"될 때까지 기다리지 않습니다 (특정 응용 프로그램에 해당하는 것이 무엇이든). 이것에 대한 좋은 이유가 있습니다.

* 데이터베이스 (예를 들어)가 준비되기를 기다리는 문제는 실제로 분산 시스템의 훨씬 큰 문제의 부분 집합입니다. 프로덕션 환경에서는 언제든지 데이터베이스를 사용할 수 없거나 호스트를 이동할 수 있습니다. 응용 프로그램은 이러한 유형의 오류에 대해 복원력이 있어야 합니다.
* 이 문제를 해결하려면 응용 프로그램이 실패한 후 데이터베이스 연결을 다시 시도하도록 디자인해야 합니다. 응용 프로그램이 연결을 재시도하면 결국 데이터베이스에 연결할 수 있습니다.
* 가장 좋은 해결책은 시작할 때와 어떤 이유로 든 연결이 끊어질 때마다 응용 프로그램 코드에서 이 검사를 수행하는 것입니다.
