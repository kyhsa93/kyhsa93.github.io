const expertise = [
  'TypeScript · Node.js',
  'Go',
  'Docker · Kubernetes',
  'AWS · GCP',
  'CQRS · DDD',
  'Event-driven architecture',
];

const latestPosts = [
  {
    title: '도메인 경계를 찾는 방법',
    summary: '복잡한 요구사항을 Aggregate와 Bounded Context로 정리하는 사고 과정을 기록합니다.',
    date: '2026.07.19',
    tags: ['DDD', 'Architecture'],
    href: '#/posts/finding-domain-boundaries',
  },
  {
    title: '이벤트 기반 시스템의 신뢰성',
    summary: '메시지 전달 실패와 중복 처리에 대응하는 실용적인 패턴을 정리합니다.',
    date: '2026.07.19',
    tags: ['Event-driven', 'Backend'],
    href: '#/posts/reliable-event-driven-systems',
  },
  {
    title: '컨테이너 환경의 개발 경험',
    summary: '로컬 개발부터 배포까지, 팀이 반복 가능한 환경을 만드는 방법을 다룹니다.',
    date: '2026.07.19',
    tags: ['Docker', 'Developer experience'],
    href: '#/posts/containerized-development-experience',
  },
];

const sideProjects = [
  {
    title: 'Fove',
    description: '사주팔자와 mbti를 기반으로 한 운세 테스트 웹앱입니다.',
    status: 'Live',
    href: 'https://kyhsa93.github.io/fove',
  },
  {
    title: 'Event Flow Visualizer',
    description: '이벤트 기반 시스템의 흐름을 더 쉽게 이해하기 위한 시각화 실험입니다.',
    status: 'In progress',
    href: undefined,
  },
  {
    title: 'Service Architecture Notes',
    description: '서비스 설계 과정에서 얻은 패턴과 의사결정을 축적하는 개인 지식 베이스입니다.',
    status: 'In progress',
    href: undefined,
  },
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
            GitHub <span aria-hidden="true"></span>
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
              GitHub 방문 <span aria-hidden="true"></span>
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
            GitHub에서 보기 <span aria-hidden="true"></span>
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
              저장소 열기 <span aria-hidden="true"></span>
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

      <section className="latest-section" id="latest">
        <div className="latest-heading">
          <div>
            <p className="section-kicker">Latest</p>
            <h2>기록하고, 실험합니다.</h2>
          </div>
          <p>설계 과정에서 배운 점과 작은 실험들을 이곳에 차곡차곡 쌓아갑니다.</p>
        </div>

        <div className="latest-grid">
          <div className="post-column">
            <div className="content-label"><span>Writing</span><span>Latest posts</span></div>
            {latestPosts.map((post) => (
              <article className={`post-item${post.href ? ' published' : ''}`} key={post.title}>
                <div className="post-meta"><time>{post.date}</time><span>{post.tags.join(' · ')}</span></div>
                <h3>{post.href ? <a href={post.href}>{post.title}<span aria-hidden="true"></span></a> : post.title}</h3>
                <p>{post.summary}</p>
              </article>
            ))}
            <span className="coming-link">블로그 아카이브 준비 중</span>
          </div>
          <div className="side-project-column">
            <div className="content-label"><span>Lab</span><span>Side projects</span></div>
            {sideProjects.map((project, index) => (
              <article className="side-project" key={project.title}>
                <div className={`project-orb orb-${index + 1}`} aria-hidden="true"><span /></div>
                <div>
                  <p className="project-status"><i />{project.status}</p>
                  <h3>{project.href ? <a href={project.href} target="_blank" rel="noreferrer">{project.title} <span aria-hidden="true"></span></a> : project.title}</h3>
                  <p>{project.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer>
        <p>Let’s build something resilient.</p>
        <a href="https://github.com/kyhsa93" target="_blank" rel="noreferrer">github.com/kyhsa93 </a>
      </footer>
    </main>
  );
}
