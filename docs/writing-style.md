# 블로그 문체 지침

이 블로그는 10년차 한국인 백엔드 개발자가 쓰는 개인 기술 블로그다. 지금 한국어 본문은 대부분 영어 원문을 옮긴 글이라, 번역기나 AI가 쓴 것처럼 읽힌다. 이 문서는 그 냄새를 지우는 기준이다. 글을 다시 쓰는 사람은 이 파일만 읽고 같은 방향으로 고칠 수 있어야 한다.

대상은 `src/pages/Post/*.tsx`의 `content.ko`(우선)와 `content.en`, 그리고 `src/data/posts.ts`의 한국어 문자열(`title.ko`, `summary.ko`, `discrepancy.*.ko`)이다.

## 1. 건드리지 말 것

- **사실과 숫자 값.** 80장은 80장이고 51.7%는 51.7%다. 표기만 바꾼다(`여든 장` → `80장`). 영어판에 없는 주장이나 사례를 새로 넣지 않는다. 어림 표현도 사실이다. `roughly eighty`는 `약 80건`이지 `80건 가까이`(80 아래라는 뜻)나 `80건 넘게`가 아니다. `real questions`를 `a few questions`처럼 원문에 없는 수량으로 바꾸지도 않는다.
- **영어판이 사실의 기준이다.** 한국어판이 영어판과 뜻이 다르면 영어판에 맞춘다. 예: `more than one page`를 `한 장 이상`으로 옮긴 곳이 있는데, 뜻은 `두 장 이상`이다(`HalfTheSiteWasACopyOfItself.tsx`, `posts.ts`). 이런 오역은 고친다.
- **코드.** `<pre><code>` 블록, 코드 상수(`const ..._SNIPPET`), `<code>` 안의 식별자, 파일 경로, 명령어는 한 글자도 바꾸지 않는다.
- **링크.** `href`는 그대로 둔다. 링크 문구는 자기 글 안에서만 다듬는다(다른 글 제목을 인용한 문구를 맞추러 남의 파일을 열지 않는다).
- **JSX 구조.** 태그 종류와 순서, `className`, `<h2>` 개수와 순서, `article-note` 개수, 표의 행·열, `<em>`/`<strong>` 위치의 대략적인 수. 절을 합치거나 쪼개지 않는다. 문단(`<p>`) 수는 쪼개거나 합쳐도 되지만 절 안에서만.
- **메타.** `slug`, 파일명, 컴포넌트 이름, `date`, `tags`, `kicker`(한국어판도 영어 그대로 둔다), `readMinutes`.
- **AdSense 규칙(`CLAUDE.md`의 "AdSense content guidelines").** 본문에 PR·이슈 번호, 커밋 해시, 내부 라운드·세션 횟수를 **넣지 않는다**. 이미 들어 있는 것을 발견하면 지운다. 이건 위의 "JSX 구조 유지"보다 우선하고, 영어판에도 똑같이 적용한다(4절 범위 밖이어도 고친다). 커밋 해시 열이 있던 `NarrowWhatNeverWho.tsx`의 표는 시범에서 그 열만 뺐다. 5절 점검의 `ids` 열이 0이 아니면 같은 종류가 남은 것이다.
- **내부 라운드·세션 표현.** 횟수와 서수(`세 번째 라운드`, `네 라운드 뒤`, `이번 라운드`, `the fourth round`)는 en·ko 모두 지운다. `TheDocSaidDoneHalfOfItWasnt`처럼 글의 뼈대가 라운드 순서인 글은 횟수 대신 무엇이 계기였는지로 잇는다. 숫자 없는 `round`는 영어판에서는 그대로 둬도 되지만, 한국어판에서는 `라운드`라고 쓰지 않고 뜻대로 옮긴다.
  - `다른 라운드가 몇 주 전에 고친 버그` → `몇 주 전 프로덕션에서 이미 고친 버그`
  - `이전 라운드가 버그 하나를 고친 적이 있었다` → `그 전에 프로덕션 버그를 하나 고친 적이 있다`
  - `기능 개발 한두 라운드씩 뒤처져` → `실제 파일이 기능 작업을 한두 번 더 거치는 동안 문서는 그대로였다`
  - `세 라운드가 더 이어졌고, 총 15개` → `같은 질문으로 몇 번 더 훑었고, 모두 15개` (결과 숫자 15는 남긴다. 지우는 건 작업 횟수다)
  - `감사 라운드 전후로` → `감사 전후로`
