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

## 7. 혼자 읽히는 글

1~6절은 문장을 다룬다. 이 절은 글의 틀을 다룬다. 47편 중 대부분이 개인 프로젝트(`backend-service-playbook`, `k8s-playbook`)나 그 안의 도구(하네스, 벤치마크, 생성기)를 이야기의 주어로 쓴다. 프로젝트를 모르는 독자에게는 남의 작업 일지로 읽힌다. `CLAUDE.md`의 "AdSense content guidelines"가 2026-09 반려 원인으로 적은 "좁고 자기 참조적인 아카이브"와 "블로그 글 모양을 한 내부 변경 기록"이 바로 이 냄새다.

방침(소유자 승인, 2026-10-04): 글을 합치거나 내리지 않는다. 주소(`slug`)는 그대로 두고 틀만 바꾼다. 다시 짠 뒤에도 하네스·벤치마크 글끼리 겹치는 부분이 크면, 합칠지는 소유자에게 다시 묻는다.

**영어판도 같은 기준으로 고친다.** 영어판이 사실의 기준이므로(1절), 틀은 영어판을 먼저 바꾸고 한국어판을 거기에 맞춘다. 4절의 "영어판은 네 가지만 고친다"는 문장 수준 규칙이고, 이 절의 틀 바꾸기에는 적용하지 않는다. `src/data/posts.ts`의 그 글 항목(`title`, `summary`, `discrepancy`)도 en·ko 둘 다 같은 기준으로 고친다.

### 7.1 판정 기준

> 프로젝트를 모르는 독자가 **첫 절**만 읽고, 이 글에서 무엇을 얻어 가는지 한 문장으로 말할 수 있나?

첫 절은 제목, `lede`, 첫 `<h2>` 앞 본문까지다. 답이 "어떤 저장소에서 다음에 뭘 할지 고민했다"나 "앞선 실행과 달리 이번엔 모델을 바꿨다"라면 실패다. 답이 "검사 규칙이 본 적 있는 입력에서만 돌아간다는 것과 범용이라는 것은 다르다"처럼 프로젝트 없이 성립하는 질문이나 교훈이면 통과다. 7.7의 표에 글마다 그 한 문장(중심 질문)을 적어 두었다. 다시 짠 글의 첫 절은 그 질문에 답하는 모양이어야 한다.

### 7.2 프로젝트 언급은 본문에서 글당 2회 이하

- **세는 대상.** 프로젝트 이름(`backend-service-playbook`, `k8s-playbook`, `playbook`/`플레이북`), 내 프로젝트를 가리키는 `this repo`·`the repository`·`내 저장소`·`저장소`, 내부 도구 이름(`harness`/`하네스`). 영어판과 한국어판을 따로 센다. 둘 다 2회 이하가 목표다.
- **세지 않는 곳.** `<pre><code>` 블록, 인라인 `<code>`(파일 경로·식별자), 끝의 '더 볼 자료' 상자(7.4). 정정(`Update`, `정정`) 상자는 셈에는 들어가지만 내용은 고치지 않는다(7.6).
- **기계로 못 세는 것도 언급이다.** `five language implementations`/`5개 언어 구현`처럼 프로젝트 구조를 전제로 한 말, 내 벤치마크의 `Level 4`·`run two` 같은 회차 이름, `an earlier post`·`앞서 쓴 글`처럼 다른 글을 읽었다고 가정하는 말. 아래 명령의 `ser` 열은 이 중 다른 글 가정만 센다. 나머지는 읽고 판단한다. `ser`은 0이 목표다. 다른 글이 필요하면 본문에서 기대지 말고 '더 볼 자료' 상자에 링크한다.
- 한국어판의 `저장소`는 일반 명사(“이미지와 저장소 밖에 비밀을 둔다”)일 때도 잡힌다. 숫자는 신호이니 넘으면 그 자리를 읽는다.

