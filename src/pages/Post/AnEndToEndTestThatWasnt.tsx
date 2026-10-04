import PostLayout from '../../components/PostLayout';
import { useLocale, localeFromPathname } from '../../lib/locale';
import type { MetaFunction } from 'react-router';
import { createPostMeta } from '../../lib/seo';

export const meta: MetaFunction = ({ location }) =>
  createPostMeta('an-end-to-end-test-that-wasnt', localeFromPathname(location.pathname));

const content = {
  en: {
    kicker: 'Testing · Reliability',
    title: (
      <>
        An End-to-End Test<br /><em>That Wasn't</em>
      </>
    ),
    lede: 'Every NestJS end-to-end spec, for months, assembled its own hand-picked module instead of the real application, and every language\'s LLM-backed feature had only ever been tested through its own no-Ollama fallback path, never the request it was supposed to send. Both were called end-to-end. Neither one was, in the way that mattered.',
    body: (
      <>
        <p>Real HTTP requests, real Postgres and LocalStack in testcontainers, real assertions on real response bodies: by every surface measure, the NestJS suite was doing what an end-to-end test is supposed to do. What it never did was boot the actual application. Each spec built its own <code>Test.createTestingModule</code>, with its own hand-picked entity list and its own <code>synchronize: true</code> to build the schema on the fly. It was a parallel approximation of the real <code>AppModule</code>, close enough to pass, never the thing that runs in production. Close enough turned out to matter: it's the gap that let a real entity-registration omission ship while every test stayed green.</p>
        <h2>Booting the Real Thing, and the One Ordering Trick That Makes It Possible</h2>
        <p>The fix sounds simple and has one subtlety in it. Each spec now starts its containers, sets every environment variable the real app needs, and only then does <code>await import('@/app-module')</code>, dynamically, not as a static import at the top of the file. Jest gives each spec file its own module registry, and the app's data-source module reads <code>DATABASE_URL</code> at import time, not at call time, so importing statically, before the containers exist, would freeze in the wrong values permanently for that file. The dynamic import, ordered after the environment is real, is what lets the actual composition root see the actual values. Schema creation moved from TypeORM's <code>synchronize: true</code> to <code>migrationsRun: true</code>: the real migrations build the schema, the same ones a deployment runs, not a live reflection of whatever the entity classes currently look like. And the bootstrap logic itself (pipes, filters, interceptors) moved out of <code>main.ts</code> into a shared <code>configureApp()</code> that both <code>main.ts</code> and every spec call, so there's one bootstrap sequence in the codebase instead of one real one and seven approximations of it.</p>
        <h2>Two Libraries Fighting Over the Same Module</h2>
        <p>Mocking the one remaining external dependency, the LLM calls, introduced a strange failure. Importing <code>nock</code> patches Node's global <code>http</code> module the instant the import runs, and testcontainers drives the Docker daemon over that same module while probing which container runtime is available. On a warm local Docker daemon the race resolved fine every time. On CI's cold start, it didn't — containers failed with a plain <code>EPIPE</code>, no useful message pointing at why.</p>
        <p>The fix is an explicit ordering discipline: leave <code>nock</code> deliberately inactive (<code>nock.restore()</code>) until the containers and the app are both fully up, activate it only then for the LLM stubs, and deactivate it again before teardown begins. A background consumer that fires a stray LLM call during shutdown just DNS-fails cleanly into its own fallback path instead of corrupting whatever the next spec file tries to do with the Docker socket.</p>
        <h2>The Second Half: Stop Faking the Part That Was Never Tested</h2>
        <p>A separate but related gap ran across all five languages, not just NestJS. Every LLM-backed feature (answering a question about transaction history, categorizing a transaction by merchant name, classifying a refund reason) had only ever been end-to-end tested through its own no-Ollama fallback. Nothing simulated the model, so the request-and-parse path had never run in any test, in any language, for any of these features.</p>
        <p>The shape of the fix was identical everywhere, even though the tool differed by language: a fake server answering one endpoint, <code>POST /api/chat</code>, routing purely by content. The system prompt in the request identifies which service is calling, and something recognizable in the user message picks a deterministic reply, a specific merchant name mapping to a specific category and so on. A marker string anywhere in the request forces a 500, for the handful of tests that specifically want to prove the fallback path still works when the model is unavailable. An unrecognized prompt gets a loud failure rather than a default, so a future LLM feature can't coast on the fallback forever without anyone noticing its real path was never exercised. Go used a plain <code>httptest.Server</code>, FastAPI used <code>respx</code>, Kotlin and Java used the JDK's own built-in HTTP server rather than adding a dependency, and NestJS reused the same <code>nock</code> now wired correctly into the real-app suite.</p>
        <p>Two separate investigations converged on one realization: a test suite's coverage isn't measured by what it exercises when everything is stubbed to go right. It's measured by whether "end-to-end" means the end that matters — the composition root an app boots from, the request a feature sends — rather than a stand-in built, reasonably enough at the time, to make the suite pass a little faster.</p>
        <div className="article-note"><strong>Further reading in the repo</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/implementations/nestjs/examples/test/support/test-app.ts" target="_blank" rel="noreferrer">test/support/test-app.ts</a> (the real-AppModule bootstrap every spec now shares) · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/implementations/go/examples/test/fake_ollama_test.go" target="_blank" rel="noreferrer">fake_ollama_test.go</a> (one language's version of the fake model server)
        </p></div>
      </>
    ),
  },
  ko: {
    kicker: 'Testing · Reliability',
    title: (
      <>
        End-to-End가 아니었던<br /><em>End-to-End 테스트</em>
      </>
    ),
    lede: 'NestJS의 e2e 스펙은 몇 달 동안 실제 애플리케이션을 띄우지 않았다. 스펙마다 손으로 고른 모듈을 따로 조립해 쓰고 있었다. 모든 언어의 LLM 기능도 비슷했다. 모델에 보내야 할 요청은 한 번도 테스트하지 않았고, Ollama가 없을 때 타는 폴백 경로만 테스트했다. 둘 다 end-to-end라고 불렀지만, 정작 중요한 끝까지는 가지 않았다.',
    body: (
      <>
        <p>HTTP 요청을 실제로 보내고, testcontainers로 Postgres와 LocalStack을 띄우고, 응답 본문까지 단언했다. 겉으로 보면 NestJS 스위트는 e2e 테스트가 할 일을 다 하고 있었다. 딱 하나, 실제 애플리케이션을 띄우지 않았다. 스펙마다 <code>Test.createTestingModule</code>을 따로 만들고, 엔티티 목록을 손으로 고르고, 스키마는 <code>synchronize: true</code>로 그때그때 만들었다. 실제 <code>AppModule</code>을 흉내 낸 복제본이었던 셈이다. 테스트를 통과할 만큼은 닮았지만 프로덕션에서 도는 그 모듈은 아니었다.</p>
        <p>그 "닮은 정도"가 결국 문제였다. 엔티티 등록이 하나 빠졌는데도 모든 테스트가 초록인 채로 배포된 게 이 틈 때문이었다.</p>
        <h2>실제 앱을 띄우려면 임포트 순서부터</h2>
        <p>고치는 방법은 단순한데, 까다로운 곳이 한 군데 있다. 이제 스펙은 컨테이너를 먼저 띄우고, 실제 앱에 필요한 환경 변수를 모두 설정한 다음에야 <code>await import('@/app-module')</code>을 실행한다. 파일 맨 위에서 정적으로 임포트하지 않고 동적으로 불러온다. Jest는 스펙 파일마다 모듈 레지스트리를 따로 두고, 앱의 데이터소스 모듈은 <code>DATABASE_URL</code>을 호출 시점이 아닌 임포트 시점에 읽는다. 그래서 컨테이너가 뜨기 전에 정적으로 임포트하면 그 파일에서는 엉뚱한 값이 끝까지 박혀 버린다. 환경이 다 갖춰진 뒤에 동적으로 임포트해야 조립 루트가 제대로 된 값을 본다.</p>
        <p>스키마 생성도 TypeORM의 <code>synchronize: true</code>에서 <code>migrationsRun: true</code>로 바꿨다. 엔티티 클래스의 지금 모양을 그대로 비춰 만드는 대신, 배포 때 돌리는 그 마이그레이션으로 스키마를 만든다. 파이프, 필터, 인터셉터를 거는 부트스트랩 코드도 <code>main.ts</code>에서 꺼내 공용 <code>configureApp()</code>으로 옮겼다. 이제 <code>main.ts</code>와 모든 스펙이 같은 함수를 부른다. 진짜 부트스트랩 하나에 흉내 낸 것 7개가 따로 있던 코드베이스에, 이제 부트스트랩 순서는 하나뿐이다.</p>
        <h2>같은 모듈을 두고 다투는 두 라이브러리</h2>
        <p>남은 외부 의존성은 LLM 호출 하나였다. 이걸 모킹하다가 꽤 이상한 실패를 만났다. <code>nock</code>은 임포트되는 순간 Node의 전역 <code>http</code> 모듈을 패치한다. 그런데 testcontainers도 쓸 수 있는 컨테이너 런타임을 살필 때 같은 모듈로 Docker 데몬과 통신한다. 로컬처럼 Docker 데몬이 이미 데워진 환경에서는 이 경합이 매번 별 탈 없이 지나갔다. CI의 콜드 스타트에서는 그렇지 않았다. 컨테이너가 <code>EPIPE</code> 하나만 남기고 실패했고, 원인을 짐작할 만한 메시지는 없었다.</p>
        <p>해결책은 순서를 명시적으로 지키는 것이다. 컨테이너와 앱이 다 뜰 때까지는 <code>nock.restore()</code>로 <code>nock</code>을 일부러 꺼 둔다. 그다음 LLM 스텁을 위해 켜고, teardown이 시작되기 전에 다시 끈다. 종료 중에 뒤에서 돌던 consumer가 LLM을 한 번 더 부르더라도 DNS 조회에 실패하고 자기 폴백 경로로 빠질 뿐이다. 다음 스펙 파일이 Docker 소켓으로 하려는 일을 망가뜨리지 않는다.</p>
        <h2>나머지 절반, 한 번도 돌지 않은 LLM 경로</h2>
        <p>이와 별개지만 이어지는 문제가 하나 더 있었다. 이번엔 NestJS만이 아닌 5개 언어 전부였다. 거래 내역 질문에 답하기, 가맹점명으로 거래 분류하기, 환불 사유 분류하기 같은 LLM 기능은 모두 Ollama가 없을 때의 폴백 경로로만 e2e 테스트를 해 왔다. 모델을 흉내 내는 장치가 없었으니, 요청을 보내고 응답을 파싱하는 경로는 어느 언어의 어느 기능에서도 테스트로 돌아 본 적이 없었다.</p>
        <p>도구는 언어마다 달랐어도 고친 모양은 같았다. <code>POST /api/chat</code> 엔드포인트 하나에만 답하는 가짜 서버를 두고, 요청 내용만 보고 응답을 고른다. 요청의 system prompt로 어느 서비스가 불렀는지 알아내고, user message에서 알아볼 만한 단서를 찾아 정해진 응답을 돌려준다. 특정 가맹점명이 오면 특정 카테고리를 주는 식이다. 요청 어딘가에 마커 문자열이 있으면 일부러 500을 낸다. 모델을 못 쓸 때도 폴백이 동작하는지 확인하려는 몇몇 테스트를 위한 장치다.</p>
        <p>모르는 프롬프트가 오면 기본값으로 넘기지 않고 크게 실패시킨다. 나중에 추가한 LLM 기능이 진짜 경로는 한 번도 돌지 않은 채 폴백에 기대 계속 통과하는 일을 막으려는 것이다. Go는 평범한 <code>httptest.Server</code>를, FastAPI는 <code>respx</code>를 썼다. Kotlin과 Java는 의존성을 늘리지 않으려고 JDK 내장 HTTP 서버를 썼고, NestJS는 실제 앱 스위트에 제대로 연결한 그 <code>nock</code>을 그대로 썼다.</p>
        <p>따로 시작한 두 조사가 같은 결론에 닿았다. 모든 호출이 성공하도록 스텁해 두고 무엇이 돌았는지 세는 것으로는 커버리지를 잴 수 없다. 앱이 부팅하는 조립 루트, 기능이 내보내는 요청까지 가야 end-to-end다. 그때는 그럴 만한 이유로, 스위트를 조금 빨리 돌리려고 세워 둔 대역 앞에서 멈췄다면 거기까지는 end-to-end가 아니다.</p>
        <div className="article-note"><strong>저장소에서 더 볼 것</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/implementations/nestjs/examples/test/support/test-app.ts" target="_blank" rel="noreferrer">test/support/test-app.ts</a>(이제 모든 스펙이 같이 쓰는 실제 AppModule 부트스트랩) · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/implementations/go/examples/test/fake_ollama_test.go" target="_blank" rel="noreferrer">fake_ollama_test.go</a>(가짜 모델 서버의 Go 버전)
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