- **날짜.** 게시 날짜를 바꾸거나 꾸미지 않는다.

## 2. 기본 문체

| 항목 | 규칙 |
|---|---|
| 종결어미 | **한다체**(`~다`, `~였다`). 47편 모두 이미 한다체이고, 제목도 `~였다`로 끝난다. 바꾸지 않는다. 합니다체·해요체를 섞지 않는다(인용문 안은 예외). |
| 독자에게 권할 때 | `~하라`, `~할 것`, `~해라` 대신 `~하면 된다`, `~하는 게 낫다`, `~하자`. 상자(`article-note`) 제목은 `~할 것`도 허용(메모 말투). |
| 1인칭 | 기본은 생략. 꼭 필요하면 `나`. `필자`, `저`, `우리`는 쓰지 않는다(1인 블로그다). |
| 2인칭 | `당신` 금지. 생략하거나 `내 ~`, `자기 ~`로. |
| 문장 길이 | 한 문장 60~80자 안팎. 120자를 넘으면 쪼갠다. 관형절(`~한`, `~던`)이 두 겹 이상 쌓이면 쪼갠다. |
| 문단 길이 | 일부러 섞는다. 한두 문장짜리 문단도 괜찮다. 모든 문단이 비슷한 길이로 4~5문장이면 기계가 쓴 티가 난다. |
| 숫자 | 아래 3절 R2. |
| 영어 용어 | 아래 3절 R10. |

## 3. 규칙과 예문

예문은 모두 지금 글에서 뽑았다. "전"은 현재 문장, "후"는 고친 문장이다. 후 문장은 정답이 아니라 방향이다.

### R1. 대시(—)는 글 전체에 3개까지

한국어판 대시가 47편에 856개, 한 편에 평균 18개다. 영어 문장의 `—`를 그대로 옮긴 자리다. 한국어에서는 쉼표, 괄호, 문장 나누기로 바꾼다. lede(첫 요약문)와 제목에는 쓰지 않는다.

- 전: `두 페이지를 열면 달라 보인다 — 제목이 다르고, 숫자가 다르고, 탭에 뜨는 이름이 다르다. 그러고 넘어간다.` (HalfTheSiteWasACopyOfItself)
- 후: `두 페이지를 열어 보면 제목도 숫자도 탭 이름도 다르다. 그래서 다르다고 여기고 넘어간다.`
- 전: `그런데 네 절이 전부 같은 필드 하나 — 연도에서 유도한 다섯 가지 분류 — 를 키로 써서` (HalfTheSiteWasACopyOfItself)
- 후: `그런데 네 절이 모두 같은 필드 하나를 키로 쓰고 있었다. 연도로 정하는 분류 값인데, 가짓수가 5개뿐이다.`

### R2. 숫자는 아라비아 숫자로

영어 `eighty pages`를 `여든 장`으로 옮긴 곳이 많다. 한국어 기술 글에서 수량은 아라비아 숫자가 기본이다.

- 세거나 잰 값(결과, 건수, 장수, 비율, 줄 수, 언어 수)은 **항상** 아라비아 숫자: `80장`, `18장`, `15줄`, `5개 언어`, `3문장`.
- 한글 수 관형사는 말버릇처럼 굳은 작은 수에만: `한 번`, `두 가지`, `하나뿐`, `둘 다`, `세 가지 모양`(제목처럼 쓰인 것). 10 이상은 한글로 쓰지 않는다(`열여덟 장` 금지).
- 같은 글 안에서 같은 대상은 같은 표기로(`5개 언어`와 `다섯 언어`를 섞지 않는다).
- 전: `출생 연도별로 한 장씩, 여든 장. 각 750자 남짓.` (HalfTheSiteWasACopyOfItself)
- 후: `출생 연도마다 한 장씩, 모두 80장이었다. 한 장에 750자 남짓이다.`
- 전: `그 표를 위해 만들어진 페이지에서는 그게 본문이다. 그런데 같이 받은 예산 구간 페이지 열여덟 장에서는` (HalfTheSiteWasACopyOfItself)
- 후: `그 표를 위해 만든 페이지에서는 표가 곧 본문이다. 그런데 같은 표를 받은 예산 구간 페이지 18장에서는`