```sh
cd src/pages/Post
LC_ALL=C perl -CSD -Mutf8 -0777 -ne '
  my ($en) = /^  en: \{(.*?)^  ko: \{/ms or next;
  my ($ko) = /^  ko: \{(.*?)^export default/ms;
  for ($en, $ko) {
    s{<div className="article-note"><strong>(?:Further reading|더 볼 자료)</strong>.*?</div>}{}gs;
    s{<pre><code>.*?</code></pre>}{}gs;
    s{<code>.*?</code>}{}gs;
  }
  sub n { my ($s, $re) = @_; scalar(() = $s =~ /$re/g) }
  my $pe = qr/backend-service-playbook|k8s-playbook|\b[Pp]laybook\b|\b[Hh]arness(?:es)?\b|\b(?:this|the|my|our) repo(?:sitory)?\b/;
  my $pk = qr/backend-service-playbook|k8s-playbook|플레이북|하네스|저장소/;
  my $se = qr/earlier post|previous post|this series|this blog|posts here/i;
  my $sk = qr/앞선 글|앞서 쓴|이전 글|지난 글|이 시리즈|이 블로그/;
  printf "%-50s proj_en=%d proj_ko=%d ser_en=%d ser_ko=%d\n", $ARGV, n($en,$pe), n($ko,$pk), n($en,$se), n($ko,$sk);
' *.tsx
```

- 5절 명령과 같은 이유로 `perl -CSD -Mutf8`을 쓴다. `C`와 `C.UTF-8` 두 로케일에서 출력이 같다(2026-10-04, 두 출력의 md5sum이 같음을 확인).
- 상자는 7.4의 형식(`Further reading`/`더 볼 자료`)일 때만 빠진다. 아직 옛 제목(`Further reading in the repo`, `저장소에서 더 볼 것` 등)인 상자는 본문으로 세므로, 상자를 고치기 전에는 숫자가 크게 나온다. 2026-10-04 고치기 전 값은 `ComplianceAsCode` en 21·ko 19, `TheHarnessHadNeverMetASecondDomain` en 19·ko 19, `CanAnAiAgentFollowYourArchitecture` en 16·ko 17이 가장 크다.

### 7.3 프로젝트와 내부 도구를 부르는 법

- **프로젝트 이름은 처음 나올 때 한 문장으로 무엇인지 설명한다.** 이름만 던지지 않는다. 본문에 이름이 꼭 필요하지 않으면 이름 대신 그 설명만 쓴다. 그게 더 낫다.
  - `backend-service-playbook` → `같은 백엔드 설계(DDD, CQRS, Outbox)를 5개 언어로 나란히 구현해 둔 내 예제 프로젝트` / `my example project that implements the same backend design in five languages side by side`
  - `k8s-playbook` → `Kubernetes 배포 실수를 유형별로 모으고, 매니페스트에서 그 실수를 찾아내는 검사기를 붙여 둔 내 예제 프로젝트` / `my example project that catalogs common Kubernetes deployment mistakes, each with a checker that finds it in a manifest`
- **내부 도구 이름은 일반 용어로 바꾼다.** 처음 한 번 무엇인지 풀어 쓰고, 그 뒤로는 일반 용어로 부른다. 제목과 `lede`에는 내부 이름을 쓰지 않는다.
  - `하네스` → 처음: `코드가 문서의 아키텍처 규칙을 따르는지 정적으로 검사해 점수를 매기는 스크립트`, 그 뒤: `아키텍처 검사`, `검사 규칙`, `채점기`. 영어는 `an architecture checker`, `the checker`, `the scoring script`.
  - `벤치마크`(내 것) → `같은 과제를 AI 에이전트에게 주고 그 검사로 채점해 본 실험`. 영어는 `an experiment that gives AI agents the same task and scores the result with that checker`.
  - `생성기`/`scaffolding generator` → `도메인 이름 하나로 빈 뼈대 코드를 만들어 주는 스크립트`. 영어는 `a script that generates a skeleton domain from a name`.
  - 파일 이름(`domain-event-outbox.evaluator.ts`)은 `<code>` 안이면 그대로 둔다(1절). 다만 문장의 주어로 세우지 말고 "이벤트 규칙을 검사하는 파일(<code>…</code>)"처럼 무엇인지 먼저 말한다.
