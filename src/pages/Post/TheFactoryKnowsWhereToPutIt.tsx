import PostLayout from '../../components/PostLayout';
import { useLocale } from '../../lib/locale';
import type { MetaFunction } from 'react-router';
import { createPostMeta } from '../../lib/seo';

export const meta: MetaFunction = () => createPostMeta('the-factory-knows-where-to-put-it');

const content = {
  en: {
    kicker: 'DDD · Architecture',
    title: (
      <>
        The Factory<br /><em>Knows Where to Put It</em>
      </>
    ),
    lede: "Two codebases, written years apart, generate an Aggregate's ID in two different places. The instinct is to ask which one actually follows Domain-Driven Design. The book itself has a more specific — and more interesting — answer than either.",
    body: (
      <>
        <p>One codebase generates an Aggregate's identifier inside the Aggregate's own constructor — a plain UUID call, no dependency on anything outside the Domain layer. Another generates the identifier by calling out to a Repository method first, in the Application layer, then hands the already-generated ID into a Factory that builds the Aggregate. Same underlying operation — a UUID v4 with the hyphens stripped, nothing more exotic than that — done in two structurally different places. The natural question is which one is "correct" Domain-Driven Design. That question turns out to have a specific, citable answer, and it isn't the one either codebase's own convention implies.</p>
        <h2>The Two Answers, Side by Side</h2>
        <p>The constructor version reads like this — the Aggregate is complete and self-sufficient the moment it exists, ID included:</p>
        <pre><code>{`class Order {
  readonly orderId: string
  constructor(params: { orderId?: string; ... }) {
    this.orderId = params.orderId ?? generateId()
  }
}`}</code></pre>
        <p>The Factory version routes the same value through an extra hop — Application asks Infrastructure for an ID, then hands it to a Factory:</p>
        <pre><code>{`// application layer
const account = accountFactory.create({
  ...command,
  id: await accountRepository.newId(),
})`}</code></pre>
        <p>Both produce the exact same kind of value. Neither touches a database to do it — <code>newId()</code> turns out to be nothing more than <code>uuid.v4()</code> under the hood, wrapped in a Repository method for no reason the code itself explains. On the surface, the constructor version looks leaner, and it's tempting to read the Factory version as a codebase that simply hasn't caught up.</p>
        <h2>What the Book Actually Says</h2>
        <p>Eric Evans' <em>Domain-Driven Design</em> (2003) addresses this directly, in the chapter on Factories, under a section asking exactly this question — where does the responsibility for assigning identity belong:</p>
        <blockquote><p>"When the program is assigning an identifier, the Factory is a good place to control it. Although the actual generation of a unique tracking id is typically done by a database 'sequence' or other infrastructure mechanism, the Factory knows what to ask for and where to put it."</p></blockquote>
        <p>That is, close to verbatim, the second codebase's shape: a Factory that doesn't generate the identifier itself, but knows to ask an outside mechanism for one and knows where it goes once it arrives. The book doesn't describe the constructor-does-it-all version as the default at all — the Factory-mediated version is the one it actually walks through.</p>
        <div className="article-note"><strong>Why this isn't a close call</strong><p>It would be one thing if the book were ambiguous and either reading were defensible. It isn't ambiguous here — this passage exists specifically to answer "who assigns the identifier," and the answer given is Factory-orchestrated, infrastructure-delegated generation. A codebase that does exactly that isn't behind a convention; it's closer to what was actually written.</p></div>
        <h2>Why the Original Answer Pointed at Infrastructure</h2>
        <p>The reason becomes clear from the rest of the passage: in 2003, "the actual generation of a unique tracking id" meant, in the overwhelming majority of real systems, a database sequence — an auto-incrementing counter the database itself owned and handed out on request. There was no way to get that value without asking the database for it, which meant there was no way to write a self-sufficient constructor the way the first codebase's UUID version does. The Factory's job, as the book frames it, was specifically to hide that infrastructure round-trip from the rest of the domain model — the Factory "knows what to ask for," so nothing else has to.</p>
        <h2>What Changed the Calculus</h2>
        <p>A UUID doesn't have this problem. Generating one requires no coordination with anything external — no sequence to increment, no round trip, no shared counter to protect from collisions. The entire reason the book routes identity assignment through a Factory talking to an outside mechanism stops applying the moment the identifier no longer needs an outside mechanism at all. A constructor calling a UUID function directly isn't skipping a step DDD requires; it's a simplification that only became available once the identifier stopped depending on infrastructure to exist.</p>
        <div className="article-note"><strong>The general shape of this</strong><p>A design rule written to solve a specific technical constraint often keeps being followed after the constraint itself disappears — not because anyone re-evaluated it and chose to keep it, but because the pattern outlived the reason for it and nobody had occasion to ask why it was there. The Factory-mediated version isn't wrong; it's a faithful implementation of guidance written for a world where identity generation was, definitionally, an infrastructure concern. It just never got the chance to notice that, for this particular kind of identifier, that world had already changed.</p></div>
        <h2>Neither Codebase Was Actually Wrong</h2>
        <p>The Factory-mediated codebase is doing precisely what the foundational text describes for program-assigned identity. The constructor-only codebase is doing something the text never explicitly rules out and that later became simpler to justify, once UUIDs made the infrastructure hop optional rather than required. What looked, at first glance, like one codebase following a rule and the other having drifted from it turns out to be neither — one inherited a pattern built for a constraint that no longer exists, and the other quietly stopped needing it.</p>
        <div className="article-note"><strong>Further reading</strong><p>
          Eric Evans, <em>Domain-Driven Design: Tackling Complexity in the Heart of Software</em> (Addison-Wesley, 2003), Chapter 6, "Factories" · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/aggregate-id.md" target="_blank" rel="noreferrer">backend-service-playbook/docs/architecture/aggregate-id.md</a> — the constructor version · <a href="https://github.com/kyhsa93/nestjs-rest-cqrs-example/blob/main/src/account/domain/AccountFactory.ts" target="_blank" rel="noreferrer">nestjs-rest-cqrs-example/AccountFactory.ts</a> — the Factory-mediated version
        </p></div>
      </>
    ),
  },
  ko: {
    kicker: 'DDD · Architecture',
    title: (
      <>
        Factory는<br /><em>어디에 넣을지 알고 있었다</em>
      </>
    ),
    lede: '몇 년의 시차를 두고 작성된 두 코드베이스가, Aggregate의 ID를 서로 다른 자리에서 생성한다. 본능적으로 어느 쪽이 진짜 DDD를 따르는지 묻게 된다. 그런데 원저 자체는 둘 중 어느 쪽 코드베이스의 관습보다도 더 구체적이고 흥미로운 답을 갖고 있었다.',
    body: (
      <>
        <p>한 코드베이스는 Aggregate의 식별자를 Aggregate 자신의 생성자 안에서 만든다 — 평범한 UUID 호출, Domain 계층 바깥의 그 무엇에도 의존하지 않는다. 다른 코드베이스는 먼저 Application 계층에서 Repository 메서드를 호출해 식별자를 받아온 뒤, 이미 생성된 그 ID를 Aggregate를 조립하는 Factory에 건넨다. 같은 연산 — 하이픈을 뺀 UUID v4, 그 이상도 이하도 아니다 — 이 구조적으로 다른 두 자리에서 이루어진다. 자연스러운 질문은 어느 쪽이 "올바른" Domain-Driven Design이냐는 것이다. 이 질문에는 구체적이고 인용 가능한 답이 있는데, 그 답은 두 코드베이스 각자의 관습이 암시하는 것과는 다르다.</p>
        <h2>나란히 놓은 두 개의 답</h2>
        <p>생성자 버전은 이렇게 읽힌다 — Aggregate는 존재하는 순간 이미 완전하고 자기 충족적이다, ID를 포함해서:</p>
        <pre><code>{`class Order {
  readonly orderId: string
  constructor(params: { orderId?: string; ... }) {
    this.orderId = params.orderId ?? generateId()
  }
}`}</code></pre>
        <p>Factory 버전은 같은 값을 한 단계 더 거쳐 보낸다 — Application이 Infrastructure에게 ID를 요청하고, 그걸 Factory에 건넨다:</p>
        <pre><code>{`// application layer
const account = accountFactory.create({
  ...command,
  id: await accountRepository.newId(),
})`}</code></pre>
        <p>둘 다 정확히 같은 종류의 값을 만들어낸다. 어느 쪽도 그걸 위해 데이터베이스를 건드리지 않는다 — <code>newId()</code>는 알고 보면 그냥 <code>uuid.v4()</code>를 Repository 메서드로 감싼 것뿐이고, 코드 자체가 그 이유를 설명하지 않는다. 표면적으로는 생성자 버전이 더 군더더기 없어 보이고, Factory 버전을 그저 아직 따라잡지 못한 코드베이스로 읽고 싶은 유혹이 생긴다.</p>
        <h2>원저가 실제로 말하는 것</h2>
        <p>Eric Evans의 <em>Domain-Driven Design</em>(2003)은 Factory를 다루는 장에서, 정확히 이 질문 — 식별자를 배정하는 책임이 어디에 속하는가 — 을 다루는 절에서 이걸 직접 다룬다:</p>
        <blockquote><p>"프로그램이 식별자를 배정하는 경우, Factory가 그것을 통제하기 좋은 자리다. 고유한 추적 ID의 실제 생성은 보통 데이터베이스의 'sequence'나 다른 인프라 메커니즘이 담당하지만, Factory는 무엇을 요청해야 하고 그것을 어디에 넣어야 하는지 알고 있다." (원문: "When the program is assigning an identifier, the Factory is a good place to control it. Although the actual generation of a unique tracking id is typically done by a database 'sequence' or other infrastructure mechanism, the Factory knows what to ask for and where to put it.")</p></blockquote>
        <p>이건 거의 그대로, 두 번째 코드베이스의 형태다: 식별자를 스스로 생성하지는 않지만, 외부 메커니즘에게 하나를 요청해야 한다는 걸 알고, 그게 도착하면 어디로 가야 하는지 아는 Factory. 원저는 생성자가 전부 처리하는 버전을 기본값으로 서술하지 않는다 — 원저가 실제로 상세히 다루는 건 Factory가 중개하는 버전이다.</p>
        <div className="article-note"><strong>왜 이건 애매한 판단이 아닌가</strong><p>원저가 모호해서 둘 중 어느 쪽으로 읽어도 그럴듯한 상황이라면 얘기가 다를 것이다. 여기서는 모호하지 않다 — 이 구절은 정확히 "누가 식별자를 배정하는가"에 답하기 위해 존재하고, 주어진 답은 Factory가 조율하고 인프라에 위임하는 생성이다. 정확히 그렇게 하는 코드베이스는 관습에 뒤처진 게 아니라, 실제로 쓰인 것에 더 가깝다.</p></div>
        <h2>원래의 답이 왜 인프라를 가리켰는가</h2>
        <p>이유는 나머지 구절에서 분명해진다: 2003년에 "고유한 추적 ID의 실제 생성"이란, 압도적 다수의 실제 시스템에서 데이터베이스 sequence를 뜻했다 — 데이터베이스 자신이 소유하고 요청할 때마다 내어주는 자동 증가 카운터. 그 값을 데이터베이스에게 요청하지 않고 얻을 방법은 없었고, 그 말은 첫 번째 코드베이스의 UUID 버전처럼 자기 충족적인 생성자를 쓸 방법이 없었다는 뜻이다. 원저가 서술하는 Factory의 역할은 정확히 그 인프라 왕복을 도메인 모델의 나머지로부터 숨기는 것이었다 — Factory가 "무엇을 요청해야 하는지 알고 있"으니, 다른 무엇도 그럴 필요가 없다.</p>
        <h2>무엇이 계산을 바꿨는가</h2>
        <p>UUID에는 이 문제가 없다. 하나를 생성하는 데는 외부의 그 무엇과도 조율이 필요 없다 — 증가시킬 sequence도, 왕복도, 충돌을 막기 위해 보호해야 할 공유 카운터도 없다. 원저가 식별자 배정을 외부 메커니즘과 대화하는 Factory를 통해 라우팅하는 이유 전체가, 식별자가 더 이상 외부 메커니즘을 전혀 필요로 하지 않는 순간 적용되지 않게 된다. UUID 생성 함수를 직접 호출하는 생성자는 DDD가 요구하는 단계를 건너뛰는 게 아니다 — 식별자가 존재하기 위해 인프라에 의존하는 걸 멈춘 뒤에야 비로소 가능해진 단순화일 뿐이다.</p>
        <div className="article-note"><strong>이것의 일반적인 형태</strong><p>특정 기술적 제약을 풀기 위해 쓰인 설계 규칙은, 그 제약 자체가 사라진 뒤에도 계속 따라지는 경우가 많다 — 누군가 다시 평가해서 유지하기로 결정해서가 아니라, 패턴이 그 존재 이유보다 더 오래 살아남았고 아무도 왜 그게 거기 있는지 물어볼 계기가 없었기 때문이다. Factory가 중개하는 버전은 틀리지 않았다 — 식별자 생성이 정의상 인프라의 관심사였던 세계를 위해 쓰인 지침을 충실히 구현한 것이다. 다만 이 특정 종류의 식별자에 한해서는 그 세계가 이미 바뀌었다는 걸 알아챌 계기가 없었을 뿐이다.</p></div>
        <h2>둘 다 사실은 틀리지 않았다</h2>
        <p>Factory가 중개하는 코드베이스는 프로그램이 배정하는 식별자에 대해 원전이 서술하는 바를 정확히 하고 있다. 생성자만 쓰는 코드베이스는 원전이 명시적으로 배제한 적 없는 무언가를 하고 있고, UUID가 인프라 경유를 필수가 아니라 선택으로 만든 뒤로 정당화하기 더 쉬워졌을 뿐이다. 얼핏 한쪽은 규칙을 따르고 다른 한쪽은 거기서 벗어난 것처럼 보였던 것이, 알고 보면 둘 다 아니었다 — 한쪽은 더 이상 존재하지 않는 제약을 위해 만들어진 패턴을 물려받았고, 다른 한쪽은 조용히 그게 더 이상 필요 없어졌을 뿐이다.</p>
        <div className="article-note"><strong>더 읽을거리</strong><p>
          Eric Evans, <em>Domain-Driven Design: Tackling Complexity in the Heart of Software</em> (Addison-Wesley, 2003), 6장 "Factories" · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/aggregate-id.md" target="_blank" rel="noreferrer">backend-service-playbook/docs/architecture/aggregate-id.md</a> — 생성자 버전 · <a href="https://github.com/kyhsa93/nestjs-rest-cqrs-example/blob/main/src/account/domain/AccountFactory.ts" target="_blank" rel="noreferrer">nestjs-rest-cqrs-example/AccountFactory.ts</a> — Factory 중개 버전
        </p></div>
      </>
    ),
  },
};

export default function TheFactoryKnowsWhereToPutIt() {
  const { locale } = useLocale();
  const c = content[locale];

  return (
    <PostLayout
      slug="the-factory-knows-where-to-put-it"
      kicker={c.kicker}
      title={c.title}
      lede={c.lede}
    >
      {c.body}
    </PostLayout>
  );
}