### R3. 명사 조각 문장을 문장으로

영어의 `Eighty pages. Five distinct bodies.` 같은 끊어 치기를 그대로 옮기면 `여든 장, 본문 다섯 종.`처럼 서술어 없는 조각이 된다. 한국어 글에서는 메모처럼 읽힌다. 서술어를 붙인다.

- 전: `여든 장, 본문 다섯 종.` (HalfTheSiteWasACopyOfItself, posts.ts `discrepancy`)
- 후: `페이지는 80장인데 본문은 5가지뿐이었다.`
- 전: `5개 언어, 쉬운 과제 하나, 다섯 번의 첫 시도 승리.` (TheBugThatNeededTwoSubscribersToExist)
- 후: `5개 언어 모두 쉬운 과제 하나를 첫 시도에 통과했다.`
- 전: `상품군 탭 넷이 달린 비교 페이지.` (HalfTheSiteWasACopyOfItself)
- 후: `상품군 탭이 4개 달린 비교 페이지가 있었다.`
- 전: `파일 하나, URL 둘, 페이지 하나.`
- 후: `파일은 하나인데 URL은 둘이고, 실제 페이지는 하나다.`

### R4. 문장 가운데 콜론(:) 금지

`~를 보낸다: SIGTERM, 그리고 …`처럼 콜론 뒤에 나열이나 설명을 붙이는 건 영어 문장 구조다. 문장을 끝내고 다음 문장으로 설명한다. 코드 블록 바로 앞이라면 `다음과 같다.`, `이렇게 짧았다.`처럼 문장으로 끝낸다. `일반형:`, `과제:` 같은 머리말 콜론도 문장으로 풀어 쓴다.

- 전: `모든 배포, 모든 오토스케일 다운, 모든 노드 드레인이 동일한 신호를 보낸다: SIGTERM, 그리고 그 뒤에 SIGKILL이 뒤따르기까지의 카운트다운.` (GracefulShutdown)
- 후: `배포할 때도, 오토스케일로 줄어들 때도, 노드를 드레인할 때도 오는 신호는 같다. 먼저 SIGTERM이 오고, 정해진 시간이 지나면 SIGKILL이 온다.`
- 전: `일반형: 생성된 페이지는 가장 넓은 입력이 아니라 가장 좁은 입력만큼만 다르다.` (HalfTheSiteWasACopyOfItself)
- 후: `일반화하면 이렇다. 생성된 페이지는 입력 중 가짓수가 가장 적은 것만큼만 서로 다르다.`
- 전: `Kotlin에서는 sign-in 경로 전체가 이 정도로 짧았다:` (AuthBypassVulnerability)
- 후: `Kotlin의 sign-in 경로는 이게 전부였다.`

### R5. 직역 부사를 지운다: 실제로·정확히·조용히·진짜·바로 그

영어 `actually`, `exactly`, `silently`, `real`, `the very`를 그대로 옮긴 말이다. 한국어판 전체에서 `실제로` 207회, `정확히` 92회, `진짜` 75회, `조용히` 64회, `바로 그` 43회가 나온다. 뜻을 더하지 않으면 지운다. 남길 때는 한국어로 그 뜻을 말한다(`조용히 덮어썼다` → `에러 없이 덮어썼다`).

- 목표: 다섯 단어 합계가 한 편에 5회 이하.
- 전: `체커가 지금껏 아무도 시험해본 적 없는 규모에서, 만들어진 그대로 정확히 동작한 것이다.` (ZeroFindingsEightyBugs)
- 후: `체커는 만든 대로 동작했다. 이 규모로 돌려 본 사람이 없었을 뿐이다.`
- 전: `아예 크래시도 없이, 두 번째 등록이 조용히 첫 번째를 덮어써서 더 나중에 등록된 구독자만 실제로 실행됐을 것이다.` (TheBugThatNeededTwoSubscribersToExist)
- 후: `크래시도 나지 않는다. 두 번째로 등록한 핸들러가 첫 번째를 덮어써서, 나중에 등록한 구독자만 돌았을 것이다.`