- **예제 도메인 이름**(Account, Card, Voucher, Order)은 프로젝트 언급으로 세지 않는다. 처음 나올 때 `예제 도메인 Account(계좌)`처럼 무엇인지만 밝힌다.
- **경험은 계속 1인칭으로 쓴다(R12).** 프로젝트를 지우라는 게 아니다. "이 저장소는"을 "내가 만든 예제 프로젝트에서"로 바꾸고, 이후로는 "그 프로젝트", "내 코드" 대신 주어를 생략하거나 문제 자체를 주어로 세운다.

### 7.4 '더 볼 자료' 상자는 형식 하나로

지금은 상자 제목이 `Further reading in the repo`, `Further reading`, `저장소에서 더 볼 것`, `더 읽을거리`, `저장소에서 더 볼 자료`, `저장소 내 추가 자료` 6가지다. 하나로 맞춘다. 상자는 글 끝에 하나만 둔다.

```tsx
<div className="article-note"><strong>Further reading</strong><p>
  <a href="…" target="_blank" rel="noreferrer">docs/benchmark.md</a> (the full task and results, in my example project that implements the same backend design in five languages) · <a href="/posts/…">Title of the other post</a> (what it adds)
</p></div>
```

```tsx
<div className="article-note"><strong>더 볼 자료</strong><p>
  <a href="…" target="_blank" rel="noreferrer">docs/benchmark.md</a>(같은 백엔드 설계를 5개 언어로 구현해 둔 내 예제 프로젝트의 과제와 결과 전체) · <a href="/posts/…">다른 글 제목</a>(이 글에 무엇을 더하는지)
</p></div>
```

- 제목은 en `Further reading`, ko `더 볼 자료`. 정확히 이 글자여야 7.2 명령이 상자를 뺀다.
- 링크마다 괄호 설명 하나. 설명은 독자에게 무엇이 있는지를 말한다("이번 실행이 가져다 쓴 방법론"보다 "같은 채점 방식을 처음 설명한 글"). 영어판 설명은 대시 대신 괄호로 쓴다(4절 대시 상한).
- 프로젝트 이름은 상자 안에서 처음 나올 때 7.3의 한 문장 설명을 붙인다. 상자 안은 셈에서 빠지므로 여기서 이름을 써도 된다.
- 링크 사이는 ` · `. `href`는 그대로 둔다(1절). 링크 문구는 바꿔도 된다. 다른 글 제목을 인용한 문구라도 상대 글 파일은 열지 않는다.

### 7.5 종류별 다시 짜기

| 종류 | 무엇 | 바꾸는 곳 |
|---|---|---|
| 1종 | 일반 기술 글. 본문은 이미 주제 중심이다 | 끝 상자를 7.4로. 본문에 남은 자기 언급·다른 글 가정이 2회를 넘으면 그 문장만 고친다 |
| 2종 | 사건 이야기. 무슨 일이 있었는지는 남길 만한데 첫 절이 프로젝트 사정으로 시작한다 | 제목·`lede`·첫 절을 일반 문제로. 프로젝트는 맥락으로 한 번(7.3). 내부 도구 이름은 일반 용어로. 끝 상자 7.4. 절 순서와 사건의 흐름은 둔다 |
| 3종 | 프로젝트 기록에 가까운 글. 글의 뼈대가 내 작업 순서(다음에 뭘 할지, 회차, 레벨)다 | 7.7 표의 중심 질문 하나를 첫 절에 세우고, 절마다 그 질문의 한 측면을 답하게 다시 짠다. 프로젝트 사건은 그 답의 사례로만. 절 제목을 바꿔도 되고, 절 안 문단 순서를 바꿔도 된다 |

