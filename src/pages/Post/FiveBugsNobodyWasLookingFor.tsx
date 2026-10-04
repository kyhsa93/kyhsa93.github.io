import PostLayout from '../../components/PostLayout';
import { useLocale, localeFromPathname } from '../../lib/locale';
import type { MetaFunction } from 'react-router';
import { createPostMeta } from '../../lib/seo';

export const meta: MetaFunction = ({ location }) =>
  createPostMeta('five-bugs-nobody-was-looking-for', localeFromPathname(location.pathname));

const content = {
  en: {
    kicker: 'API Design · Testing',
    title: (
      <>
        Five Bugs<br /><em>Nobody Was Looking For</em>
      </>
    ),
    lede: "An API annotation that compiles is not yet an API annotation that's true, and the cheapest way to tell the difference is to ask the running app. Fixing the incomplete Swagger docs in the NestJS version of my example project (the same backend design, implemented in five languages) took an afternoon. Verifying the fix by booting the app and curling every documented error path, instead of trusting that the annotations compiled, surfaced a bug that had nothing to do with documentation. Rolling the same discipline out to the other four languages surfaced four more, one of them serious enough that a real deployment's schema migrations would have stopped running without a sound. Two further bugs turned up along the way, incidental to that count but no less real.",
    body: (
      <>
        <p>Every <code>@ApiOperation</code> in the NestJS implementation had an <code>operationId</code> and nothing else: no <code>summary</code>, no <code>description</code>. Every endpoint documented its success response and nothing else, never the 400, 401, or 404 it threw. Every one of 32 DTOs had a bare <code>@ApiProperty()</code> with no options at all. The fix was mechanical: a shared <code>ErrorResponseBody</code> DTO, an explicit <code>@Api&lt;Status&gt;Response</code> per endpoint cross-checked against that handler's own error-mapping code, descriptions on every field.</p>
        <h2>Verifying by Booting the App, Not Reading the Diff</h2>
        <p>The fix was checked by starting the app against real Postgres and LocalStack and curling <code>/docs-json</code> and the live error paths, not by trusting that annotations which compile are annotations that are true. That check immediately found something documentation review alone never would. <code>generateErrorResponse</code>'s <code>error</code> field used NestJS's <code>HttpStatus</code> enum reverse-lookup, which produces <code>"NOT_FOUND"</code>, SCREAMING_SNAKE_CASE, inconsistent with the documented contract's <code>"Not Found"</code> and with the global validation pipe's own hardcoded <code>"Bad Request"</code>. A pure code review would have read both pieces separately and never noticed they disagreed; only a response body sitting next to the doc made the mismatch visible.</p>
        <h2>"Every Language With a REST API Needs This"</h2>
        <p>Checking the other four found four different flavors of the same absence. Java-springboot and Kotlin-springboot didn't have <code>springdoc-openapi</code> as a dependency at all. They had zero OpenAPI capability, already self-documented in each language's own docs as "not yet introduced," a note that had apparently sat there long enough to stop meaning anything. Go had no mention of Swagger anywhere, not even as a plan. FastAPI was the interesting one: the framework auto-generates a bare OpenAPI skeleton, so <code>/docs</code> renders something and looks finished — but not one route had <code>summary=</code>, <code>description=</code>, or <code>responses=</code>, the identical gap NestJS had, just disguised by a framework default that happens to produce output.</p>
        <p>Each language had an architecture checker (a script that statically checks the code against the documented rules), and none of the five checked documentation completeness at all; not even NestJS's now-fixed implementation had a regression guard. The checklist had no line item for API documentation, so even a careful manual pass would never have surfaced it on its own. Four separate reasons, one shape: a gap that was easy to leave undocumented, easy to leave unenforced, and in FastAPI's case, easy to mistake for already done.</p>
        <h2>Rolling It Out, With One Instruction That Mattered</h2>
        <p>Fixing the other four languages meant four parallel agents, each given NestJS's finished implementation as the reference and one explicit instruction: cross-check each endpoint's error-mapping code, and verify against a running app, not against what the code appears to do. That instruction is the reason a documentation task turned into five unrelated, pre-existing production defects. None of them were anything anyone was looking for, and all of them were only visible to something that sent a request and read the response.</p>
        <p>The most serious one was in Java-springboot. Spring Boot 4 had split Flyway's autoconfiguration into its own separate starter module, and the dependency for it was missing. Database migrations were never running against a real database, and nothing said so. Nothing in the test suite had ever caught it, because the tests used <code>ddl-auto: create-drop</code>, which builds the schema from the entity mappings directly and has no use for Flyway at all. A production deployment would have booted clean, served traffic, and simply never applied a single migration — invisible until the schema drifted far enough from what the entities expected to fail loudly, at the worst possible time to discover why.</p>
        <p>The rest, smaller but all real, complete the count. Kotlin's Spring Security returned its own generic 403 for an unauthenticated request before the app's exception handler ever got a chance to produce the documented 401 shape. Go's auth middleware sent a 401 as plain text, not the JSON schema its own docs promised, and several validation 400s had the same problem. FastAPI had no exception handler at all for an invalid JWT, so a bad token produced an unhandled 500 instead of a clean 401. That's the five the title counts. Two more turned up along the way, outside that count but no less real. Java's own <code>/v3/api-docs</code> and Swagger UI required a bearer token to view, so the API documentation was, itself, not publicly reachable. And NestJS's own scaffolding generator had a bug in the very code the Swagger fix was touching: a generated cancel handler's "already cancelled" domain error was never mapped in the controller's catch block, producing a 500 where a 400 was intended.</p>
        <div className="article-note"><strong>The pattern underneath all seven</strong><p>None of these bugs were about documentation. Every one of them was already sitting in production-shaped code, waiting for a request shaped the way its author never happened to send one. What found all seven wasn't a smarter reviewer. It was a rule applied uniformly: don't just make the annotation compile, prove the thing it describes is true by asking the running app.</p></div>
        <h2>The Follow-Up Nobody Planned For</h2>
        <p>Three of the four rollout agents shipped a fix that passed everywhere except the check that covers the code generator. Each language's <code>create-domain</code> generator (a script that generates a skeleton domain from a name) still emitted endpoints without the new required annotations, because the generator template was never told the bar had moved. Kotlin's agent, watching this happen to the other three first, fixed its own generator proactively and passed on the first try. The lesson generalized cleanly: any checker rule that checks per-endpoint or per-file content will very likely need a matching generator update. That's not an edge case to discover later; it's a second step to budget for up front.</p>
        <div className="article-note"><strong>Further reading</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/api-response.md" target="_blank" rel="noreferrer">docs/architecture/api-response.md</a> (the documentation completeness bar, now a root-level requirement in backend-service-playbook, my example project that implements the same backend design in five languages side by side) · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/implementations/nestjs/harness/evaluators/rules/api-documentation.evaluator.ts" target="_blank" rel="noreferrer">api-documentation.evaluator.ts</a> (the NestJS checker rule that now enforces it)
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
    lede: '컴파일되는 API 애노테이션이 곧 맞는 애노테이션은 아니다. 둘을 가르는 가장 싼 방법은 돌아가는 앱에 물어보는 것이다. 같은 백엔드 설계를 5개 언어로 구현해 둔 내 예제 프로젝트에서, NestJS 쪽의 덜 된 Swagger 문서를 고치는 데는 반나절이면 됐다. 애노테이션이 컴파일되니 맞겠거니 하지 않고, 앱을 직접 띄워 문서에 적은 에러 경로를 하나하나 curl로 확인했다. 그랬더니 문서와 상관없는 버그가 하나 나왔다. 같은 방식을 나머지 4개 언어에 적용하자 4개가 더 나왔다. 그중 하나는 실제 배포였다면 스키마 마이그레이션이 아무 표시 없이 멈춰 있었을 만큼 심각했다. 이 개수와 별개로 과정에서 버그 2개가 더 걸렸는데, 이것들도 엄연한 버그였다.',
    body: (
      <>
        <p>NestJS 구현의 <code>@ApiOperation</code>에는 하나같이 <code>operationId</code>만 있었다. <code>summary</code>도 <code>description</code>도 없었다. 엔드포인트는 모두 성공 응답만 문서화했고, 실제로 던지는 400·401·404는 하나도 적지 않았다. DTO 32개는 전부 옵션 없는 맨 <code>@ApiProperty()</code>였다. 고치는 일은 기계적이었다. 공용 <code>ErrorResponseBody</code> DTO를 만들고, 엔드포인트마다 핸들러의 에러 매핑 코드와 대조해 <code>@Api&lt;Status&gt;Response</code>를 명시하고, 모든 필드에 설명을 달았다.</p>
        <h2>diff를 읽지 말고 앱을 띄워서 확인한다</h2>
        <p>수정은 Postgres와 LocalStack을 붙여 앱을 띄운 다음, <code>/docs-json</code>과 에러 경로를 curl로 직접 찔러서 확인했다. 컴파일되는 애노테이션이 곧 맞는 애노테이션이라고 믿지 않기로 했다. 그러자 문서 리뷰만으로는 절대 못 찾았을 문제가 바로 나왔다. <code>generateErrorResponse</code>의 <code>error</code> 필드가 NestJS <code>HttpStatus</code> enum을 거꾸로 조회해 값을 만들고 있었다. 그 결과가 <code>"NOT_FOUND"</code> 같은 SCREAMING_SNAKE_CASE다.</p>
        <p>문서에 적힌 계약은 <code>"Not Found"</code>였고, 전역 validation pipe에는 <code>"Bad Request"</code>가 하드코딩돼 있었다. 코드 리뷰라면 두 곳을 따로따로 읽었을 테니 서로 다르다는 걸 눈치채지 못했을 것이다. 응답 본문을 문서 옆에 나란히 놓고 나서야 어긋난 게 보였다.</p>
        <h2>"REST API가 있는 언어라면 다 필요하다"</h2>
        <p>나머지 네 언어를 열어 보니 같은 빈자리가 저마다 다른 모양으로 있었다. java-springboot와 kotlin-springboot에는 <code>springdoc-openapi</code> 의존성부터 없었다. OpenAPI 기능이 아예 없었고, 각 언어 문서에 "아직 도입 안 함"이라고 스스로 적어 두기까지 했다. 너무 오래 그 자리에 있어서 아무도 신경 쓰지 않게 된 메모였다. Go는 Swagger 얘기가 어디에도 없었고, 계획에조차 없었다.</p>
        <p>FastAPI가 흥미로웠다. 프레임워크가 기본 OpenAPI 뼈대를 알아서 만들어 주니 <code>/docs</code>에 뭔가 뜨고, 다 된 것처럼 보인다. 그런데 어느 라우트에도 <code>summary=</code>, <code>description=</code>, <code>responses=</code>가 없었다. NestJS와 똑같은 빈자리가, 어쨌든 화면을 그려 주는 프레임워크 기본값에 가려져 있었다.</p>
        <p>언어마다 코드가 문서의 규칙을 따르는지 정적으로 보는 아키텍처 검사 스크립트가 있었지만, 5개 언어 어디에도 문서가 다 채워졌는지 보는 규칙은 없었다. 방금 고친 NestJS조차 회귀를 막을 장치가 없었다. 체크리스트에도 API 문서화 항목이 없었으니, 아무리 꼼꼼히 손으로 훑어도 이 문제는 걸리지 않았을 것이다. 이유는 언어마다 달랐지만 모양은 같았다. 문서 없이 넘어가기 쉽고, 강제하지 않고 넘어가기 쉽고, FastAPI처럼 이미 끝났다고 착각하기도 쉬운 빈자리였다.</p>
        <h2>나머지 언어로 넓히며 붙인 지시 하나</h2>
        <p>나머지 네 언어는 에이전트 4개를 병렬로 돌려 고쳤다. 각자 NestJS의 완성된 구현을 참고용으로 받았고, 지시도 하나 함께 받았다. 엔드포인트마다 실제 에러 매핑 코드와 대조하고, 코드가 하는 것처럼 보이는 동작 대신 돌아가는 앱을 상대로 검증하라는 것이었다. 문서화 작업이 서로 상관없는 기존 프로덕션 결함 5개로 번진 건 이 지시 덕분이었다. 누가 찾던 버그도 아니었고, 요청을 보내 응답을 읽어 봐야만 보이는 것들이었다.</p>
        <p>가장 심각한 건 java-springboot였다. Spring Boot 4에서 Flyway 자동 설정이 별도 스타터 모듈로 떨어져 나왔는데, 그 의존성이 빠져 있었다. 실제 데이터베이스에서 마이그레이션이 한 번도 돌지 않았고, 아무것도 그걸 알려 주지 않았다. 테스트가 <code>ddl-auto: create-drop</code>을 썼기 때문에 테스트 스위트도 잡지 못했다. 이 설정은 엔티티 매핑으로 스키마를 바로 만들기 때문에 Flyway가 끼어들 일이 없다.</p>
        <p>그대로 배포했다면 앱은 멀쩡히 뜨고 트래픽도 받았을 것이다. 다만 마이그레이션은 하나도 적용되지 않는다. 스키마가 엔티티 기대와 충분히 벌어져 요란하게 터질 때까지 아무도 몰랐을 것이고, 터지는 시점은 원인을 찾기 가장 곤란한 때였을 것이다.</p>
        <p>나머지는 그보다 작지만 모두 버그였고, 이걸로 다섯이 채워진다. Kotlin에서는 인증되지 않은 요청에 Spring Security가 자기 기본 403을 먼저 돌려줘서, 앱의 예외 핸들러가 문서에 적힌 401을 만들 기회가 없었다. Go의 인증 미들웨어는 문서가 약속한 JSON 스키마 대신 평문으로 401을 보냈고, validation 400 몇 개도 같은 문제였다. FastAPI는 잘못된 JWT를 처리하는 예외 핸들러가 아예 없어서, 나쁜 토큰이 오면 깔끔한 401 대신 처리되지 않은 500이 났다. 여기까지가 제목의 다섯 개다.</p>
        <p>이 개수에 넣지 않은 두 개도 과정에서 나왔다. Java의 <code>/v3/api-docs</code>와 Swagger UI는 bearer 토큰이 있어야 볼 수 있었다. API 문서 자체가 공개돼 있지 않았던 것이다. NestJS의 스캐폴딩 생성기에도 이번 Swagger 수정이 건드리던 그 코드에 버그가 있었다. 생성된 cancel 핸들러의 "이미 취소됨" 도메인 에러가 컨트롤러 catch 블록에서 매핑되지 않아, 400이어야 할 응답이 아무 경고 없이 500으로 나가고 있었다.</p>
        <div className="article-note"><strong>7개를 꿰는 패턴</strong><p>7개 중 문서화 버그는 하나도 없었다. 모두 프로덕션과 같은 모양의 코드 안에 이미 있었고, 작성자가 한 번도 보내 본 적 없는 모양의 요청을 기다리고 있었다. 이걸 찾아낸 건 더 뛰어난 리뷰어가 아니었다. 모든 언어에 똑같이 적용한 규칙 하나였다. 애노테이션이 컴파일되는 데서 멈추지 말고, 거기 적힌 내용이 맞는지 돌아가는 앱에 직접 물어보는 것이다.</p></div>
        <h2>계획에 없던 후속 작업</h2>
        <p>에이전트 4개 중 3개가 낸 수정은 다른 검사는 다 통과하고 생성기를 확인하는 검사 하나에서 걸렸다. 각 언어의 <code>create-domain</code> 생성기(도메인 이름 하나로 빈 뼈대 코드를 만들어 주는 스크립트)가 새로 요구되는 애노테이션 없이 엔드포인트를 만들고 있었다. 기준이 바뀌었다는 걸 생성기 템플릿에 아무도 반영하지 않았던 것이다. Kotlin 에이전트는 다른 셋이 걸리는 걸 먼저 보고 자기 생성기를 미리 고쳐서 첫 시도에 통과했다.</p>
        <p>여기서 얻은 교훈은 다른 데도 그대로 쓸 수 있다. 엔드포인트나 파일 단위로 내용을 검사하는 규칙을 추가하면, 뼈대 생성기도 거의 틀림없이 같이 고쳐야 한다. 나중에 우연히 발견할 예외로 볼 일이 아니다. 처음부터 두 번째 단계로 일정에 넣어 두는 게 낫다.</p>
        <div className="article-note"><strong>더 볼 자료</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/api-response.md" target="_blank" rel="noreferrer">docs/architecture/api-response.md</a>(같은 백엔드 설계를 5개 언어로 나란히 구현해 둔 내 예제 프로젝트 backend-service-playbook에서, 이제 최상위 요구사항이 된 문서 완성도 기준) · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/implementations/nestjs/harness/evaluators/rules/api-documentation.evaluator.ts" target="_blank" rel="noreferrer">api-documentation.evaluator.ts</a>(그 기준을 강제하는 NestJS 검사 규칙)
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
