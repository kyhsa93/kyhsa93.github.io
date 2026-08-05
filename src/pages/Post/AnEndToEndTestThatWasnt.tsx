import PostLayout from '../../components/PostLayout';
import { useLocale } from '../../lib/locale';
import type { MetaFunction } from 'react-router';
import { createPostMeta } from '../../lib/seo';

export const meta: MetaFunction = () => createPostMeta('an-end-to-end-test-that-wasnt');

const content = {
  en: {
    kicker: 'Testing · Reliability',
    title: (
      <>
        An End-to-End Test<br /><em>That Wasn't</em>
      </>
    ),
    lede: 'Every NestJS end-to-end spec, for months, assembled its own hand-picked module instead of the real application — and every language\'s LLM-backed feature had only ever been tested through its own no-Ollama fallback path, never the request it was actually supposed to send. Both were called end-to-end. Neither one was, in the way that mattered.',
    body: (
      <>
        <p>Real HTTP requests, real Postgres and LocalStack in testcontainers, real assertions on real response bodies — by every surface measure, the NestJS suite was doing exactly what an end-to-end test is supposed to do. What it never did was boot the actual application. Each spec built its own <code>Test.createTestingModule</code>, with its own hand-picked entity list and its own <code>synchronize: true</code> to build the schema on the fly — a parallel approximation of the real <code>AppModule</code>, close enough to pass, never actually the thing that runs in production. Close enough turned out to matter: it's exactly the gap that let a real entity-registration omission ship while every test stayed green.</p>
        <h2>Booting the Real Thing, and the One Ordering Trick That Makes It Possible</h2>
        <p>The fix sounds simple and has one real subtlety in it. Each spec now starts its containers, sets every environment variable the real app needs, and only then does <code>await import('@/app-module')</code> — dynamically, not as a static import at the top of the file. Jest gives each spec file its own module registry, and the app's data-source module reads <code>DATABASE_URL</code> at import time, not at call time — so importing statically, before the containers exist, would freeze in the wrong values permanently for that file. The dynamic import, ordered after the environment is real, is what lets the actual composition root see the actual values. Schema creation moved from TypeORM's <code>synchronize: true</code> to <code>migrationsRun: true</code> — the real migrations build the real schema, the same ones a real deployment runs, not a live reflection of whatever the entity classes currently look like. And the bootstrap logic itself — pipes, filters, interceptors — moved out of <code>main.ts</code> into a shared <code>configureApp()</code> that both <code>main.ts</code> and every spec call, so there's exactly one bootstrap sequence in the codebase instead of one real one and seven approximations of it.</p>
        <h2>Two Libraries Fighting Over the Same Module</h2>
        <p>Mocking the one remaining external dependency — the LLM calls — introduced a genuinely strange failure. Importing <code>nock</code> patches Node's global <code>http</code> module the instant the import runs, and testcontainers drives the Docker daemon over that same module while probing which container runtime is actually available. On a warm local Docker daemon the race resolved fine every time. On CI's cold start, it didn't — containers failed with a plain <code>EPIPE</code>, no useful message pointing at why.</p>
        <p>The fix is an explicit ordering discipline: leave <code>nock</code> deliberately inactive — <code>nock.restore()</code> — until the containers and the app are both fully up, activate it only then for the LLM stubs, and deactivate it again before teardown begins. A background consumer that fires a stray LLM call during shutdown just DNS-fails cleanly into its own fallback path instead of corrupting whatever the next spec file tries to do with the Docker socket.</p>
        <h2>The Second Half: Stop Faking the Part That Was Never Actually Tested</h2>
        <p>A separate but related gap ran across all five languages, not just NestJS: every LLM-backed feature — answering a question about transaction history, categorizing a transaction by merchant name, classifying a refund reason — had only ever been end-to-end tested through its own no-Ollama fallback. Nothing simulated the model, so the actual request-and-parse path had never run in any test, in any language, for any of these features.</p>
        <p>The shape of the fix was identical everywhere, even though the tool differed by language: a fake server answering exactly one endpoint, <code>POST /api/chat</code>, routing purely by content — the system prompt in the request identifies which service is calling, and something recognizable in the user message picks a deterministic reply, a specific merchant name mapping to a specific category and so on. A marker string anywhere in the request forces a 500, for the handful of tests that specifically want to prove the fallback path still works when the model is unavailable. An unrecognized prompt gets a loud failure rather than a silent default, so a future LLM feature can't quietly coast on the fallback forever without anyone noticing its real path was never exercised. Go used a plain <code>httptest.Server</code>, FastAPI used <code>respx</code>, Kotlin and Java used the JDK's own built-in HTTP server rather than adding a dependency, and NestJS reused the same <code>nock</code> now wired correctly into the real-app suite.</p>
        <p>Two separate investigations, the same session, converging on one realization: a test suite's coverage isn't measured by what it exercises when everything is stubbed to go right. It's measured by whether "end-to-end" means the end that actually matters — the real composition root an app boots from, the real request a feature actually sends — rather than a stand-in built, reasonably enough at the time, to make the suite pass a little faster.</p>
        <div className="article-note"><strong>Further reading in the repo</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/implementations/nestjs/examples/test/support/test-app.ts" target="_blank" rel="noreferrer">test/support/test-app.ts</a> — the real-AppModule bootstrap every spec now shares · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/implementations/go/examples/test/fake_ollama_test.go" target="_blank" rel="noreferrer">fake_ollama_test.go</a> — one language's version of the fake model server
        </p></div>
      </>
    ),
  },
  ko: {
    kicker: 'Testing · Reliability',
    title: (
      <>
        End-to-End이 아니었던<br /><em>End-to-End 테스트</em>
      </>
    ),
    lede: 'nestjs의 모든 e2e 스펙은, 몇 달 동안, 실제 애플리케이션 대신 자기만 손으로 고른 모듈을 조립하고 있었다 — 그리고 모든 언어의 LLM 기반 기능은 실제로 보내야 할 요청이 아니라 자기 자신의 no-Ollama 폴백 경로로만 테스트돼왔다. 둘 다 end-to-end라 불렸다. 정작 중요한 지점에서는 둘 다 그게 아니었다.',
    body: (
      <>
        <p>실제 HTTP 요청, testcontainers의 실제 Postgres와 LocalStack, 실제 응답 본문에 대한 실제 단언 — 표면적으로 보면 nestjs 스위트는 정확히 e2e 테스트가 해야 할 일을 하고 있었다. 한 번도 하지 않았던 건 실제 애플리케이션을 부팅하는 것이었다. 각 스펙은 자기만의 <code>Test.createTestingModule</code>을, 손으로 고른 엔티티 목록과 즉석에서 스키마를 만드는 <code>synchronize: true</code>와 함께 조립했다 — 실제 <code>AppModule</code>의 병렬적 근사치, 통과할 만큼은 가깝지만 프로덕션에서 실제로 돌아가는 그것은 결코 아니었다. "충분히 가까움"이 결국 문제가 됐다: 바로 이 간극이 실제 엔티티 등록 누락이 모든 테스트가 초록인 채로 배포될 수 있게 만든 지점이었다.</p>
        <h2>실물을 부팅하기, 그리고 그걸 가능하게 만드는 순서 트릭 하나</h2>
        <p>수정은 단순해 보이고 실제로는 진짜 미묘한 부분이 하나 있다. 각 스펙은 이제 컨테이너를 먼저 기동하고, 실제 앱이 필요로 하는 모든 환경 변수를 설정한 뒤에야 — 파일 맨 위의 정적 임포트가 아니라 — <code>await import('@/app-module')</code>을 동적으로 실행한다. Jest는 스펙 파일마다 자기만의 모듈 레지스트리를 부여하고, 앱의 데이터소스 모듈은 호출 시점이 아니라 임포트 시점에 <code>DATABASE_URL</code>을 읽는다 — 그래서 컨테이너가 존재하기도 전에 정적으로 임포트했다면 그 파일에는 잘못된 값이 영구히 고정됐을 것이다. 환경이 실제로 준비된 뒤에 순서를 맞춘 동적 임포트가, 진짜 조립 루트가 진짜 값을 보게 만드는 방법이다. 스키마 생성은 TypeORM의 <code>synchronize: true</code>에서 <code>migrationsRun: true</code>로 옮겨갔다 — 엔티티 클래스가 지금 어떤 모양인지를 실시간 반영하는 게 아니라, 실제 배포가 돌리는 것과 같은 진짜 마이그레이션이 진짜 스키마를 만든다. 그리고 부트스트랩 로직 자체 — 파이프, 필터, 인터셉터 — 는 <code>main.ts</code> 밖으로 나와 공유되는 <code>configureApp()</code>이 됐고, 이제 <code>main.ts</code>와 모든 스펙이 그걸 그대로 호출한다 — 코드베이스에 진짜 하나와 그것의 근사치 일곱 개가 있는 게 아니라, 부트스트랩 시퀀스가 정확히 하나만 존재한다.</p>
        <h2>같은 모듈을 두고 싸우는 두 라이브러리</h2>
        <p>남은 유일한 외부 의존성 — LLM 호출 — 을 모킹하는 과정에서 진짜 이상한 실패가 하나 나왔다. <code>nock</code>을 임포트하면 그 즉시 Node의 전역 <code>http</code> 모듈이 패치되는데, testcontainers는 어떤 컨테이너 런타임을 실제로 쓸 수 있는지 탐색하면서 바로 그 같은 모듈로 Docker 데몬과 통신한다. 따뜻한 로컬 Docker 데몬에서는 이 경쟁이 매번 무사히 풀렸다. CI의 콜드 스타트에서는 아니었다 — 컨테이너가 그냥 <code>EPIPE</code>로 실패했고, 왜인지 가리키는 유용한 메시지는 하나도 없었다.</p>
        <p>수정은 명시적인 순서 규율이다: 컨테이너와 앱이 완전히 뜰 때까지 <code>nock</code>을 의도적으로 비활성 상태 — <code>nock.restore()</code> — 로 두고, 그때가 돼서야 LLM 스텁을 위해 활성화하고, teardown이 시작되기 전에 다시 비활성화한다. 종료 도중 배경 소비자가 우연히 LLM 호출을 쏘더라도, 그냥 DNS 실패로 깔끔하게 자기 폴백 경로로 빠질 뿐, 다음 스펙 파일이 Docker 소켓을 상대로 하려는 일을 망가뜨리지 않는다.</p>
        <h2>후반부: 한 번도 실제로 테스트된 적 없던 부분 그만 가짜로 대체하기</h2>
        <p>nestjs만이 아니라 5개 언어 전체에 걸친, 별개지만 관련된 갭이 하나 더 있었다: 거래 내역에 대한 질문에 답하기, 가맹점명으로 거래 분류하기, 환불 사유 분류하기 같은 모든 LLM 기반 기능이 자기 자신의 no-Ollama 폴백 경로로만 e2e 테스트돼왔다. 모델을 시뮬레이션하는 게 아무것도 없어서, 실제 요청-파싱 경로는 이 기능들 중 어느 것도, 어느 언어에서도, 어떤 테스트에서도 한 번도 실행된 적이 없었다.</p>
        <p>도구는 언어마다 달랐지만 수정의 모양은 어디서나 똑같았다: 정확히 엔드포인트 하나 <code>POST /api/chat</code>에 답하는 가짜 서버, 순전히 내용으로 라우팅 — 요청 속 system prompt가 어느 서비스가 호출하고 있는지 식별하고, user message 안의 알아볼 수 있는 무언가가 결정적인 응답을 고른다, 특정 가맹점명이 특정 카테고리로 매핑되는 식으로. 요청 어딘가의 마커 문자열은 강제로 500을 만든다 — 모델을 쓸 수 없을 때 폴백 경로가 여전히 동작한다는 걸 특별히 증명하고 싶은 소수의 테스트를 위해. 인식되지 않은 프롬프트는 조용한 기본값이 아니라 시끄러운 실패를 받는다 — 미래의 어떤 LLM 기능이 실제 경로가 한 번도 실행된 적 없다는 걸 아무도 눈치채지 못한 채 폴백에 조용히 무임승차하지 못하도록. go는 그냥 <code>httptest.Server</code>를, fastapi는 <code>respx</code>를, kotlin과 java는 의존성을 추가하는 대신 JDK 내장 HTTP 서버를, nestjs는 이제 실제 앱 스위트에 올바르게 배선된 같은 <code>nock</code>을 재사용했다.</p>
        <p>같은 세션 안의 별개인 두 조사가 하나의 깨달음으로 수렴했다: 테스트 스위트의 커버리지는 모든 게 잘 돌아가도록 스텁된 상태에서 무엇을 실행하는지로 측정되지 않는다. "end-to-end"가 정말로 중요한 끝 — 앱이 실제로 부팅하는 진짜 조립 루트, 기능이 실제로 보내는 진짜 요청 — 을 뜻하는지로 측정된다. 당시엔 충분히 합리적인 이유로 만들어졌을, 스위트를 조금 더 빨리 통과시키기 위한 대역이 아니라.</p>
        <div className="article-note"><strong>저장소 내 추가 자료</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/implementations/nestjs/examples/test/support/test-app.ts" target="_blank" rel="noreferrer">test/support/test-app.ts</a> — 이제 모든 스펙이 공유하는 실제 AppModule 부트스트랩 · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/implementations/go/examples/test/fake_ollama_test.go" target="_blank" rel="noreferrer">fake_ollama_test.go</a> — 가짜 모델 서버의 한 언어 버전
        </p></div>
      </>
    ),
  },
};

export default function AnEndToEndTestThatWasnt() {
  const { locale } = useLocale();
  const c = content[locale];

  return (
    <PostLayout
      slug="an-end-to-end-test-that-wasnt"
      kicker={c.kicker}
      title={c.title}
      lede={c.lede}
    >
      {c.body}
    </PostLayout>
  );
}