**3종은 1절의 "JSX 구조 유지"를 일부 풀어 준다.** `<h2>` 문구와 절 안 문단 순서는 바꿔도 된다. 절 개수, 표, 코드 블록, `article-note` 개수는 그대로 둔다. 2종은 `<h2>` 문구만 바꿀 수 있다. 1종은 1절 그대로다.

**3종 예 — `TheHarnessHadNeverMetASecondDomain` 첫 절**

- 전(ko): `저장소를 다음에 어디로 끌고 갈지 고민하던 참이었다. 새 프로젝트용 스캐폴딩 템플릿을 만들 수도 있었고, 하네스를 독립 도구로 떼어 낼 수도 있었다. … 이 전제를 직접 확인해 본 적은 한 번도 없었다. 그래서 그것부터 했다.`
- 후(ko): `검사 규칙이 지금까지 받아 본 입력에서 문제를 못 찾았다고 해서 범용이라는 뜻은 아니다. 그 입력에서만 돌아간다는 게 증명됐을 뿐이다. 내 예제 프로젝트의 아키텍처 검사 규칙 두 개가 몇 달째 깨끗했는데, 그동안 받아 본 도메인은 늘 같은 두 개였다. 둘과 상관없는 세 번째 도메인을 하나 만들어 돌려 보자 거짓 양성 2개가 나왔다.`
- 후(en): `A lint rule that has only ever passed on the inputs it was written against hasn't been shown to be generic. It has only been shown to work on those inputs. Two architecture rules in my example project had checked out clean for months, and every domain they had ever seen was one of the same two. Building a third, unrelated domain and running the rules against it surfaced two false positives.`
- 바뀐 것: 작업 계획 이야기(스캐폴딩, 독립 도구, 벤치마크)를 지우고 질문을 앞에 세웠다. 숫자(규칙 2개, 도메인 2개, 거짓 양성 2개)는 그대로다. 제목도 `The Harness Had Never Met a Second Domain`에서 내부 이름을 빼고 질문 쪽으로 바꾼다(예: `A Rule That Has Only Seen Two Inputs`). `slug`는 그대로다.

**2종 예 — `AuthBypassVulnerability` 첫 절**

- 전(ko): `… 인증을 통째로 건너뛸 수 있는 구멍이었고, 내 저장소의 5개 언어 구현에 똑같이 있었다. 처음 구현에 있던 구멍을 다른 언어로 옮기면서 그대로 가져갔기 때문이다.`
- 후(ko): `… 인증을 통째로 건너뛸 수 있는 구멍이었다. 같은 백엔드 설계를 5개 언어로 나란히 구현해 둔 내 예제 프로젝트에서, 이 구멍은 5개 구현 모두에 있었다. 처음 구현을 다른 언어로 옮길 때 구멍도 같이 옮겨 갔다.`
- 바뀐 것: `내 저장소`가 무엇인지 한 문장으로 밝혔다. 이 글에서 프로젝트 맥락은 여기 한 번이면 된다. 뒤의 `5개 언어 모두`는 이제 무엇을 가리키는지 알 수 있으니 둔다.

**3종 예 — `APerfectScoreABrokenFeature` 첫 문단**

- 전(en): `Every benchmark run described in an earlier post held the model constant and varied the language or the task's difficulty. This run inverted that: … It was the first time this repo ran the "comparing across models" idea it had only speculated about before.`
- 후(en): `When an AI agent reports that its work passes every check, what has actually been verified? I gave two models the same task, the same instructions, and the same automated architecture checker, in separate copies of the code so neither could see the other's work. Both reported a perfect score. Only one of them produced a feature that worked.`
- 바뀐 것: `earlier post`, `this repo`를 지우고 독자가 가져갈 질문을 첫 문장으로 세웠다. "모델만 바꿨다"는 사실은 둘째 문장에 남았다.

**1종 예 — 상자 제목**

