const expertise = [
  'TypeScript · Node.js',
  'Go',
  'Docker · Kubernetes',
  'AWS · GCP',
  'CQRS · DDD',
  'Event-driven architecture',
];

export default function Home() {
  return (
    <main className="home-page">
      <nav className="site-nav" aria-label="Main navigation">
        <a className="brand" href="#top" aria-label="Younghoon home">
          <span className="brand-mark">Y</span>
          <span>younghoon</span>
        </a>
        <div className="nav-links">
          <a href="#work">Work</a>
          <a href="#about">About</a>
          <a href="https://github.com/kyhsa93" target="_blank" rel="noreferrer">
            GitHub <span aria-hidden="true">↗</span>
          </a>
        </div>
      </nav>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow"><span />Backend engineer</p>
          <h1>
            복잡한 시스템을
            <br />
            <em>명확하게</em> 설계합니다.
          </h1>
          <p className="intro">
            TypeScript와 Go를 중심으로, 컨테이너 환경에서 안정적으로
            동작하는 백엔드 시스템을 만듭니다. 도메인 중심의 설계와 이벤트 기반
            아키텍처에 관심이 많습니다.
          </p>
          <div className="cta-row">
            <a className="primary-link" href="#work">프로젝트 보기 <span aria-hidden="true">↓</span></a>
            <a className="text-link" href="https://github.com/kyhsa93" target="_blank" rel="noreferrer">
              GitHub 방문 <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>

        <div className="system-card" aria-label="System architecture illustration">
          <div className="system-card-heading">
            <span>system / overview</span>
            <span className="status"><i /> online</span>
          </div>
          <div className="architecture">
            <div className="node client">client</div>
            <div className="connector connector-one" />
            <div className="node api">API</div>
            <div className="connector connector-two" />
            <div className="node service">service</div>
            <div className="connector connector-three" />
            <div className="data-nodes">
              <div className="node database">database</div>
              <div className="node queue">events</div>
            </div>
          </div>
          <p className="system-note">from request to reliable delivery</p>
        </div>
      </section>

      <section className="expertise-section" id="about">
        <p className="section-kicker">What I work with</p>
        <div className="expertise-heading">
          <h2>Practical building blocks<br />for distributed systems.</h2>
          <p>기술은 문제를 해결하기 위한 도구라고 생각합니다. 운영과 확장까지 고려한 선택을 지향합니다.</p>
        </div>
        <ul className="expertise-list">
          {expertise.map((item, index) => (
            <li key={item}><span>0{index + 1}</span>{item}</li>
          ))}
        </ul>
      </section>

      <section className="work-section" id="work">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Open-source project</p>
            <h2>Backend Service Playbook</h2>
          </div>
          <a className="all-link" href="https://github.com/kyhsa93/backend-service-playbook" target="_blank" rel="noreferrer">
            GitHub에서 보기 <span aria-hidden="true">↗</span>
          </a>
        </div>
        <article className="playbook-card">
          <div className="playbook-intro">
            <div className="playbook-icon" aria-hidden="true">
              <span /><span /><span />
            </div>
            <p className="project-label">A practical guide for backend services</p>
            <p className="playbook-description">
              DDD 기반 백엔드 서비스의 설계와 구현 원칙을 한곳에 담았습니다.
              특정 프레임워크에 갇히지 않고, 팀이 일관된 구조로 서비스를 만들 수 있도록 돕습니다.
            </p>
            <a className="playbook-link" href="https://github.com/kyhsa93/backend-service-playbook" target="_blank" rel="noreferrer">
              저장소 열기 <span aria-hidden="true">↗</span>
            </a>
          </div>
          <div className="playbook-details">
            <div className="principle-list">
              <p>Included principles</p>
              <ul>
                <li><span>01</span>Domain-driven design</li>
                <li><span>02</span>Layered architecture</li>
                <li><span>03</span>CQRS &amp; Repository</li>
                <li><span>04</span>Conventions &amp; checklist</li>
              </ul>
            </div>
            <div className="implementation-list">
              <p>Implementation guides</p>
              <div>
                <span>TypeScript <b>NestJS</b></span>
                <span>Go <b>Go</b></span>
                <span>Java <b>Spring Boot</b></span>
                <span>Kotlin <b>Spring Boot</b></span>
                <span>Python <b>FastAPI</b></span>
              </div>
            </div>
          </div>
        </article>
      </section>

      <footer>
        <p>Let’s build something resilient.</p>
        <a href="https://github.com/kyhsa93" target="_blank" rel="noreferrer">github.com/kyhsa93 ↗</a>
      </footer>
    </main>
  );
}
