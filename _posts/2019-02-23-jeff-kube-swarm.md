---
layout: post
title: Jeff Nickoloff의 Kube와 swarm 비교실험
date: 2019-02-23 +0900
author: kyhsa93
category: docker
cover: "/assets/docker.png"
---

# Kubernetes vs Docker swarm

현재 production 환경에서 swarm 으로 클러스터를 만들어서 운영하고 있다. 그러다가 Google Borg 프로젝트에서 나온 Kubernetes와 swarm을 비교해서 어떤것이 더 좋고 나쁜지 장단점을 알고 싶어서 비교 예시를 찾던 중 Jeff Nickoloff라는 사람이 했던 실험과 그 결과를 찾게 되었고 재미있는 내용이라고 생각되어서 남기게 되었다.

Jeff Nickoloff는 독립 기술 컨설턴트로 이 글은 2016년도에 작성된 글을 읽고 작성한 것이다. 이 실험에서는 컨테이너 시작 시간(컨테이너를 단순히 시작하는 과정과 얼마나 빠르게 새로운 컨테이너를 온라인 상태로 만들 수 있는가?)와 부하가 가해진 상황에서 시스템의 응답성(부하가 발생하는 상태에서 operation 명령에 대해 시스템이 얼마나 빨리 응답하는가? 이 시험에서는 동작 중인 모든 컨테이너의 리스트를 출력하도록 하는 명령)을 측정하여 비교하였다.

시험에서 사용된 노드와 컨테이너의 규모는 1,000개의 노드에서 30,000개의 컨테이너(노드당 30컨테이너)가 사용되었다. 시험 방식은 노드들이 클러스터에 추가될때, 측정이 시작되고 컨테이너를 구동하는데 소요되는 시간과 시스템의 응답성을 측정하였다. 또한, 전체 클러스터의 10%, 50%, 90%, 99%, 100% 구동 상태마다 측정을 하였고 1,000회 반복하여 응담성 성능을 측정하였다.

## 컨테이너 구동 시간 비교

컨테이너를 구동하는 시간만 비교해보자면 swarm이 평균 5배 이상 빠른 것으로 나타났고, 응답성에 있어서는 7배 빠른 것으로 나타났다.

![Alt text](/assets/swarm-vs-kube-respond-speed.png)

이 실험의 관점은 이렇디. 일단 컨테이너 스케줄링에 관한 시험이 아니라 컨테이너를 구동하고 작업을 수행하는 관점인데, 예를 들면 이렇다. 외식을 하려고 레스토랑에 갔을 때 내가 주문한 내용이 주방에 어떻게 잘 전달되었는가는 중요하지 않은 것이다. 중요한 것은 내가 주문한 음식이 얼마나 빨리 나올 수 있는가가 중요한 것이라는게 이 실험의 첫 번째 관점이다.

두 번째는 컨테이너에 기대하는 것은 민첩성과 반응성이라는 것이다. 인프라를 구동하는데 더 많은 시간이 걸린다는 것은 바람직하지 않다. CI(continuous integration) 워크플로우의 일부로써의 orchestration을 고려해 보면 컨테이너 구동에 시간이 더 걸린다는 것은 전체 테스트 사이클에 더 많은 시간이 들어 가게 만든다.

## 부하상태에서 시스템 응답성

다음 측정 데이터는 시스템이 부하상태일때 그 응답성을 측정했다. 이 시험에서는 클러스터에 동작하고 있는 모든 컨테이너들의 리스트를 출력하는데 소요되는 시간을 측정하였다. 

결과는 swarm에 대비하여 Kubernetes는 100% 로드에 도달하는 시점에 7배 이상 시간이 걸려ㅛ서 실행중인 컨테이너를 전부 리스트하는데 2분이 걸렸다. 더구나 Kubernetes는 10% 로드에서 100% 로드로 진행되면서 98배가 느려지는 현상을 보였다(98%의 오타가 아니라 98배이다).

![Alt text](/assets/swarm_kube_load_response.png)

## 단순성

Jeff의 시험환경에 대한 다이어그램을 살펴보면 swarm이 kubernetes보다 구성요소가 적다는 것을 알 수 있다. 이 시험에서 사용된 `run`이나 `list`와 같은 명령을 수행하기 위해서 kubernetes는 swarm 보다 8배 더 많은 연동 절차가 필요한데, 이것이 7배의 속도차이가 나는 이유이다. 이런 복잡성의 추가적인 문제점은 명령을 수행하던 중에 오류가 발생하면 그 원인을 예상해 내기가 어렵다는 점이다.

## Jeff 시험환경에 대한 다이어그램

![Alt text](/assets/jeff_diagram.png)

## 단순성 비교 결론

위의 결과는 Kubernetes가 Borg로 부터 갈라져 나왔을 뿐만아니라 Borg이 전반적인 복잡성과 클라우드 엔지니어들이 매일같이 유지보수를 위해 노력해야만 한다는 점 까지도 그대로 이어 받았다는 점을 보여준다. kubernetes가 더 많은 기능을 지원하기 때문에 더 복잡할 수 밖에 없다는 것이 터무니 없는 말이라고는 생각하지 않는다. 하지만 “많은” 것들을 가져오기 위한 것들이 장애 포인트가 될 수 있으며 운영에 비용이 더 들어 가고 불필요한 인프라스트럭쳐에 투자되어야 할 수도 있다.

Jeff Nickoloff: “Kubernetes는 더 많은 요소들로 이루어져있고, 더 많은 배워야할 면들이 있고, 더 많은 장애 가능성을 가진 대규모 프로젝트입니다. Kubernetes 아키텍처를 통해서 Swarm 아키텍처에서 알려진 몇 가지 약점을 해결할 수도 있지만 난해한 문제들을 더 많이 발생시킵니다.”

![Alt text](/assets/swarm_kube_component.png)

사실 swarm으로 서비스를 구성하기전에 kubernetes를 쓸것인가 swarm을 쓸 것인가에 대한 고민이 많이 있었다. 그러나 swarm을 선택하여 서비스에 적용한 것은 docker만 있으면 사용이 가능하고 무엇보다 간단하고 단순하다는 이유가 컸다. 그러나 서비스 규모가 좀 더 커지고 다양한하고 섬세한 컨테이너 사용이 필요하다면 kubernetesdml 사용을 다시 고려해 볼 수는 있을것 같다. 