- 전: `<strong>저장소에서 더 볼 것</strong>` … `docs/benchmark.md(이번 실행 전체와 이 시리즈의 다른 벤치마크 실행 기록)`
- 후: `<strong>더 볼 자료</strong>` … `docs/benchmark.md(같은 백엔드 설계를 5개 언어로 구현해 둔 내 예제 프로젝트에서, 같은 과제를 여러 번 돌린 결과 전체)`

### 7.6 건드리지 말 것(이 절에서도)

1절이 그대로 적용된다. 틀을 바꾸다 특히 넘기 쉬운 선만 다시 적는다.

- **사실과 숫자.** 다시 짜는 건 순서와 강조다. 사건, 숫자, 결과, 원인을 더하거나 빼지 않는다. 3종이라도 영어판에 없던 주장이나 일반론을 지어 넣지 않는다. 중심 질문은 그 글에 이미 있는 결론을 앞으로 끌어온 것이어야 한다.
- **코드.** 코드 블록, `const ..._SNIPPET`, `<code>` 안은 한 글자도 바꾸지 않는다. 클래스 이름(`RefundReasonClassifier`)이 프로젝트 고유라도 코드면 둔다.
- **링크 대상.** `href`는 그대로. 문구만 바꾼다.
- **주소와 메타.** `slug`, 파일명, 컴포넌트 이름, `date`, `tags`, `kicker`, `readMinutes`. 제목(`title`)은 바꿔도 되지만 `slug`는 옛 제목 그대로 둔다.
- **정정 상자**(`Update — 2026.07.26`, `정정(2026.07.26)`). 날짜와 내용은 그대로 둔다. 독자에게 글의 내용이 지금 코드와 다르다고 알리는 정직한 표시라서, 내부 기록처럼 보여도 지우지 않는다.
- **AdSense 규칙.** PR·이슈 번호, 커밋 해시, 라운드·세션 횟수는 여전히 넣지 않는다(5절 `ids`, `round` 열 0).

### 7.7 분류와 중심 질문(2026-10-04 확정)

분류 방법: 47편의 영어판 제목·`lede`·첫 절과 절 제목을 모두 읽고, 3종 후보와 경계에 있는 글(`RefundFraudRiskScorer`, `BugsOnlyE2eTestsCatch`, `TheDocSaidDoneHalfOfItWasnt`, `RepositoryNamingConvention`, `ATiedScoreTwoDifferentKindsOfWrong` 등)은 본문 전체를 읽었다. 7.2 명령 값(상자 빼고 센 값)은 참고만 했다.

결과: 1종 21편, 2종 19편, 3종 7편.