### R6. 대명사 주어와 번역 접속 표현

`이는`(31회), `그것은`, `이것은`, `~로 하여금 ~하게`, `~를 통해`, `~에 대해`, `~에 의해`는 대부분 영어 `this`, `it`, `through`, `about`, `by`를 옮긴 자리다. 주어를 생략하거나 앞 문장의 명사를 다시 쓴다.

- 전: `이는 오케스트레이터가 SIGTERM을 보낸 뒤 SIGKILL로 격상하기까지 기다리는 시간이며, SIGKILL은 그 이상의 정리 작업 없이 프로세스를 강제 종료한다.` (GracefulShutdown)
- 후: `오케스트레이터가 SIGTERM을 보내고 SIGKILL을 보내기까지 기다려 주는 시간이다. SIGKILL이 오면 정리할 틈 없이 프로세스가 죽는다.`
- 전: `환경 안의 무언가가 에이전트로 하여금 자신이 일하는 대상에게 불리한 행동을 하게 만들려 할 때 무슨 일이 벌어지는가` (PromptInjectionInToolOutput)
- 후: `작업 환경 안의 무언가가 에이전트를 부추겨, 그 에이전트를 쓰는 사람에게 불리한 일을 시키려 한다면 어떻게 될까.`

### R7. 명령형 `~하라`, `~할 것`

한다체 블로그에서 독자에게 `~하라`라고 하면 교본이나 번역서처럼 들린다.

- 전: `서비스의 p99 요청 처리 시간보다 여유 있게 잡아라` (GracefulShutdown)
- 후: `서비스의 p99 응답 시간보다 넉넉하게 잡으면 된다`
- 전: `데이터셋 바깥에서 이미 뜻을 갖는 값을 고를 것 — 규제선, 표준 규격 구간, … 그리고 그것이 골라내는 대로 받아들일 것.` (HalfTheSiteWasACopyOfItself)
- 후: `데이터 바깥에서 이미 의미가 정해진 값을 고르는 게 좋다. 규제선, 표준 규격 구간, … 같은 것들이다. 그리고 그 값이 골라내는 결과를 그대로 받아들인다.`

### R8. 경구로 끝내기와 "X가 아니라 Y"는 글마다 한두 번

AI 글의 가장 큰 표지다. 문단마다 마지막 문장이 교훈 한 줄(`"체크가 초록이다"는 무엇이 검사됐는지에 대한 주장이다.`)이고, `X가 아니라 Y다`, `X는 버그가 아니다. Y다.` 같은 대비가 반복된다.

- 경구형 마무리는 글 전체에서 1번(보통 마지막 절)만 남긴다. 나머지 문단은 사실로 끝낸다.
- `~가 아니라`는 글마다 2번 이하.
- `핵심은`, `중요한 것은`, `결론적으로`, `흥미로운 건`, `눈여겨볼 점은`으로 문장을 열지 않는다. 그냥 그 내용을 말한다.
- 전: `"체크가 초록이다"는 무엇이 검사됐는지에 대한 주장이다. 무엇이 참인지에 대한 주장이었던 적은 한 번도 없다.` (ZeroFindingsEightyBugs)
- 후: `초록불은 "이걸 검사했다"는 뜻이지 "이게 맞다"는 뜻이 아니다.`
- 전: `이 두 숫자 사이의 간극은 체커의 버그가 아니다. 체커가 지금껏 아무도 시험해본 적 없는 규모에서, 만들어진 그대로 정확히 동작한 것이다.` (ZeroFindingsEightyBugs)
- 후: `체커가 고장 난 건 아니었다. 처음부터 그런 걸 보도록 만들지 않았을 뿐이다.`
- 전: `분량은 진짜였다. 그 페이지 것이 아니었을 뿐이다.` (HalfTheSiteWasACopyOfItself) → 이런 문장은 글에 하나쯤은 괜찮다. 같은 글에 서너 개가 겹칠 때 문제다.

### R9. 소제목은 짧고 한국어답게

