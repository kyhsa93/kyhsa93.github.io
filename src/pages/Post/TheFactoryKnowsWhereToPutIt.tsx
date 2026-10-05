import PostLayout from '../../components/PostLayout';
import { useLocale, localeFromPathname } from '../../lib/locale';
import type { MetaFunction } from 'react-router';
import { createPostMeta } from '../../lib/seo';

export const meta: MetaFunction = ({ location }) =>
  createPostMeta('the-factory-knows-where-to-put-it', localeFromPathname(location.pathname));

const content = {
  en: {
    kicker: 'DDD · Architecture',
    title: (
      <>
        The Factory<br /><em>Knows Where to Put It</em>
      </>
    ),
    lede: "Two codebases, written years apart, generate an Aggregate's ID in two different places. The instinct is to ask which one follows Domain-Driven Design. The book itself has a more specific, and more interesting, answer than either.",
    body: (
      <>
        <p>One codebase generates an Aggregate's identifier inside the Aggregate's own constructor: a plain UUID call, no dependency on anything outside the Domain layer. Another generates the identifier by calling out to a Repository method first, in the Application layer, then hands the already-generated ID into a Factory that builds the Aggregate. Same underlying operation (a UUID v4 with the hyphens stripped, nothing more exotic than that) done in two structurally different places. The natural question is which one is "correct" Domain-Driven Design. That question turns out to have a specific, citable answer, and it isn't the one either codebase's own convention implies.</p>
        <h2>The Two Answers, Side by Side</h2>
        <p>The constructor version reads like this. The Aggregate is complete and self-sufficient the moment it exists, ID included:</p>
        <pre><code>{`class Order {
  readonly orderId: string
  constructor(params: { orderId?: string; ... }) {
    this.orderId = params.orderId ?? generateId()
  }
}`}</code></pre>
        <p>The Factory version routes the same value through an extra hop. Application asks Infrastructure for an ID, then hands it to a Factory:</p>
        <pre><code>{`// application layer
const account = accountFactory.create({
  ...command,
  id: await accountRepository.newId(),
})`}</code></pre>
        <p>Both produce the same kind of value. Neither touches a database to do it; <code>newId()</code> turns out to be nothing more than <code>uuid.v4()</code> under the hood, wrapped in a Repository method for no reason the code itself explains. On the surface, the constructor version looks leaner, and it's tempting to read the Factory version as a codebase that simply hasn't caught up.</p>
        <h2>What the Book Says</h2>
        <p>Eric Evans' <em>Domain-Driven Design</em> (2003) addresses this directly, in the chapter on Factories, under a section asking this very question of where the responsibility for assigning identity belongs:</p>
        <blockquote><p>"When the program is assigning an identifier, the Factory is a good place to control it. Although the actual generation of a unique tracking id is typically done by a database 'sequence' or other infrastructure mechanism, the Factory knows what to ask for and where to put it."</p></blockquote>
        <p>That is, close to verbatim, the second codebase's shape: a Factory that doesn't generate the identifier itself, but knows to ask an outside mechanism for one and knows where it goes once it arrives. The book doesn't describe the constructor-does-it-all version as the default at all. The Factory-mediated version is the one it walks through.</p>
        <div className="article-note"><strong>Why this isn't a close call</strong><p>It would be one thing if the book were ambiguous and either reading were defensible. It isn't ambiguous here. This passage exists specifically to answer "who assigns the identifier," and the answer given is Factory-orchestrated, infrastructure-delegated generation. A codebase that does that isn't behind a convention; it's closer to what was written.</p></div>
        <h2>Why the Original Answer Pointed at Infrastructure</h2>
        <p>The reason becomes clear from the rest of the passage: in 2003, "the actual generation of a unique tracking id" meant, in the overwhelming majority of real systems, a database sequence, an auto-incrementing counter the database itself owned and handed out on request. There was no way to get that value without asking the database for it, which meant there was no way to write a self-sufficient constructor the way the first codebase's UUID version does. The Factory's job, as the book frames it, was specifically to hide that infrastructure round-trip from the rest of the domain model. The Factory "knows what to ask for," so nothing else has to.</p>
        <h2>What Changed the Calculus</h2>
        <p>A UUID doesn't have this problem. Generating one requires no coordination with anything external: no sequence to increment, no round trip, no shared counter to protect from collisions. The entire reason the book routes identity assignment through a Factory talking to an outside mechanism stops applying the moment the identifier no longer needs an outside mechanism at all. A constructor calling a UUID function directly isn't skipping a step DDD requires. It's a simplification that only became available once the identifier stopped depending on infrastructure to exist.</p>
        <div className="article-note"><strong>The general shape of this</strong><p>A design rule written to solve a specific technical constraint often keeps being followed after the constraint itself disappears, not because anyone re-evaluated it and chose to keep it, but because the pattern outlived the reason for it and nobody had occasion to ask why it was there. The Factory-mediated version isn't wrong. It's a faithful implementation of guidance written for a world where identity generation was, definitionally, an infrastructure concern. It just never got the chance to notice that, for this particular kind of identifier, that world had already changed.</p></div>
        <h2>Neither Codebase Was Wrong</h2>
        <p>The Factory-mediated codebase is doing what the foundational text describes for program-assigned identity. The constructor-only codebase is doing something the text never explicitly rules out and that later became simpler to justify, once UUIDs made the infrastructure hop optional rather than required. What looked, at first glance, like one codebase following a rule and the other having drifted from it turns out to be neither. One inherited a pattern built for a constraint that no longer exists, and the other stopped needing it without anyone announcing it.</p>
        <div className="article-note"><strong>Further reading</strong><p>
          Eric Evans, <em>Domain-Driven Design: Tackling Complexity in the Heart of Software</em> (Addison-Wesley, 2003), Chapter 6, "Factories" · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/aggregate-id.md" target="_blank" rel="noreferrer">backend-service-playbook/docs/architecture/aggregate-id.md</a> (the constructor version, in my example project that implements the same backend design in five languages side by side) · <a href="https://github.com/kyhsa93/nestjs-rest-cqrs-example/blob/03408fe273020bb933ee8e94cda8e78751d106c6/src/account/domain/account-factory.ts" target="_blank" rel="noreferrer">nestjs-rest-cqrs-example/account-factory.ts</a> (the Factory-mediated version)
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
    lede: '몇 년 차이를 두고 만든 두 코드베이스가 Aggregate의 ID를 서로 다른 곳에서 만든다. 그러면 어느 쪽이 DDD를 제대로 따르는지 묻고 싶어진다. 그런데 원저에는 두 코드베이스의 관례보다 더 구체적이고 흥미로운 답이 있었다.',
    body: (
      <>
        <p>한 코드베이스는 Aggregate의 식별자를 Aggregate 생성자 안에서 만든다. 평범하게 UUID를 호출할 뿐이고 Domain 계층 바깥의 어떤 것에도 기대지 않는다. 다른 코드베이스는 먼저 Application 계층에서 Repository 메서드를 불러 식별자를 받아 오고, 그렇게 만든 ID를 Aggregate를 조립하는 Factory에 넘긴다. 하는 일은 같다. 하이픈을 뺀 UUID v4일 뿐, 그 이상 특별할 것도 없다. 다만 그 일을 하는 자리가 구조적으로 다르다. 그러면 어느 쪽이 "올바른" Domain-Driven Design인지 궁금해진다. 이 질문에는 인용할 수 있는 구체적인 답이 있고, 그 답은 두 코드베이스의 관례가 암시하는 것과 다르다.</p>
        <h2>두 답을 나란히 놓고 보면</h2>
        <p>생성자 버전은 이렇다. Aggregate는 만들어지는 순간 ID까지 갖춘 완전한 객체가 되고, 다른 무엇에도 기대지 않는다.</p>
        <pre><code>{`class Order {
  readonly orderId: string
  constructor(params: { orderId?: string; ... }) {
    this.orderId = params.orderId ?? generateId()
  }
}`}</code></pre>
        <p>Factory 버전은 같은 값을 한 단계 더 거쳐 보낸다. Application이 Infrastructure에 ID를 달라고 하고, 받은 ID를 Factory에 넘긴다.</p>
        <pre><code>{`// application layer
const account = accountFactory.create({
  ...command,
  id: await accountRepository.newId(),
})`}</code></pre>
        <p>둘이 만드는 값은 같은 종류다. 어느 쪽도 그 값을 위해 데이터베이스에 가지 않는다. 열어 보면 <code>newId()</code>는 <code>uuid.v4()</code>를 Repository 메서드로 감싼 것뿐이고, 왜 그렇게 감쌌는지는 코드 어디에도 설명이 없다. 겉으로는 생성자 버전이 더 깔끔해 보인다. Factory 버전은 그저 시대를 못 따라간 코드베이스라고 보고 싶어진다.</p>
        <h2>원저에는 뭐라고 적혀 있나</h2>
        <p>Eric Evans의 <em>Domain-Driven Design</em>(2003)은 Factory를 다루는 장에서 이 문제를 직접 다룬다. 식별자를 배정하는 책임이 어디에 있어야 하느냐를 묻는 절이 따로 있다.</p>
        <blockquote><p>"프로그램이 식별자를 배정하는 경우, Factory가 그것을 통제하기 좋은 자리다. 고유한 추적 ID를 실제로 만드는 일은 보통 데이터베이스 'sequence'나 다른 인프라 메커니즘이 맡지만, Factory는 무엇을 요청해야 하고 그것을 어디에 넣어야 하는지 알고 있다." (원문 "When the program is assigning an identifier, the Factory is a good place to control it. Although the actual generation of a unique tracking id is typically done by a database 'sequence' or other infrastructure mechanism, the Factory knows what to ask for and where to put it.")</p></blockquote>
        <p>거의 그대로 두 번째 코드베이스의 모양이다. Factory는 식별자를 직접 만들지 않는다. 대신 바깥 메커니즘에 식별자를 요청해야 한다는 것, 그리고 받은 식별자를 어디에 넣을지를 안다. 원저는 생성자가 다 알아서 하는 방식을 기본으로 소개하지 않는다. 원저가 차근차근 설명하는 건 Factory가 중간에서 조율하는 방식이다.</p>
        <div className="article-note"><strong>이건 판단이 갈릴 문제가 아니다</strong><p>원저가 모호해서 어느 쪽으로 읽어도 말이 된다면 얘기가 달라진다. 하지만 이 대목은 모호하지 않다. "누가 식별자를 배정하는가"에 답하려고 쓴 구절이고, 답은 Factory가 조율하고 실제 생성은 인프라에 맡기는 방식이다. 그렇게 하는 코드베이스는 관례에 뒤처진 게 아니다. 오히려 원저에 적힌 것에 더 가깝다.</p></div>
        <h2>원래 답은 왜 인프라를 가리켰나</h2>
        <p>이유는 구절의 나머지 부분을 보면 알 수 있다. 2003년에 "고유한 추적 ID를 실제로 만드는 일"은 대부분의 시스템에서 데이터베이스 sequence를 뜻했다. 데이터베이스가 직접 들고 있다가 요청할 때마다 하나씩 내주는 자동 증가 카운터다. 데이터베이스에 묻지 않고는 그 값을 얻을 수 없었다. 첫 번째 코드베이스의 UUID 버전처럼 혼자서 다 해결하는 생성자는 짤 수가 없었다는 얘기다. 원저가 말하는 Factory의 역할은 그 인프라 왕복을 도메인 모델의 나머지 부분에 드러내지 않는 것이었다. Factory가 "무엇을 요청해야 하는지 알고" 있으니 다른 객체는 몰라도 된다.</p>
        <h2>무엇이 달라졌나</h2>
        <p>UUID에는 이 문제가 없다. 하나 만드는 데 바깥의 누구와도 맞춰 볼 필요가 없다. 올려야 할 sequence도, 왕복도, 충돌을 막으려고 지켜야 할 공유 카운터도 없다. 원저가 식별자 배정을 바깥 메커니즘과 통하는 Factory에 맡긴 이유는, 식별자가 바깥 메커니즘을 아예 필요로 하지 않게 되는 순간 사라진다. UUID 함수를 직접 부르는 생성자는 DDD가 요구하는 단계를 빼먹은 게 아니다. 식별자가 인프라 없이도 만들어질 수 있게 된 뒤에야 가능해진 단순화다.</p>
        <div className="article-note"><strong>더 일반적으로 보면</strong><p>특정한 기술 제약을 풀려고 만든 설계 규칙은 그 제약이 사라진 뒤에도 계속 지켜지는 일이 많다. 누가 다시 따져 보고 유지하기로 해서가 아니다. 패턴이 이유보다 오래 살아남았고, 그게 왜 거기 있는지 물어볼 계기가 아무에게도 없었을 뿐이다. Factory가 중간에서 조율하는 버전도 틀린 건 아니다. 식별자 생성이 당연히 인프라의 일이던 시절의 지침을 충실하게 구현한 것이다. 이런 종류의 식별자에 한해서는 그 시절이 이미 지나갔다는 걸 알아챌 기회가 없었을 뿐이다.</p></div>
        <h2>둘 다 틀리지 않았다</h2>
        <p>Factory가 조율하는 코드베이스는 프로그램이 식별자를 배정할 때 원저가 설명하는 방식을 그대로 따르고 있다. 생성자만 쓰는 코드베이스는 원저가 금지한 적 없는 방식을 쓰고 있고, UUID 덕분에 인프라를 거치는 단계가 필수에서 선택으로 바뀌면서 그 방식을 정당화하기가 쉬워졌다. 처음에는 한쪽은 규칙을 지키고 다른 쪽은 벗어난 것처럼 보였다. 따져 보니 둘 다 아니었다. 한쪽은 이제는 없는 제약을 위해 만든 패턴을 물려받았고, 다른 쪽은 누가 선언하지 않아도 그 패턴이 필요 없게 된 것이다.</p>
        <div className="article-note"><strong>더 볼 자료</strong><p>
          Eric Evans, <em>Domain-Driven Design: Tackling Complexity in the Heart of Software</em> (Addison-Wesley, 2003), 6장 "Factories" · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/aggregate-id.md" target="_blank" rel="noreferrer">backend-service-playbook/docs/architecture/aggregate-id.md</a>(같은 백엔드 설계를 5개 언어로 나란히 구현해 둔 내 예제 프로젝트의 생성자 버전) · <a href="https://github.com/kyhsa93/nestjs-rest-cqrs-example/blob/03408fe273020bb933ee8e94cda8e78751d106c6/src/account/domain/account-factory.ts" target="_blank" rel="noreferrer">nestjs-rest-cqrs-example/account-factory.ts</a>(Factory가 조율하는 버전)
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