| 파일 | 종류 | 중심 질문(프로젝트를 모르는 독자가 얻어 갈 것) |
|---|---|---|
| ComplianceAsCode | 3 | 아키텍처 문서를 기계가 검사하게 만들면 무엇을 잡고 무엇을 계속 놓치나(배치는 잡지만 이름·문서와 함께 틀린 코드·언어 간 불일치는 놓친다) |
| TheDocSaidDoneHalfOfItWasnt | 3 | 수동 감사에서 나온 것을 검사 규칙으로 바꿔 나갈 때, 언제 멈추면 되나(새 규칙이 찾는 건수의 수확 곡선이 평평해질 때) |
| TheHarnessHadNeverMetASecondDomain | 3 | 본 적 있는 입력에서만 깨끗한 검사 규칙이 범용인지 어떻게 확인하나(상관없는 입력을 일부러 만들어 돌린다) |
| FromDocsToRunnableCode | 3 | 코드 생성기는 규칙의 두 번째 구현이다. 규칙이 바뀔 때 생성기도 같이 낡지 않게 하려면 무엇을 해야 하나 |
| CanAnAiAgentFollowYourArchitecture | 3 | AI 에이전트가 팀의 문서화된 설계 규칙을 스스로 찾아 따르는지 어떻게 재나(과제는 성기게, 채점은 사람이 다시, 난이도는 결정 하나씩) |
| APerfectScoreABrokenFeature | 3 | 에이전트가 "검사를 모두 통과했다"고 보고할 때 실제로 확인된 건 무엇인가(구조 점수와 동작은 다르고, 자체 보고는 다시 돌려 봐야 한다) |
| RefundFraudRiskScorer | 3 | 학습 데이터가 없을 때 ML 점수를 규칙 기반 판정 옆에 어떻게 붙이나(인터페이스 뒤에 두고, 설정으로 바꾸고, 실패하면 열어 두고, 결정은 도메인 규칙이 한다) |
| AuthBypassVulnerability | 2 | 같은 설계를 여러 언어로 옮기면 처음 구현의 보안 구멍도 같이 옮겨 간다. 비밀번호 없는 로그인이 언어마다 어떤 모양이었고 무엇으로 막나 |
| AnEndToEndTestThatWasnt | 2 | E2E 테스트가 실제 앱 조립 루트를 띄우지 않으면 무엇을 놓치나(모듈 손조립·외부 호출 대체 경로만 시험하기) |
| APathExistenceCheckerFoundARealBugOnDayOne | 2 | 문서 속 경로가 실제로 있는지만 보는 싸고 멍청한 검사도 값을 하나(오탐을 줄이는 예외 설계가 검사보다 중요하다) |
| ABenchmarkThatCanNeverHit100 | 2 | 산출물만 보고는 영원히 잴 수 없는 항목이 있을 때, TODO로 두지 말고 "측정 불가"로 못 박아야 하는 이유 |
| ATiedScoreTwoDifferentKindsOfWrong | 2 | 점수가 같아도 결함은 다르다. "있는지"만 보는 검사가 놓치는 Kubernetes 실수(빈 namespaceSelector, 없는 Warehouse 참조) |
| FiveBugsNobodyWasLookingFor | 2 | 문서 주석을 고친 뒤 앱을 띄워 오류 경로를 실제로 불러 보는 검증이 엉뚱한 버그까지 찾는 이유 |
| LlmTechnicalService | 2 | LLM을 도메인 로직에 붙일 때 판정권을 주지 않고 신호로만 쓰는 구조(Technical Service와 Domain Service 분리) |
| NarrowWhatNeverWho | 2 | 자연어 질의에서 LLM이 만든 필터가 "무엇을"만 좁히고 "누구의 것인지"는 절대 정하지 못하게 하는 법 |
| TheFraudSignalThatTrustedTheFraudster | 2 | 판정 대상이 직접 써 넣는 값은 그 대상을 잡는 신호가 될 수 없다(채널 문제) |
| RepositoryNamingConvention | 2 | Repository 메서드 이름을 세 가지로 묶는 규칙과, 문서로만 있는 규칙이 여러 구현에서 흘러내리는 이유 |
| TheAutomationThatWasWaitingOnItself | 2 | 자동 머지 워크플로가 자기 자신이 끝나야 끝나는 체크를 기다리면 어떻게 되나(우연한 경쟁 조건이 성공처럼 보였다) |
| TheBugCameBackWearingFiveDifferentMasks | 2 | 이벤트 하나에 구독자가 처음 둘 이상 붙는 순간 드러나는 버그가 언어마다 얼마나 다른 모양으로 나타나나(시끄러운 것부터 조용한 것까지) |
| TheBugThatNeededTwoSubscribersToExist | 2 | 모두가 만점인 테스트는 왜 아무것도 알려 주지 않나(천장 효과), 난이도를 결정 하나씩 올려야 경계가 보인다 |
| TheImageNothingNoticedCouldntBuild | 2 | 모든 체크가 초록인데 배포 이미지가 안 만들어진 이유. CI가 의미가 바뀐 바로 그 파일을 안 보고 있었다 |
| TheListThatBrokeFiveHarnesses | 2 | `kubectl get -o yaml`의 List 출력처럼 입력 모양 가정이 깨지면, "리소스 없음"이 통과로 읽히는 위험 |
| TheSameInstantTwoDifferentTimestamps | 2 | 시간대 없는 TIMESTAMP 열에 드라이버가 프로세스 시간대로 직렬화한 값을 넣으면 생기는 일과, 언어마다 고칠 곳이 다른 이유 |
| TwoAccountsOneTransactionFiveDifferentAnswers | 2 | 두 Aggregate를 한 트랜잭션으로 쓰는 메커니즘이 프레임워크마다 어떻게 다르고, 어디서 조용히 깨지나 |
| WhenTheDocsAndTheCodeAgreeToBeWrong | 2 | 문서와 코드가 서로 맞는지만 보는 감사는 둘이 함께 틀린 경우를 왜 원리상 못 잡나 |
| ZeroFindingsEightyBugs | 2 | 검사 결과 0건이 "문제 없음"이 아닌 이유. 검사가 보도록 만들어지지 않은 곳에 80건이 있었다 |
| ARuleEvansNeverWrote | 1 | "다른 Aggregate는 ID로만 참조한다"는 규칙은 Evans 원전에 없다. 어디서 왔고 왜 이겼나 |
| AggregateDesign | 1 | Aggregate 경계를 트랜잭션과 불변식 기준으로 정하는 법 |
| BugsOnlyE2eTestsCatch | 1 | 목(mock)이 구조상 재현할 수 없는 실패(세션 수명, HTTP 클라이언트 상태, 열 길이, 중복 제거 창)는 무엇이 있나 |
| ContainerizedDevelopmentExperience | 1 | 컨테이너 개발 환경을 새로 온 사람도 바로 돌릴 수 있게 설계하는 다섯 가지 |
| CqrsInPractice | 1 | Query 쪽이 왜 Repository를 쓰면 안 되나, 그리고 그 경계가 계속 무너지는 이유 |
| DomainServicesAcrossAggregates | 1 | 한 Aggregate에 속하지 않는 규칙을 Domain Service로 두는 기준 |
| FindingDomainBoundaries | 1 | 도메인 경계를 명사 분류가 아니라 함께 바뀌는 것과 불변식의 주인으로 찾는 법 |
| GracefulShutdown | 1 | SIGTERM부터 SIGKILL까지 무엇을 어떤 순서로 해야 배포 중 요청이 안 떨어지나 |
| HalfTheSiteWasACopyOfItself | 1 | 분량 검사를 다 통과한 사이트에서 중복을 재는 법(shingle)과 중복이 생기는 세 가지 모양 |
| NotEveryReportNeedsAServer | 1 | "클라이언트가 기존 조회 API로 직접 만들 수 없나?" 질문 하나로 서버 기능 요청을 거르는 법 |
| ObservabilityByDesign | 1 | 로그 레벨·층별 책임·상관 ID를 설계 단계에서 정해야 하는 이유 |
| PromptInjectionInToolOutput | 1 | 도구 출력에 시스템 메시지처럼 생긴 지시가 섞여 들어오면 에이전트는 어떻게 해야 하나(무시하고 알린다) |
| ReliableEventDrivenSystems | 1 | 유실·중복·순서 뒤바뀜을 전제로 이벤트 기반 시스템을 설계하는 법 |
| RequestScopedUserContext | 1 | `req.user`를 비즈니스 로직까지 끌고 가면 왜 안 되나, 요청 범위 컨텍스트로 나누는 법 |
| SameArchitectureFiveLanguages | 1 | 같은 Repository/Query 분리를 5개 언어로 구현하면 무엇이 문법이고 무엇이 설계인지 보인다 |
| SchedulingAndTaskOutbox | 1 | 인스턴스가 둘이 되면 Cron 작업이 왜 깨지나, Scheduler는 큐에 넣기만 하는 구조 |
| TalkingAcrossBoundedContexts | 1 | Bounded Context끼리 동기(Adapter)와 비동기(Integration Event) 중 무엇으로 말할지 정하는 네 가지 질문 |
| TheDefaultsNobodyDeclared | 1 | Git과 클러스터 상태를 비교하는 drift 검사가 클러스터가 채운 기본값을 drift로 오인하는 문제 |
| TheFactoryKnowsWhereToPutIt | 1 | Aggregate ID는 어디서 만들어야 하나. 원전의 답과 그 답이 바뀐 이유 |
| TwoToolsTheSameMissingRoot | 1 | Argo CD와 Flux가 의존 트리를 반대 방향으로 표현해도 감사할 때 같은 실수가 나는 이유 |
| TypedErrorsAndResponseSchemas | 1 | 오류 메시지를 enum 키로, 코드를 별도 축으로, 응답 모양을 하나로 두는 이유 |