`X, 그리고 Y`, `왜 X인가` 같은 영어 제목 틀을 옮기지 않는다.

- 전: `순서, 그리고 왜 순서 자체가 핵심인가` (GracefulShutdown)
- 후: `순서가 전부다` 또는 `왜 순서가 중요한가`
- 전: `프레임워크 설정 한 줄 vs. 시퀀스를 직접 작성하기` (GracefulShutdown)
- 후: `설정 한 줄로 끝나는 경우와 직접 짜야 하는 경우`

### R10. 영어 용어는 개발자가 말하는 대로

- 업계에서 영어로 부르는 개념과 이름은 영어 그대로: Aggregate, Bounded Context, Outbox, readiness probe, SIGTERM, JWT. 매번 괄호로 풀지 않는다. 처음 한 번 짧게 풀어 주는 건 괜찮다.
- 개발자가 말할 때 쓰는 동사는 그대로: 배포하다, 커밋하다, 푸시하다, 머지하다, 모킹하다.
- 사전식 번역어가 오히려 어색하면 실제 쓰는 말로: `착지 페이지` → `랜딩 페이지`, `언어 포트` → `언어별 구현`, `격상하다` → `넘어가다`.
- 영어 단어를 문장 성분으로 그냥 박지 않는다: `redeem은 이벤트 없는 단순 전이` → `사용 처리(redeem)는 이벤트 없이 상태만 바뀐다`, `raw string을 던진 것` → `그냥 문자열을 넘긴 것`.

### R11. 피동·명사화보다 주어와 동사

`되어지다`는 거의 없지만, 영어 수동태를 옮긴 `~이 주어졌다`, `~로 라벨링된`, `~가 드러났다`(15회), 명사를 쌓은 `~에 대한 ~의 ~` 구조는 많다. 누가 무엇을 했는지 주어를 세운다.

- 전: `각 에이전트에게는 자기 언어의 CLAUDE.md 하나만 진입점으로 주어졌다.` (TheBugThatNeededTwoSubscribersToExist)
- 후: `에이전트마다 자기 언어의 CLAUDE.md 하나만 주고 시작했다.`
- 전: `아무도 이게 테스트 스위트가 실제 조립 루트를 단 한 번도 부팅한 적이 없다는 뜻이라는 걸 기억하지 못할 만큼 오래 그 자리에 있던 지름길이었다` (ZeroFindingsEightyBugs)
- 후: `오래된 지름길이었다. 너무 오래돼서, 그 때문에 테스트가 실제 조립 루트를 한 번도 띄운 적이 없다는 걸 아무도 기억하지 못했다.`

### R12. 경험은 1인칭 시점으로

`이 측정을 돌린 사이트에서는`, `이 저장소는`처럼 남의 일처럼 쓴 문장은 내가 겪은 일로 쓴다. 사람이 쓴 글이라는 가장 확실한 표시다. 단, 사실을 바꾸거나 경험을 지어내지 않는다.

- 전: `이 측정을 돌린 사이트에서는 이 단계를 빠뜨렸다가, 존재하지도 않는 표의 가로 폭을 재서 없는 문제를 하나 만들어 낸 적이 있다.` (HalfTheSiteWasACopyOfItself)
- 후: `나도 이 단계를 한 번 빠뜨렸다가, 있지도 않은 표의 가로 폭을 재서 없는 문제를 하나 만든 적이 있다.`
- `이 저장소는`, `this repository's own convention` 같은 자리는 `내 저장소는`으로 바꾼다.
- 반대로 독자 일반을 가리키는 `your own`은 `내`가 아니라 `자기`로 옮긴다. `chatting with your own tabular data`를 `내 정형 데이터와 대화하는`이라고 쓰면 글쓴이의 데이터 얘기가 된다. `자기 정형 데이터를 두고 대화하는`이 맞다.

## 4. 영어판 규칙(짧게)

영어판은 원문이라 한국어판만큼 고칠 필요는 없다. 다음만 손본다. 사실·숫자·문단 구조는 그대로 둔다.

