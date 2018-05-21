---
layout: post
title: What is docker?
date: 2018-05-19 +0900
author: kyhsa93
category: docker
cover: "/assets/docker.png"
---

`Docker`는 application을 신속하게 구축, test 및 배포할 수 있는 컨테이너 기반의 오픈소스 가상화 플랫폼이다.

`Docker`는 software를 container라는 표준화된 유닛으로 packging하며, 이 container에는 library, system tool, code, runtime 등 software를 실행하는데 필요한 모든 것이 포함되어 있다.

`Docker`는 다양한 프로그램, 실행환경을 컨테이너로 추상화하고 동일한 인터페이스를 제공하여 프로그램의 배포 및 관리를 단순하게 해준다.

백엔드 프로그램, 데이터베이스 서버, 메시지 큐등 어떤 프로그램도 컨테이너로 추상화할 수 있고 local, AWS, Azure, Google cloud등 어디에서든 실행할 수 있다.

`Docker`는 기존의 운영체제 안에서 process만 격리하여 VM과 같은 효과를 낸다.

VM은 OS를 통째로 install하고 CPU와 Memory를 쪼개서 사용하여 속도가 느리고 크기가 크지만, `Docker`는 real machine의 시스템 자원을 공유해서 사용하므로 가볍고 빠르다.

How docker works
---

`Docker`는 code를 실행하는 표준 방식을 제공하며, container를 위한 operating system이다.

virtual machine이 server hardware를 가상화하는 방식과 비슷하게(직접 관리해야 하는 필요성 제거) container는 server OS를 가상화한다.

`Docker`는 각 server에 설치되며 container를 구축, 시작, 중단하는데 사용할 수 있는 간단한 명령을 제공한다.

Why use the docker
---

`Docker`를 사용하면 code를 더 빨리 전달하고, application 운영을 표준화하고, code를 원활하게 이동하고, 리소스 사용률을 높여 비용을 절감할 수 있다.

`Docker`를 사용하면 어디서나 안적적으로 실행할 수 있는 단일 객체를 확보하게 된다.

`Docker`의 간단한 구문을 사용해 완벽하게 제어할 수 있다.

`Docker`가 폭넓게 도입이 되었다는 것은 `Docker`를 사용할 수 있는 도구 및 상용 application의 echo system이 강력하다는 의미이다.

0. 더 많은 소프트웨어를 더 빨리 제공
 - `Docker` user는 평균적으로 `Docker`를 사용하지 않는 사용자보다 7배 더 많은 software를 제공한다.
 - `Docker`를 사용하면 필요할 때마다 격리된 서비스를 제공할 수 있다.
0. 운영 표준화
 - 작은 container식 application을 사용하면 손쉽게 배포하고, 문제를 파알하고, 수정을 위해 rollback할 수 있다.
0. 원활한 이전
 - `Docker` 기반 application을 local development system에서 production 배포로 원활하게 이전할 수 있다.
0. 비용 절감
 - `Docker` container를 사용하면 각 server에서 좀 더 쉽게 더 많은 code를 실행하여 사용률을 높이고 비용을 절감할 수 있다.


When to use the docker
---

Docker container를 최신 application 및 platform을 생성하는 핵심 building block으로 사용할 수 있다.

`Docker`에서는 손쉽게 distributed micro service architecture를 구축 및 실행하고, 표준화된 지속적 통합 및 지속적 전달 pipeline을 통해 code를 배포하고, 고도로 확장 가능한 data processing system을 구축하고, 개발자를 위한 완전관리형 platform을 생성할 수 있다.

0. micro service
 - Docker container를 통해 표준화된 code 배포를 활용하여 distributed application architecture를 구축하고 확장한다.
0. 지속적인 통합 및 제공
 - environment를 표준화하고 언어 stack및 version간의 conflict를 제거함으로써 application을 더욱 빠르게 제공한다.
0. data processing
 - big data processing을 service로 제공한다.
 - data 및 분석 package를 기술자가 아닌 사용자도 실행할 수 있는 이동식 conatainer로 packaging한다.
0. 서비스로서의 container
 - 안전한 IT 관리형 infra와 contents로 distributed application을 구축 및 제공한다.

참고: [AWS](https://aws.amazon.com/docker/)

<div style="text-align: right">
  Image source by
  <a href="https://docs.docker.com/">
    here
  </a>
</div>

