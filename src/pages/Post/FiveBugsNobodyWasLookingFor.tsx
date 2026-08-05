import PostLayout from '../../components/PostLayout';
import { useLocale } from '../../lib/locale';
import type { MetaFunction } from 'react-router';
import { createPostMeta } from '../../lib/seo';

export const meta: MetaFunction = () => createPostMeta('five-bugs-nobody-was-looking-for');

const content = {
  en: {
    kicker: 'API Design · Testing',
    title: (
      <>
        Five Bugs<br /><em>Nobody Was Looking For</em>
      </>
    ),
    lede: "Fixing NestJS's incomplete Swagger docs took an afternoon. Verifying the fix by actually booting the app and curling every documented error path — instead of trusting that the annotations compiled — surfaced a bug that had nothing to do with documentation. Rolling the same discipline out to the other four languages surfaced four more, one of them serious enough that a real deployment's schema migrations would have silently stopped running.",
    body: (
      <>
        <p>Every <code>@ApiOperation</code> in the NestJS implementation had an <code>operationId</code> and nothing else — no <code>summary</code>, no <code>description</code>. Every endpoint documented its success response and nothing else, never the 400, 401, or 404 it actually threw. Every one of 32 DTOs had a bare <code>@ApiProperty()</code> with no options at all. The fix was mechanical: a shared <code>ErrorResponseBody</code> DTO, an explicit <code>@Api&lt;Status&gt;Response</code> per endpoint cross-checked against that handler's own error-mapping code, descriptions on every field.</p>
        <h2>Verifying by Booting the App, Not Reading the Diff</h2>
        <p>The fix was checked by actually starting the app against real Postgres and LocalStack and curling <code>/docs-json</code> and the live error paths — not by trusting that annotations which compile are annotations that are true. That check immediately found something documentation review alone never would: <code>generateErrorResponse</code>'s <code>error</code> field used NestJS's <code>HttpStatus</code> enum reverse-lookup, which produces <code>"NOT_FOUND"</code>, SCREAMING_SNAKE_CASE — inconsistent with the documented contract's <code>"Not Found"</code> and with the global validation pipe's own hardcoded <code>"Bad Request"</code>. A pure code review would have read both pieces separately and never noticed they disagreed; only an actual response body sitting next to the actual doc made the mismatch visible.</p>
        <h2>"Every Language With a REST API Needs This"</h2>
        <p>Checking the other four found four different flavors of the same absence. Java-springboot and Kotlin-springboot didn't have <code>springdoc-openapi</code> as a dependency at all — zero OpenAPI capability, already self-documented in each language's own docs as "not yet introduced," a note that had apparently sat there long enough to stop meaning anything. Go had no mention of Swagger anywhere, not even as a plan. FastAPI was the interesting one: the framework auto-generates a bare OpenAPI skeleton, so <code>/docs</code> renders something and looks finished — but not one route had <code>summary=</code>, <code>description=</code>, or <code>responses=</code>, the identical gap NestJS had, just disguised by a framework default that happens to produce output.</p>
        <p>No harness rule in any of the five languages checked completeness at all — not even NestJS's now-fixed implementation had a regression guard. The checklist had no line item for API documentation, so even a careful manual pass would never have surfaced it on its own. Four separate reasons, one shape: a gap that was easy to leave undocumented, easy to leave unenforced, and in FastAPI's case, easy to mistake for already done.</p>
        <h2>Rolling It Out, With One Instruction That Mattered</h2>
        <p>Fixing the other four languages meant four parallel agents, each given NestJS's finished implementation as the reference and one explicit instruction: cross-check each endpoint's real error-mapping code, and verify against a running app, not against what the code appears to do. That instruction is the reason a documentation task turned into five unrelated, pre-existing production defects — none of them anyone was looking for, all of them only visible to something that actually sent a request and read the response.</p>
        <p>The most serious one was in Java-springboot. Spring Boot 4 had split Flyway's autoconfiguration into its own separate starter module — and the dependency for it was missing. Database migrations were silently never running against a real database. Nothing in the test suite had ever caught it, because the tests used <code>ddl-auto: create-drop</code>, which builds the schema from the entity mappings directly and has no use for Flyway at all. A production deployment would have booted clean, served traffic, and simply never applied a single migration — invisible until the schema drifted far enough from what the entities expected to fail loudly, at the worst possible time to discover why.</p>
        <p>The rest, smaller but all real: Kotlin's Spring Security returned its own generic 403 for an unauthenticated request before the app's exception handler ever got a chance to produce the documented 401 shape. Go's auth middleware sent a 401 as plain text, not the JSON schema its own docs promised, and several validation 400s had the same problem. FastAPI had no exception handler at all for an invalid JWT — a bad token produced an unhandled 500 instead of a clean 401. Java's own <code>/v3/api-docs</code> and Swagger UI required a bearer token to view — the API documentation was, itself, not publicly reachable. And NestJS's own scaffolding generator had a bug in the very code the Swagger fix was touching: a generated cancel handler's "already cancelled" domain error was never mapped in the controller's catch block, quietly producing a 500 where a 400 was intended.</p>
        <div className="article-note"><strong>The pattern underneath all five</strong><p>None of these bugs were about documentation. Every one of them was already sitting in production-shaped code, waiting for a request shaped exactly the way its author never happened to send one. What found all five wasn't a smarter reviewer — it was a rule applied uniformly: don't just make the annotation compile, prove the thing it describes is actually true by asking the running app.</p></div>
        <h2>The Follow-Up Nobody Planned For</h2>
        <p>Three of the four rollout agents shipped a fix that passed everywhere except the scaffolding-regression check — each language's <code>create-domain</code> generator still emitted endpoints without the new required annotations, because the generator template was never told the bar had moved. Kotlin's agent, watching this happen to the other three first, fixed its own generator proactively and passed on the first try. The lesson generalized cleanly: any harness rule that checks per-endpoint or per-file content will very likely need a matching scaffolding-generator update — that's not an edge case to discover later, it's a second step to budget for up front.</p>
        <div className="article-note"><strong>Further reading in the repo</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/api-response.md" target="_blank" rel="noreferrer">docs/architecture/api-response.md</a> — the completeness bar, now a root-level requirement · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/implementations/nestjs/harness/evaluators/rules/api-documentation.evaluator.ts" target="_blank" rel="noreferrer">api-documentation.evaluator.ts</a> — the harness rule that now enforces it
        </p></div>
      </>
    ),
  },
  ko: {
    kicker: 'API Design · Testing',
    title: (
      <>
        아무도 찾고 있지 않던<br /><em>버그 다섯 개</em>
      </>
    ),
    lede: 'nestjs의 미완성 Swagger 문서를 고치는 데는 반나절이면 충분했다. 애노테이션이 컴파일된다는 걸 믿는 대신, 실제로 앱을 켜고 문서화된 모든 에러 경로를 curl로 확인해서 수정을 검증했더니 — 문서와는 아무 관계 없는 버그가 하나 나왔다. 같은 원칙을 나머지 4개 언어에 그대로 적용하자 네 개가 더 나왔고, 그중 하나는 실제 배포라면 스키마 마이그레이션이 조용히 멈춰 있었을 만큼 심각했다.',
    body: (
      <>
        <p>nestjs 구현체의 모든 <code>@ApiOperation</code>은 <code>operationId</code>만 있고 그 외엔 아무것도 없었다 — <code>summary</code>도, <code>description</code>도 없이. 모든 엔드포인트는 성공 응답만 문서화했고, 실제로 던지는 400·401·404는 하나도 문서화하지 않았다. 32개 DTO 전부 옵션 없는 맨 <code>@ApiProperty()</code>였다. 수정은 기계적이었다: 공유 <code>ErrorResponseBody</code> DTO, 각 핸들러 자신의 에러 매핑 코드와 대조해 붙인 명시적 <code>@Api&lt;Status&gt;Response</code>, 모든 필드에 붙인 설명.</p>
        <h2>diff를 읽는 대신 앱을 켜서 검증하기</h2>
        <p>이 수정은 실제 Postgres와 LocalStack을 상대로 앱을 실제로 띄우고 <code>/docs-json</code>과 실제 에러 경로를 curl로 확인해서 검증됐다 — 컴파일되는 애노테이션을 곧 참인 애노테이션이라 믿는 대신. 그 검증은 즉시 문서 리뷰만으로는 절대 못 잡았을 걸 찾아냈다: <code>generateErrorResponse</code>의 <code>error</code> 필드가 nestjs의 <code>HttpStatus</code> enum 역방향 조회를 쓰고 있었는데, 이건 <code>"NOT_FOUND"</code>, 즉 SCREAMING_SNAKE_CASE를 만들어냈다 — 문서화된 계약의 <code>"Not Found"</code>와도, 전역 validation pipe에 하드코딩된 <code>"Bad Request"</code>와도 어긋났다. 순수 코드 리뷰였다면 둘을 각각 따로 읽고 서로 어긋난다는 걸 절대 못 알아챘을 것이다 — 실제 응답 본문이 실제 문서 옆에 나란히 놓였을 때만 그 불일치가 보였다.</p>
        <h2>"REST API가 있는 모든 언어에 이게 필요하다"</h2>
        <p>나머지 네 언어를 확인해보니 같은 공백의 네 가지 다른 형태가 나왔다. java-springboot와 kotlin-springboot는 <code>springdoc-openapi</code> 의존성 자체가 없었다 — OpenAPI 기능이 전무했고, 각 언어 자신의 문서에 "아직 도입 안 함"이라고 이미 스스로 적혀 있었다 — 더 이상 아무 의미도 없어질 만큼 오래 그대로 놓여 있던 메모였다. go는 Swagger에 대한 언급이 어디에도, 계획으로조차 없었다. fastapi가 흥미로운 경우였다: 프레임워크가 기본 OpenAPI 스켈레톤을 자동 생성해서 <code>/docs</code>에 뭔가가 렌더링되고 다 끝난 것처럼 보였다 — 하지만 어느 라우트에도 <code>summary=</code>, <code>description=</code>, <code>responses=</code>가 없었다, nestjs와 똑같은 공백이었고, 어쩌다 출력을 만들어내는 프레임워크 기본값에 가려져 있었을 뿐이다.</p>
        <p>5개 언어 어디에도 완전성을 검사하는 하네스 규칙은 없었다 — 방금 고친 nestjs 구현조차 회귀 방지 장치가 없었다. 체크리스트에는 API 문서화 항목 자체가 없어서, 아무리 꼼꼼한 수동 검토라도 스스로 이걸 드러낼 수 없었을 것이다. 원인은 넷, 모양은 하나였다: 문서화하지 않고 넘어가기 쉽고, 강제하지 않고 넘어가기 쉬우며, fastapi의 경우엔 이미 끝났다고 착각하기까지 쉬운 공백.</p>
        <h2>롤아웃, 그리고 중요했던 지시 하나</h2>
        <p>나머지 네 언어를 고치는 건 4개의 병렬 에이전트를 뜻했다. 각자 nestjs의 완성된 구현을 레퍼런스로 받았고, 명시적인 지시 하나를 함께 받았다: 각 엔드포인트의 실제 에러 매핑 코드를 대조 확인하고, 코드가 뭘 하는 것처럼 보이는지가 아니라 실제로 돌아가는 앱을 상대로 검증하라. 문서화 작업이 다섯 개의 무관하고 이미 존재하던 프로덕션 결함으로 이어진 건 바로 이 지시 때문이었다 — 그 무엇도 누군가 찾고 있던 게 아니었고, 전부 실제로 요청을 보내고 응답을 읽어야만 보이는 것들이었다.</p>
        <p>가장 심각한 건 java-springboot였다. Spring Boot 4가 Flyway 자동설정을 별도 스타터 모듈로 분리했는데, 그 의존성이 빠져 있었다. 데이터베이스 마이그레이션이 실제 데이터베이스를 상대로는 조용히 한 번도 실행되지 않고 있었다. 테스트 스위트는 이걸 한 번도 잡아낸 적이 없었다 — 테스트가 <code>ddl-auto: create-drop</code>을 쓰고 있었기 때문이다. 이건 엔티티 매핑에서 직접 스키마를 만들어버려서 Flyway가 아예 쓰일 일이 없다. 실제 배포였다면 깨끗하게 부팅되고 트래픽을 받았을 것이고, 마이그레이션은 단 하나도 적용되지 않은 채였을 것이다 — 스키마가 엔티티가 기대하는 것과 충분히 어긋나 요란하게 실패할 때까지, 그것도 이유를 알아내기 가장 나쁜 타이밍에 발견됐을 것이다.</p>
        <p>나머지는 더 작지만 전부 진짜였다: kotlin의 Spring Security는 인증되지 않은 요청에 자체 일반 403을 반환해버려서, 앱 자신의 예외 핸들러가 문서화된 401 형태를 만들 기회조차 얻지 못했다. go의 인증 미들웨어는 401을 자기 문서가 약속한 JSON 스키마가 아니라 평문으로 보냈고, 여러 validation 400도 같은 문제였다. fastapi는 잘못된 JWT에 대한 예외 핸들러 자체가 없어서 — 잘못된 토큰이 깔끔한 401 대신 처리되지 않은 500을 만들어냈다. java 자신의 <code>/v3/api-docs</code>와 Swagger UI는 보려면 bearer 토큰이 필요했다 — API 문서 자체가 공개적으로 접근 불가능했던 것이다. 그리고 nestjs 자신의 스캐폴딩 생성기는, 이번 Swagger 수정이 건드리고 있던 바로 그 코드 안에 버그가 있었다: 생성된 cancel 핸들러의 "이미 취소됨" 도메인 에러가 컨트롤러의 catch 블록에서 한 번도 매핑된 적이 없어서, 의도한 400 대신 조용히 500을 만들어내고 있었다.</p>
        <div className="article-note"><strong>다섯 개 모두를 관통하는 패턴</strong><p>이 버그 중 어느 것도 문서화에 관한 게 아니었다. 전부 이미 프로덕션 형태의 코드 안에 앉아, 저자가 한 번도 우연히 보내본 적 없는 정확한 모양의 요청을 기다리고 있었다. 이 다섯 개를 찾아낸 건 더 똑똑한 리뷰어가 아니었다 — 균일하게 적용된 규칙 하나였다: 애노테이션을 컴파일되게 만드는 것으로 끝내지 말고, 그것이 서술하는 게 실제로 참인지 돌아가는 앱에 직접 물어봐서 증명하라.</p></div>
        <h2>아무도 계획하지 않았던 후속 작업</h2>
        <p>롤아웃 에이전트 4개 중 3개는 다른 모든 곳은 통과했지만 scaffolding-regression 검사만은 통과하지 못하는 수정을 배포했다 — 각 언어의 <code>create-domain</code> 생성기가 여전히 새로 요구되는 애노테이션 없이 엔드포인트를 뱉어내고 있었다, 생성기 템플릿에는 기준이 바뀌었다는 걸 아무도 알려주지 않았기 때문이다. kotlin의 에이전트는 다른 셋에게 이 일이 먼저 일어나는 걸 지켜본 뒤 자기 생성기를 선제적으로 고쳤고 첫 시도에 통과했다. 교훈은 깔끔하게 일반화됐다: 엔드포인트별 또는 파일별 내용을 검사하는 하네스 규칙은 거의 항상 짝을 이루는 스캐폴딩 생성기 업데이트가 필요하다 — 나중에 발견하는 예외 상황이 아니라, 처음부터 예산에 넣어둬야 할 두 번째 단계다.</p>
        <div className="article-note"><strong>저장소 내 추가 자료</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/api-response.md" target="_blank" rel="noreferrer">docs/architecture/api-response.md</a> — 이제 루트 레벨 요구사항이 된 완전성 기준 · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/implementations/nestjs/harness/evaluators/rules/api-documentation.evaluator.ts" target="_blank" rel="noreferrer">api-documentation.evaluator.ts</a> — 이제 그걸 강제하는 하네스 규칙
        </p></div>
      </>
    ),
  },
};

export default function FiveBugsNobodyWasLookingFor() {
  const { locale } = useLocale();
  const c = content[locale];

  return (
    <PostLayout
      slug="five-bugs-nobody-was-looking-for"
      kicker={c.kicker}
      title={c.title}
      lede={c.lede}
    >
      {c.body}
    </PostLayout>
  );
}
