import { Link } from 'react-router-dom';

export default function ContainerizedDevelopmentExperience() {
  return (
    <main className="post-page">
      <nav className="post-nav" aria-label="Post navigation">
        <Link to="/" className="brand"><span className="brand-mark">Y</span><span>younghoon</span></Link>
        <Link to="/" className="back-link">← Home</Link>
      </nav>
      <article className="post-content">
        <header className="post-header">
          <p className="section-kicker">Docker · Developer experience</p>
          <h1>컨테이너 환경의<br /><em>개발 경험</em></h1>
          <p className="post-lede">컨테이너의 가치는 배포 환경을 맞추는 데서 끝나지 않습니다. 새로 합류한 개발자도 짧은 시간 안에 실행하고, 안전하게 실험하고, 같은 방식으로 검증할 수 있게 만드는 것이 더 큰 가치입니다.</p>
          <time>2026.07.19 · 11 min read</time>
        </header>
        <div className="article-body">
          <p>“제 로컬에서는 되는데요”라는 말은 대개 코드보다 환경의 계약이 문서화되지 않았다는 신호입니다. 런타임 버전, 데이터베이스 설정, 의존 서비스, 초기 데이터, 실행 순서가 사람의 기억에만 있으면 팀의 개발 속도는 가장 익숙하지 않은 사람의 환경에 맞춰집니다.</p>
          <p>컨테이너는 이 계약을 코드로 옮길 수 있는 좋은 도구입니다. 다만 모든 것을 Dockerfile에 넣는다고 개발 경험이 좋아지는 것은 아닙니다. 빠른 시작, 빠른 변경 반영, 예측 가능한 데이터, 명확한 실패 메시지까지 함께 설계해야 컨테이너 환경이 팀의 마찰을 줄입니다.</p>
          <h2>좋은 로컬 환경의 기준</h2>
          <p>좋은 개발 환경은 문서의 긴 설치 절차보다 하나의 명령에 가깝습니다. 저장소를 받은 뒤 <code>docker compose up</code>으로 애플리케이션과 필수 의존성이 실행되고, 헬스 체크가 통과하면 API를 호출할 수 있어야 합니다. 실패했을 때도 어떤 서비스가 준비되지 않았는지 로그와 상태에서 바로 알 수 있어야 합니다.</p>
          <p>여기서 ‘필수’라는 말이 중요합니다. 로컬에서 운영 환경의 모든 인프라를 복제할 필요는 없습니다. 개발 중인 기능에 필요한 데이터베이스, 메시지 브로커, 캐시처럼 계약을 검증하는 데 필요한 요소를 우선 포함하고, 관측 플랫폼이나 대용량 분석 시스템은 mock이나 공유 개발 환경으로 대체할 수 있습니다.</p>
          <h2>1. Compose를 실행 설명서로 만든다</h2>
          <p>Compose 파일은 컨테이너 목록이 아니라 서비스 간의 관계를 설명하는 실행 가능한 문서입니다. 포트, 환경 변수, 볼륨뿐 아니라 기동 순서와 준비 상태를 드러내야 합니다. 단순히 컨테이너가 시작됐다는 사실보다, 실제로 요청을 받을 준비가 됐는지가 더 중요합니다.</p>
          <h3>예제: 의존성과 헬스 체크를 명시한 Compose</h3>
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
          <p>애플리케이션이 데이터베이스의 포트를 열기만 기다리는 대신, 실제 연결 가능한 상태를 기다리게 했습니다. 개발 중 의존 서비스가 늦게 시작되어도 불필요한 재실행을 줄일 수 있습니다. 단, 애플리케이션 자체도 연결 실패를 재시도할 수 있어야 합니다. Compose의 기동 순서는 런타임 복구 전략을 대체하지 않습니다.</p>
          <h2>2. 개발 이미지와 배포 이미지를 분리한다</h2>
          <p>개발 컨테이너는 코드 변경을 즉시 반영하고 디버거와 테스트 도구를 포함해야 합니다. 반면 배포 이미지는 작고, 재현 가능하며, 실행에 필요한 것만 담아야 합니다. 하나의 이미지를 두 목적에 억지로 맞추면 로컬은 느리고 운영 이미지는 불필요하게 커집니다.</p>
          <p>멀티 스테이지 빌드를 사용하면 의존성 설치와 빌드는 재사용하면서도 최종 이미지를 작게 유지할 수 있습니다. 로컬에서는 development target을 선택하고, CI와 운영에서는 production target만 사용합니다. 런타임 사용자와 파일 권한도 이 단계에서 명시해 두면 개발 환경과 운영 환경의 차이를 줄일 수 있습니다.</p>
          <div className="article-note"><strong>피드백 루프</strong><p>컨테이너를 도입한 뒤에도 코드 한 줄을 바꿨을 때 결과를 확인하는 시간이 길어지면 실패입니다. 소스 볼륨 마운트, 파일 감시 제외 규칙, 의존성 캐시를 통해 로컬 피드백 시간을 먼저 측정하세요.</p></div>
          <h2>3. 데이터는 버전 관리되는 초기화 과정으로 만든다</h2>
          <p>개발 데이터베이스가 사람마다 다르면 같은 버그를 재현하기 어렵습니다. 스키마 변경은 마이그레이션으로, 최소한의 참조 데이터는 seed 스크립트로 관리하는 것이 좋습니다. ‘누군가의 덤프 파일’에 의존하면 민감 정보 노출 위험도 커지고, 시간이 지날수록 환경을 새로 만드는 비용도 커집니다.</p>
          <p>초기화는 멱등하게 만들어야 합니다. 컨테이너 볼륨을 지웠을 때뿐 아니라 기존 데이터 위에서도 안전하게 실행할 수 있어야 합니다. 테스트용 데이터와 로컬 수동 검증용 데이터는 목적이 다르므로, 빠르고 작은 fixture와 읽기 쉬운 sample 데이터를 분리하는 편이 좋습니다.</p>
          <h2>4. 시크릿은 이미지와 저장소 밖에 둔다</h2>
          <p>개발 편의를 위해 API 키를 Compose 파일이나 Dockerfile에 넣으면 이미지 레이어와 Git 기록에 오래 남습니다. 기본값이 안전한 <code>.env.example</code>을 제공하고, 실제 개인 키는 로컬 환경 변수나 비밀 관리 도구에서 주입하세요. 로컬용 키도 권한과 사용량이 제한된 별도 키를 쓰는 편이 좋습니다.</p>
          <p>같은 원칙은 빌드에도 적용됩니다. private package registry 토큰처럼 빌드 시에만 필요한 값은 BuildKit secret으로 전달하면 최종 이미지에 남기지 않을 수 있습니다. 시크릿 관리의 목표는 개발자가 불편해지는 것이 아니라, 안전한 경로가 가장 쉬운 경로가 되게 만드는 것입니다.</p>
          <h2>5. CI에서 같은 계약을 다시 검증한다</h2>
          <p>로컬 Compose 환경은 CI에서도 가치가 있습니다. 애플리케이션을 단위 테스트만으로 검증하는 데 그치지 않고, 실제 데이터베이스와 메시지 브로커를 포함한 통합 테스트를 같은 설정으로 실행할 수 있습니다. 단, CI는 속도도 중요하므로 모든 테스트를 컨테이너로 돌릴 필요는 없습니다.</p>
          <p>권장하는 흐름은 빠른 단위 테스트를 먼저 실행하고, 변경된 계약에 영향을 받는 통합 테스트를 이어서 실행하는 것입니다. 이미지 빌드와 취약점 검사는 배포 전 단계에서 수행합니다. 로컬·CI·운영의 파일을 완전히 동일하게 만들기보다, 공통된 계약을 공유하고 환경별 차이는 명시적으로 드러내는 것이 핵심입니다.</p>
          <h2>개발 환경 체크리스트</h2>
          <ul>
            <li>새 개발자가 한두 개의 명령으로 서비스를 실행할 수 있는가?</li>
            <li>의존 서비스의 준비 상태와 실패 원인이 눈에 보이는가?</li>
            <li>코드 변경 후 피드백 시간이 충분히 짧은가?</li>
            <li>스키마·초기 데이터·환경 변수의 계약이 저장소에서 관리되는가?</li>
            <li>시크릿이 이미지, 로그, 커밋 기록에 남지 않는가?</li>
            <li>CI가 로컬과 같은 핵심 통합 계약을 검증하는가?</li>
          </ul>
          <p>컨테이너 환경의 목적은 개발자를 운영 환경에 가두는 것이 아닙니다. 누구나 같은 출발점에서 빠르게 실험하고, 문제가 생겼을 때 같은 상태를 재현할 수 있게 하는 것입니다. 환경을 제품의 일부처럼 다루기 시작하면, 컨테이너는 단순한 실행 도구를 넘어 팀의 개발 경험을 지탱하는 기반이 됩니다.</p>
        </div>
        <footer className="post-footer">
          <Link to="/">← 메인으로 돌아가기</Link>
          <a href="https://github.com/kyhsa93/backend-service-playbook" target="_blank" rel="noreferrer">Backend Service Playbook ↗</a>
        </footer>
      </article>
    </main>
  );
}
