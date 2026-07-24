import PostLayout from '../../components/PostLayout';
import { useLocale } from '../../lib/locale';

const content = {
  en: {
    kicker: 'Docker · Developer experience',
    title: (
      <>
        Developer Experience<br /><em>in Containerized Environments</em>
      </>
    ),
    lede: "The value of containers doesn't end at matching deployment environments. The bigger value is letting even a newly joined developer run the system quickly, experiment safely, and verify it the same way as everyone else.",
    body: (
      <>
        <p>“It works on my machine” is usually a sign that the environment's contract, not the code, was never documented. If the runtime version, database settings, dependent services, seed data, and startup order live only in someone's memory, the team's development speed ends up bottlenecked by whoever is least familiar with the environment.</p>
        <p>Containers are a good tool for moving that contract into code. But putting everything into a Dockerfile doesn't automatically improve the developer experience. You need to design for fast startup, fast reflection of code changes, predictable data, and clear failure messages together, for a containerized environment to actually reduce friction for the team.</p>
        <h2>What Makes a Good Local Environment</h2>
        <p>A good development environment is closer to a single command than a long installation guide in a document. After cloning the repository, <code>docker compose up</code> should start the application and its required dependencies, and once the health checks pass, the API should be callable. Even on failure, you should be able to tell immediately from the logs and status which service isn't ready.</p>
        <p>The word “required” matters here. You don't need to replicate every piece of production infrastructure locally. Prioritize including whatever is needed to validate the contract — a database, message broker, or cache the feature under development actually needs — and things like an observability platform or a large-scale analytics system can be replaced with a mock or a shared development environment.</p>
        <h2>1. Make Compose an Executable Runbook</h2>
        <p>A Compose file isn't a list of containers — it's an executable document that describes the relationships between services. It should expose not just ports, environment variables, and volumes, but also startup order and readiness. Whether a container actually started matters less than whether it's really ready to accept requests.</p>
        <h3>Example: A Compose File That Declares Dependencies and Health Checks</h3>
        <pre><code>{`services:
  api:
    build:
      context: .
      target: development
    command: npm run dev
    ports: ["3000:3000"]
    volumes:
      - .:/app
      - node_modules:/app/node_modules
    environment:
      DATABASE_URL: postgres://app:app@db:5432/app
      REDIS_URL: redis://redis:6379
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: app
      POSTGRES_DB: app
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app -d app"]
      interval: 3s
      timeout: 3s
      retries: 10

  redis:
    image: redis:7-alpine
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 3s
      timeout: 3s
      retries: 10

volumes:
  node_modules:`}</code></pre>
        <p>Instead of waiting only for the database's port to open, the application waits for it to actually be connectable. This reduces unnecessary restarts when a dependent service starts up slowly during development. That said, the application itself must still be able to retry a failed connection — Compose's startup ordering doesn't replace a runtime recovery strategy.</p>
        <h2>2. Separate the Development Image from the Deployment Image</h2>
        <p>A development container should reflect code changes immediately and include debuggers and testing tools. A deployment image, on the other hand, should be small, reproducible, and contain only what's needed to run. Forcing a single image to serve both purposes makes local development slow and the production image unnecessarily large.</p>
        <p>A multi-stage build lets you reuse dependency installation and the build step while keeping the final image small. Locally you pick the development target; CI and production use only the production target. Declaring the runtime user and file permissions at this stage too helps narrow the gap between development and production environments.</p>
        <div className="article-note"><strong>Feedback Loop</strong><p>If it still takes a long time to see the result of changing a single line of code after adopting containers, that's a failure. Measure your local feedback time first, using source volume mounts, file-watch exclusion rules, and dependency caching.</p></div>
        <h2>3. Make Data a Version-Controlled Initialization Process</h2>
        <p>If every developer's database looks different, the same bug becomes hard to reproduce. It's best to manage schema changes through migrations and minimal reference data through seed scripts. Relying on “someone's dump file” increases the risk of exposing sensitive data, and the cost of recreating the environment only grows over time.</p>
        <p>Initialization should be made idempotent. It needs to run safely not only after wiping a container volume, but also on top of existing data. Because test data and data for local manual verification serve different purposes, it's best to keep small, fast fixtures separate from readable sample data.</p>
        <h2>4. Keep Secrets Outside the Image and the Repository</h2>
        <p>Putting an API key into a Compose file or Dockerfile for convenience leaves it lingering in image layers and Git history for a long time. Provide a <code>.env.example</code> whose defaults are safe, and inject real personal keys from local environment variables or a secrets manager. It's also best to use a separate, permission- and usage-limited key just for local development.</p>
        <p>The same principle applies to builds. Values needed only at build time — like a private package registry token — can be passed as a BuildKit secret so they never end up in the final image. The goal of secrets management isn't to make things inconvenient for developers, but to make the safe path the easiest one.</p>
        <h2>5. Re-Verify the Same Contract in CI</h2>
        <p>A local Compose environment is valuable in CI too. Instead of validating the application with unit tests alone, you can run integration tests — including a real database and message broker — with the same configuration. That said, speed matters in CI too, so you don't need to run every test inside a container.</p>
        <p>The recommended flow is to run fast unit tests first, then follow up with the integration tests affected by the changed contract. Image builds and vulnerability scans happen at the pre-deployment stage. The key isn't making local, CI, and production files completely identical — it's sharing a common contract while making environment-specific differences explicit.</p>
        <h2>Development Environment Checklist</h2>
        <ul>
          <li>Can a new developer run the service with one or two commands?</li>
          <li>Are a dependent service's readiness and failure causes visible?</li>
          <li>Is the feedback time after a code change short enough?</li>
          <li>Is the contract for schema, seed data, and environment variables managed in the repository?</li>
          <li>Do secrets stay out of images, logs, and commit history?</li>
          <li>Does CI verify the same core integration contract as local?</li>
        </ul>
        <p>The purpose of a containerized environment isn't to lock developers into production. It's to let anyone experiment quickly from the same starting point, and reproduce the same state when something goes wrong. Once you start treating the environment as part of the product, containers become more than a runtime tool — they become the foundation that supports the team's developer experience.</p>
        <div className="article-note"><strong>Further reading in the repo</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/local-dev.md" target="_blank" rel="noreferrer">docs/architecture/local-dev.md</a> — the full local-dev Compose setup, including LocalStack · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/container.md" target="_blank" rel="noreferrer">docs/architecture/container.md</a> — the Dockerfile/multi-stage-build conventions this depends on
        </p></div>
      </>
    ),
  },
  ko: {
    kicker: 'Docker · Developer experience',
    title: (
      <>
        컨테이너화된 환경의<br /><em>개발자 경험</em>
      </>
    ),
    lede: '컨테이너의 가치는 배포 환경을 맞추는 데서 끝나지 않는다. 더 큰 가치는 갓 합류한 개발자조차 시스템을 빠르게 실행하고, 안전하게 실험하고, 다른 모든 사람과 동일한 방식으로 검증할 수 있게 해준다는 데 있다.',
    body: (
      <>
        <p>“내 컴퓨터에서는 잘 되는데요”는 대개 코드가 아니라 환경의 계약(contract)이 한 번도 문서화되지 않았다는 신호다. 런타임 버전, 데이터베이스 설정, 의존 서비스, 시드 데이터, 기동 순서가 누군가의 기억 속에만 존재한다면, 팀의 개발 속도는 그 환경에 가장 익숙하지 않은 사람 수준으로 병목이 걸리게 된다.</p>
        <p>컨테이너는 그 계약을 코드로 옮기기에 좋은 도구다. 하지만 모든 것을 Dockerfile에 담는다고 해서 개발자 경험이 자동으로 좋아지지는 않는다. 빠른 기동, 코드 변경의 빠른 반영, 예측 가능한 데이터, 명확한 실패 메시지를 함께 설계해야만 컨테이너화된 환경이 팀의 마찰을 실제로 줄여줄 수 있다.</p>
        <h2>좋은 로컬 개발 환경의 조건</h2>
        <p>좋은 개발 환경은 문서에 담긴 긴 설치 가이드보다는 명령어 하나에 가깝다. 저장소를 클론한 뒤 <code>docker compose up</code>을 실행하면 애플리케이션과 그에 필요한 의존성이 함께 기동되어야 하고, 헬스체크를 통과하고 나면 곧바로 API를 호출할 수 있어야 한다. 실패하더라도 어떤 서비스가 아직 준비되지 않았는지 로그와 상태만 보고 즉시 알 수 있어야 한다.</p>
        <p>여기서 “필요한”이라는 단어가 중요하다. 프로덕션 인프라의 모든 요소를 로컬에서 그대로 재현할 필요는 없다. 개발 중인 기능이 실제로 필요로 하는 데이터베이스, 메시지 브로커, 캐시처럼 계약을 검증하는 데 필요한 것부터 우선적으로 포함시키고, Observability 플랫폼이나 대규모 분석 시스템 같은 것들은 목(mock)이나 공유 개발 환경으로 대체할 수 있다.</p>
        <h2>1. Compose를 실행 가능한 Runbook으로 만들기</h2>
        <p>Compose 파일은 컨테이너 목록이 아니라, 서비스 간의 관계를 기술하는 실행 가능한 문서다. 포트, 환경 변수, 볼륨뿐 아니라 기동 순서와 준비 상태(readiness)까지 드러내야 한다. 컨테이너가 실제로 시작됐는지보다 중요한 건, 정말로 요청을 받을 준비가 되었는지다.</p>
        <h3>예시: 의존성과 헬스체크를 선언한 Compose 파일</h3>
        <pre><code>{`services:
  api:
    build:
      context: .
      target: development
    command: npm run dev
    ports: ["3000:3000"]
    volumes:
      - .:/app
      - node_modules:/app/node_modules
    environment:
      DATABASE_URL: postgres://app:app@db:5432/app
      REDIS_URL: redis://redis:6379
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: app
      POSTGRES_DB: app
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app -d app"]
      interval: 3s
      timeout: 3s
      retries: 10

  redis:
    image: redis:7-alpine
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 3s
      timeout: 3s
      retries: 10

volumes:
  node_modules:`}</code></pre>
        <p>애플리케이션은 데이터베이스의 포트가 열리기만을 기다리는 게 아니라, 실제로 연결 가능한 상태가 될 때까지 기다린다. 이는 개발 중 의존 서비스의 기동이 느릴 때 불필요한 재시작을 줄여준다. 다만 애플리케이션 자체도 연결 실패 시 재시도할 수 있어야 한다 — Compose의 기동 순서 제어가 런타임 복구 전략을 대신해주지는 않는다.</p>
        <h2>2. 개발용 이미지와 배포용 이미지를 분리하기</h2>
        <p>개발용 컨테이너는 코드 변경을 즉시 반영하고 디버거와 테스트 도구를 포함해야 한다. 반면 배포용 이미지는 작고, 재현 가능하며, 실행에 필요한 것만 담아야 한다. 하나의 이미지로 두 목적을 억지로 겸하게 하면 로컬 개발은 느려지고 프로덕션 이미지는 불필요하게 커진다.</p>
        <p>멀티스테이지 빌드를 쓰면 의존성 설치와 빌드 단계를 재사용하면서도 최종 이미지는 작게 유지할 수 있다. 로컬에서는 development 타겟을 선택하고, CI와 프로덕션에서는 production 타겟만 사용한다. 이 단계에서 런타임 사용자와 파일 권한까지 선언해두면 개발 환경과 프로덕션 환경 사이의 간극을 좁히는 데 도움이 된다.</p>
        <div className="article-note"><strong>피드백 루프</strong><p>컨테이너를 도입했는데도 코드 한 줄을 바꾼 결과를 보기까지 오래 걸린다면 그것은 실패다. 소스 볼륨 마운트, 파일 감시 제외 규칙, 의존성 캐싱을 활용해 로컬 피드백 시간을 먼저 측정하라.</p></div>
        <h2>3. 데이터를 버전 관리되는 초기화 프로세스로 만들기</h2>
        <p>개발자마다 데이터베이스 상태가 다르면 같은 버그도 재현하기 어려워진다. 스키마 변경은 마이그레이션으로, 최소한의 참조 데이터는 시드 스크립트로 관리하는 것이 가장 좋다. “누군가의 덤프 파일”에 의존하면 민감 정보 노출 위험이 커지고, 환경을 다시 구성하는 비용도 시간이 지날수록 늘어난다.</p>
        <p>초기화 과정은 멱등(idempotent)하게 만들어야 한다. 컨테이너 볼륨을 지운 뒤뿐 아니라 기존 데이터 위에서도 안전하게 실행되어야 한다. 테스트 데이터와 로컬 수동 검증용 데이터는 목적이 다르므로, 작고 빠른 fixture와 가독성 좋은 샘플 데이터는 분리해 관리하는 것이 좋다.</p>
        <h2>4. 비밀 값은 이미지와 저장소 밖에 두기</h2>
        <p>편의를 위해 API 키를 Compose 파일이나 Dockerfile에 넣으면 이미지 레이어와 Git 히스토리에 오랫동안 남게 된다. 기본값이 안전한 <code>.env.example</code>을 제공하고, 실제 개인 키는 로컬 환경 변수나 시크릿 관리자(secrets manager)에서 주입하라. 로컬 개발 전용으로 권한과 사용량이 제한된 별도의 키를 쓰는 것도 좋다.</p>
        <p>같은 원칙이 빌드에도 적용된다. 프라이빗 패키지 레지스트리 토큰처럼 빌드 시점에만 필요한 값은 BuildKit secret으로 전달해 최종 이미지에 남지 않도록 할 수 있다. 시크릿 관리의 목표는 개발자를 불편하게 만드는 것이 아니라, 안전한 방법을 가장 쉬운 방법으로 만드는 것이다.</p>
        <h2>5. CI에서 같은 계약을 다시 검증하기</h2>
        <p>로컬 Compose 환경은 CI에서도 가치가 있다. 유닛 테스트만으로 애플리케이션을 검증하는 대신, 실제 데이터베이스와 메시지 브로커를 포함한 동일한 구성으로 통합 테스트를 실행할 수 있다. 다만 CI에서도 속도는 중요하므로, 모든 테스트를 컨테이너 안에서 실행할 필요는 없다.</p>
        <p>권장하는 흐름은 빠른 유닛 테스트를 먼저 실행한 뒤, 변경된 계약의 영향을 받는 통합 테스트를 이어서 실행하는 것이다. 이미지 빌드와 취약점 스캔은 배포 전 단계에서 이뤄진다. 핵심은 로컬, CI, 프로덕션 설정 파일을 완전히 동일하게 만드는 것이 아니라, 공통의 계약을 공유하면서 환경별 차이는 명시적으로 드러내는 것이다.</p>
        <h2>개발 환경 체크리스트</h2>
        <ul>
          <li>새로 합류한 개발자가 한두 개의 명령어로 서비스를 실행할 수 있는가?</li>
          <li>의존 서비스의 준비 상태와 실패 원인이 눈에 보이는가?</li>
          <li>코드 변경 이후 피드백 시간이 충분히 짧은가?</li>
          <li>스키마, 시드 데이터, 환경 변수에 대한 계약이 저장소에서 관리되고 있는가?</li>
          <li>비밀 값이 이미지, 로그, 커밋 히스토리 밖에 머무르는가?</li>
          <li>CI가 로컬과 동일한 핵심 통합 계약을 검증하는가?</li>
        </ul>
        <p>컨테이너화된 환경의 목적은 개발자를 프로덕션에 가두는 것이 아니다. 누구나 같은 출발점에서 빠르게 실험하고, 문제가 생겼을 때 같은 상태를 재현할 수 있게 하는 것이다. 환경을 제품의 일부로 대하기 시작하는 순간, 컨테이너는 단순한 런타임 도구를 넘어 팀의 개발자 경험을 떠받치는 기반이 된다.</p>
        <div className="article-note"><strong>저장소 내 추가 자료</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/local-dev.md" target="_blank" rel="noreferrer">docs/architecture/local-dev.md</a> — LocalStack을 포함한 전체 로컬 개발 Compose 구성 · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/container.md" target="_blank" rel="noreferrer">docs/architecture/container.md</a> — 이 글이 전제하는 Dockerfile/멀티스테이지 빌드 컨벤션
        </p></div>
      </>
    ),
  },
};

export default function ContainerizedDevelopmentExperience() {
  const { locale } = useLocale();
  const c = content[locale];

  return (
    <PostLayout slug="containerized-development-experience" kicker={c.kicker} title={c.title} lede={c.lede}>
      {c.body}
    </PostLayout>
  );
}