- em dash(—)는 글마다 3~4개까지(지금 47편에 876개, 평균 19개).
- `actually`(166회), `real`(224회), `exactly`(90회), `silently`/`quietly`(66회), `genuinely`(21회)는 뜻을 더하지 않으면 지운다.
- 문단 끝 경구(`X is a claim about what was checked. It was never a claim about what was true.`)는 글마다 1번.
- `Not X. Y.` / `isn't X — it's Y` 대비는 글마다 2번 이하. `Here is …`, `The general form:` 같은 머리말은 문장으로.
- 대시를 콜론으로 바꿀 때 한 문장에 콜론이 둘 생기면 안 된다. `<strong>Translate</strong>: an LLM turns the question into a structured filter: transaction …`은 뒤쪽을 괄호로 묶는다(`… into a structured filter (transaction <code>type</code>, …).`). 목록 머리의 대시는 영어에서 자연스러우니 3~4개 안이면 남겨도 된다.
- 위 네 가지 말고는 고치지 않는다. 어휘를 바꾸다 수량이나 뜻이 바뀌면(`real questions` → `a few questions`) 되돌린다.

## 5. 고친 뒤 점검

아래 명령은 글마다 한 줄씩 출력한다. 다시 쓴 글은 목표 열을 넘지 않아야 한다. 숫자는 신호일 뿐이니, 넘으면 그 자리를 읽고 판단한다. `ids`만 파일 전체(en·ko)를 세고, 나머지는 한국어판(`content.ko`)에서 `<pre><code>` 블록과 인라인 `<code>`를 뺀 본문만 센다.

```sh
cd src/pages/Post
LC_ALL=C perl -CSD -Mutf8 -0777 -ne '
  my ($ko) = /^  ko: \{(.*?)^export default/ms or next;
  $ko =~ s{<pre><code>.*?</code></pre>}{}gs;
  $ko =~ s{<code>.*?</code>}{}gs;
  (my $all = $_) =~ s{href="[^"]*"}{}g;
  sub n { my ($s, $re) = @_; scalar(() = $s =~ /$re/g) }
  printf "%-48s dash=%d adv=%d numko=%d ineun=%d dangsin=%d colon=%d anira=%d round=%d ids=%d\n", $ARGV,
    n($ko, qr/—/),
    n($ko, qr/실제로|정확히|조용히|진짜|바로 그/),
    n($ko, qr/(?<!\p{Hangul})(?:열|스물|서른|마흔|쉰|예순|일흔|여든|아흔)\p{Hangul}* ?(?:장|개|건|줄|명|종)/),
    n($ko, qr/(?:^|[ >.])이는 /m),
    n($ko, qr/당신/),
    n($ko, qr/\p{Hangul}[)"\x{201D}]?:(?=\s|<)/),
    n($ko, qr/아니라/),
    n($ko, qr/라운드|세션/),
    n($all, qr/\b(?=[0-9a-f]*\d)(?=[0-9a-f]*[a-f])[0-9a-f]{7,40}\b|(?<![&\w])#\d{1,4}\b/);
' *.tsx
```

| 열 | 뜻 | 목표 |
|---|---|---|
| `dash` | 대시(R1) | 3 이하 |
| `adv` | 직역 부사(R5) | 5 이하 |
| `numko` | 10 이상 한글 수사(R2) | 0 |
| `ineun` | `이는` 주어(R6) | 0 |
| `dangsin` | `당신` | 0 |
| `colon` | 한글 바로 뒤 콜론(R4) | 0 |
| `anira` | `~가 아니라`(R8) | 2 이하 |
| `round` | `라운드`·`세션`(1절) | 0 |
| `ids` | 커밋 해시·`#123` 번호(1절, en 포함) | 0 |

이 명령을 이렇게 쓴 이유. 고치기 전에 알아 둘 것.