1종이라도 상자를 뺀 값이 2회에 닿거나 기계로 못 세는 언급이 남은 글이 있다(`ContainerizedDevelopmentExperience` ko 3회, `RequestScopedUserContext`·`CqrsInPractice`의 "겪은 버그" 절, `SchedulingAndTaskOutbox`의 "Real Bugs" 절, `BugsOnlyE2eTestsCatch`의 `five language ports`·벤치마크 문단, `PromptInjectionInToolOutput`·`TalkingAcrossBoundedContexts`의 다른 글 가정). 그 문장만 7.3대로 고친다. 절을 다시 짜지는 않는다.

**작업자 묶음 제안**

같은 묶음 안의 글은 서로 겹치는 사건을 다룬다. 한 사람이 같이 맡아야 글마다 다른 중심 질문을 지키고 같은 사건을 두 글이 같은 무게로 반복하지 않게 할 수 있다.

| 묶음 | 종류 | 글 |
|---|---|---|
| A | 3종 | ComplianceAsCode, TheDocSaidDoneHalfOfItWasnt (같은 이름 규칙·인증 도메인 3건 사건을 공유. 앞은 "검사가 놓치는 것", 뒤는 "언제 멈추나"로 갈라 쓴다) |
| B | 3종 | TheHarnessHadNeverMetASecondDomain, FromDocsToRunnableCode (둘 다 검사·생성기가 자기가 본 입력에만 맞춰진 문제) |
| C | 3종 | CanAnAiAgentFollowYourArchitecture, APerfectScoreABrokenFeature (같은 AI 채점 실험. 앞이 방법, 뒤가 자체 보고 문제) |
| D | 3종 | RefundFraudRiskScorer |
| E | 2종 | RepositoryNamingConvention, WhenTheDocsAndTheCodeAgreeToBeWrong, ZeroFindingsEightyBugs, APathExistenceCheckerFoundARealBugOnDayOne (문서·코드 감사. 묶음 A가 끝난 뒤가 낫다) |
| F | 2종 | ATiedScoreTwoDifferentKindsOfWrong, ABenchmarkThatCanNeverHit100, TheListThatBrokeFiveHarnesses (Kubernetes 검사기) |
| G | 2종 | TheBugThatNeededTwoSubscribersToExist, TheBugCameBackWearingFiveDifferentMasks, TwoAccountsOneTransactionFiveDifferentAnswers, TheSameInstantTwoDifferentTimestamps (5개 언어에 걸친 버그. 앞 두 편은 같은 뿌리 원인) |
| H | 2종 | AuthBypassVulnerability, AnEndToEndTestThatWasnt, FiveBugsNobodyWasLookingFor, TheImageNothingNoticedCouldntBuild, TheAutomationThatWasWaitingOnItself (검증이 찾은 버그) |
| I | 2종 | LlmTechnicalService, TheFraudSignalThatTrustedTheFraudster, NarrowWhatNeverWho (LLM 판정권. 묶음 D와 같은 사건이라 D 다음에) |
| J | 1종 | 1종 21편 전부 |

순서는 `#19`의 진행대로 3종(A~D) → 2종(E~I) → 1종(J)이다. `posts.ts`는 여러 묶음이 같이 고치니 자기 글 항목만 건드린다(6절 끝과 같다).