- **`grep`의 `[가-힣]`은 쓰지 않는다.** 이 머신(GNU grep 3.7, `LANG=C.UTF-8`)에서는 `Invalid collation character`로 실패하고, `LC_ALL=C`로 돌리면 오류 없이 바이트 단위로 엉뚱하게 센다. `grep -P '\p{Hangul}'`도 `LC_ALL=C`에서는 0을 낸다. 위의 `perl -CSD -Mutf8`은 로케일과 상관없이 같은 값을 낸다(2026-10-04, C.UTF-8과 C 두 로케일에서 확인).
- **코드 블록은 줄 단위로 거를 수 없다.** `sed`는 한 줄씩 보므로 여러 줄짜리 `<pre><code>`를 못 지우고, 그 안의 대시와 콜론이 본문 수치에 섞인다. 그래서 `-0777`로 파일을 통째로 읽고 `.*?`(최소 일치)로 지운다.
- **`&#123;`는 이슈 번호가 아니다.** JSX 중괄호를 엔티티로 쓴 곳이 있어 `#\d+`만으로는 오탐이 난다. `(?<![&\w])`가 그것을 거른다.
- 시범 2편의 결과(고치기 전 → 후)로 명령을 검증했다. `ZeroFindingsEightyBugs`는 dash 17→0, adv 13→1, colon 7→0, round 4→0. `NarrowWhatNeverWho`는 dash 25→0, colon 6→0, anira 5→1, ids 10→0.

타입 검사(`npx tsc --noEmit -p tsconfig.app.json`), 빌드(`npm run build`), 린트(`npx oxlint --config oxlint.json .`)는 저장소 `CLAUDE.md`의 "Verifying a change before committing" 절을 따른다.

## 6. 다시 쓰기 우선순위

진단 기준: 위 점검 명령의 수치(대시·콜론·대비·한글 수사 밀도, 문장 길이)와 본문 표본 읽기. 2026-10-04 기준.

시범 2편(`ZeroFindingsEightyBugs`, `NarrowWhatNeverWho`)은 2026-10-04 이 지침대로 다시 썼다. 다시 쓰기 전에 그 두 편의 한국어판을 먼저 읽고 말투를 맞추면 된다.

**심함(21편) — 먼저**

SameArchitectureFiveLanguages, NarrowWhatNeverWho(커밋 해시 표 포함), TheBugThatNeededTwoSubscribersToExist, AnEndToEndTestThatWasnt, TypedErrorsAndResponseSchemas, AuthBypassVulnerability, TwoToolsTheSameMissingRoot, RequestScopedUserContext, TwoAccountsOneTransactionFiveDifferentAnswers, TheBugCameBackWearingFiveDifferentMasks, RefundFraudRiskScorer, NotEveryReportNeedsAServer, DomainServicesAcrossAggregates, LlmTechnicalService, FromDocsToRunnableCode, PromptInjectionInToolOutput, RepositoryNamingConvention, TheHarnessHadNeverMetASecondDomain, TheListThatBrokeFiveHarnesses, TheDocSaidDoneHalfOfItWasnt, ZeroFindingsEightyBugs

**보통(23편)**

WhenTheDocsAndTheCodeAgreeToBeWrong, SchedulingAndTaskOutbox, TalkingAcrossBoundedContexts, ComplianceAsCode, CqrsInPractice, ABenchmarkThatCanNeverHit100, TheSameInstantTwoDifferentTimestamps, TheAutomationThatWasWaitingOnItself, TheImageNothingNoticedCouldntBuild, ObservabilityByDesign, FiveBugsNobodyWasLookingFor, APathExistenceCheckerFoundARealBugOnDayOne, GracefulShutdown, CanAnAiAgentFollowYourArchitecture, TheFactoryKnowsWhereToPutIt, BugsOnlyE2eTestsCatch, AggregateDesign, APerfectScoreABrokenFeature, ARuleEvansNeverWrote, TheDefaultsNobodyDeclared, TheFraudSignalThatTrustedTheFraudster, HalfTheSiteWasACopyOfItself, ATiedScoreTwoDifferentKindsOfWrong

**양호(3편) — 가볍게 손보기**

ContainerizedDevelopmentExperience, FindingDomainBoundaries, ReliableEventDrivenSystems. 처음부터 한국어로 쓴 것에 가까운 글이다. 대시와 `~가 아니라` 정도만 줄이고, 이 세 편의 말투를 다른 글의 기준으로 삼는다.

`src/data/posts.ts`의 한국어 문자열(제목·요약·`discrepancy`)은 해당 글을 고치는 사람이 함께 고친다. 여러 작업자가 같은 파일을 동시에 고치게 되므로, 자기 글의 항목만 건드린다.
