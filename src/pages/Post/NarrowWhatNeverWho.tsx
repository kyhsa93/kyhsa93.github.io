import PostLayout from '../../components/PostLayout';
import { useLocale, localeFromPathname } from '../../lib/locale';
import type { MetaFunction } from 'react-router';
import { createPostMeta } from '../../lib/seo';

export const meta: MetaFunction = ({ location }) =>
  createPostMeta('narrow-what-never-who', localeFromPathname(location.pathname));

const content = {
  en: {
    kicker: 'LLM · Architecture',
    title: (
      <>
        Narrow What,<br /><em>Never Who</em>
      </>
    ),
    lede: "When an LLM turns a free-text question into a database filter, the filter should be able to narrow what comes back and nothing else. A question about an account's own transaction history is answered that way here: who the data belongs to is wired in before the model's output ever enters the call.",
    body: (
      <>
        <p>If an LLM translates a user's question into a query, how do you make sure a crafted question can't reach someone else's data? The rule I work from: an LLM may narrow what an authorized user sees, but must never decide who is authorized. It came out of removing an LLM feature that let a model's read of user-controlled text influence a security-relevant judgment. This is what building on that rule, instead of just avoiding its violation, looks like: a filter type with no field for the owner at all, in my example project that implements the same backend design in five languages side by side.</p>
        <h2>Three Steps, Only Two of Which Touch an LLM</h2>
        <p>The feature is on Account BC: a free-text question over an account's own transaction history, such as <code>"How much did I deposit this month?"</code>, answered through a structured-data RAG pipeline. "Structured-data" because Retrieve here is an SQL query, not a vector-embedding search over a document store, which is the more usual shape people mean by RAG.</p>
        <ol>
          <li><strong>Translate</strong>: an LLM turns the question into a structured filter (transaction <code>type</code>, <code>fromDate</code>, <code>toDate</code>).</li>
          <li><strong>Retrieve</strong>: an ordinary repository query runs that filter. No LLM involved.</li>
          <li><strong>Compose</strong>: a second LLM call writes the answer, grounded only in what was retrieved.</li>
        </ol>
        <pre><code>{`// application/service/nl-transaction-query-translator.ts — the interface
export interface TransactionFilter {
  readonly type?: TransactionType
  readonly fromDate?: string
  readonly toDate?: string
}
export abstract class NlTransactionQueryTranslator {
  abstract translate(question: string): Promise<TransactionFilter>
}

// application/service/nl-transaction-answer-composer.ts — the interface
export abstract class NlTransactionAnswerComposer {
  abstract compose(question: string, transactions: TransactionSummaryResult[]): Promise<string>
}`}</code></pre>
        <p>All orchestration lives in the Query Handler, in the Application layer, never in the Controller, which only wraps the HTTP request into this Query and dispatches it:</p>
        <pre><code>{`// application/query/ask-transaction-history-query-handler.ts
const filter = await this.translator.translate(query.question)

const { transactions, count } = await this.accountQuery.getTransactions({
  accountId: query.accountId,
  ownerId: query.requesterId, // always the authenticated caller —
                               // never a value from \`filter\`
  type: filter.type,
  fromDate: filter.fromDate,
  toDate: filter.toDate,
  take: 50,
  page: 0
})

const answer = await this.composer.compose(query.question, transactions)
return { answer, matchedCount: count }`}</code></pre>
        <h2>Where the Guardrail Lives</h2>
        <p><code>TransactionFilter</code> has no <code>ownerId</code> field. It isn't "validated to ignore it if present"; it structurally cannot carry one. The translated filter can only ever narrow <em>what</em> comes back; <em>whose</em> account gets queried is wired from the authenticated requester before the LLM's output ever enters the call. Worst case on a bad translation: an inaccurate answer about the requester's own data. There is no path from a crafted question to someone else's transactions.</p>
        <div className="article-note"><strong>"RAG" here means retrieval by SQL, not by embedding</strong><p>The canonical RAG shape retrieves via vector-similarity search over an unstructured document corpus. This pipeline's retrieval step is a plain, parameterized database query, the same "structured-data RAG" or "RAG over a database" pattern common in practice for chatting with your own tabular data. The Retrieve → Augment → Generate shape is identical either way; only the retrieval mechanism differs.</p></div>
        <h2>Proof, Not Assertion</h2>
        <p>A design principle is only as good as what happens when you run it. This one was tested against a locally running Ollama instance: deposits of 50,000 and 10,000 KRW, a withdrawal of 3,000, then questions:</p>
        <table>
          <thead><tr><th>Question / action</th><th>Result</th></tr></thead>
          <tbody>
            <tr><td>"How much have I deposited in total?"</td><td>"You have deposited a total of 60,000 KRW." (matchedCount 2), correct</td></tr>
            <tr><td>"How much did I withdraw?"</td><td>"You withdrew 3000 KRW..." (matchedCount 1), correct</td></tr>
            <tr><td>"이번 달에 얼마 입금했어?" (Korean, relative date)</td><td>correct date filter, but the answer came back in English</td></tr>
            <tr><td>a different owner asks about this account</td><td>HTTP 404, isolated</td></tr>
            <tr><td>empty question</td><td>HTTP 400, rejected</td></tr>
          </tbody>
        </table>
        <div className="article-note"><strong>One honest miss</strong><p><code>qwen2.5:1.5b</code> kept answering in English for a Korean question, despite an explicit system-prompt instruction to match the question's language. The retrieval and the arithmetic were both right. This is a small model being a small model, not a pipeline bug, and it's noted in the code as such rather than ignored or worked around with a translation step that would have been out of scope for this example.</p></div>
        <h2>Five Languages, One Invariant</h2>
        <p>Once the reference implementation was live-verified, the same design was ported to the other four stacks, each one told explicitly to follow its own existing query/CQRS convention rather than copy the reference's syntax. Java and Kotlin Spring Boot already used a plain service orchestrator for queries, not a Handler+Bus, so that's what they got, with the identical guardrail wired the same way underneath.</p>
        <table>
          <thead><tr><th>Language</th><th>Notable</th></tr></thead>
          <tbody>
            <tr><td>nestjs</td><td>reference; live-verified against real Ollama</td></tr>
            <tr><td>Go</td><td>first push failed CI (stale OpenAPI docs); self-diagnosed, fixed in a follow-up commit</td></tr>
            <tr><td>Java Spring Boot</td><td>exposed the Ollama HTTP client as a bean, unlike the earlier LLM refund-reason classifier, which made both new services independently mockable</td></tr>
            <tr><td>Kotlin Spring Boot</td><td>hit a Kotlin compile error (two files redeclaring identically-named private top-level classes); found and fixed by nesting them</td></tr>
            <tr><td>FastAPI</td><td>no per-language architecture doc for this pattern existed yet, so the write-up landed in layer-architecture.md instead</td></tr>
          </tbody>
        </table>
        <p>The mechanism differs everywhere: a query bus here, a plain service there, Kotlin's package-private rules forcing a redesign of two small classes. The guardrail (<code>ownerId</code> from the authenticated caller, never from the model) didn't move once. That's usually the tell for whether a design is a principle or just an implementation detail dressed up as one: it survives being rewritten in a language that works nothing like the original.</p>
        <div className="article-note"><strong>Further reading</strong><p>
          <a href="/posts/the-fraud-signal-that-trusted-the-fraudster">The Fraud Signal That Trusted the Fraudster</a> (the removal this feature's guardrail is a direct answer to) · <a href="/posts/same-architecture-five-languages">Same Architecture, Five Languages</a> (the same cross-language comparison, applied to another feature) · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/domain-service.md" target="_blank" rel="noreferrer">docs/architecture/domain-service.md</a> (the full write-up, with real code from the reference implementation)
        </p></div>
      </>
    ),
  },
  ko: {
    kicker: 'LLM · Architecture',
    title: (
      <>
        무엇은 좁히고,<br /><em>누구는 정하지 않는다</em>
      </>
    ),
    lede: 'LLM이 자유로운 질문을 DB 필터로 바꿀 때, 그 필터로는 무엇이 돌아올지만 좁힐 수 있어야 한다. 계좌 주인이 자기 거래 내역을 두고 던진 질문에 이 방식으로 답했다. 누구의 거래인지는 모델 출력이 호출에 들어가기 전에 이미 정해져 있다.',
    body: (
      <>
        <p>LLM이 사용자 질문을 쿼리로 옮겨 준다면, 교묘하게 짠 질문이 남의 데이터에 닿지 않게 하려면 어떻게 해야 할까. 내가 기준으로 삼는 규칙은 이렇다. LLM은 권한 있는 사용자가 무엇을 볼지 좁힐 수는 있어도, 누가 권한을 가졌는지 정해서는 안 된다. 사용자가 마음대로 쓸 수 있는 텍스트를 모델이 읽고 그 해석이 보안 판단에 영향을 주던 LLM 기능을 걷어 내면서 남은 규칙이다. 이번에는 그 규칙을 피해 가는 데서 그치지 않고, 규칙을 바닥에 깔고 기능을 하나 만들어 봤다. 같은 백엔드 설계를 5개 언어로 나란히 구현해 둔 내 예제 프로젝트에서, 소유자 필드가 아예 없는 필터 타입으로 만들었다.</p>
        <h2>세 단계 중 LLM은 두 곳에만 들어간다</h2>
        <p>기능은 Account BC에 있다. <code>"이번 달에 얼마 입금했어?"</code>처럼 자기 거래 내역을 두고 자유롭게 묻는 질문에 구조화 데이터 RAG 파이프라인으로 답한다. 굳이 "구조화 데이터"를 붙인 건 여기서 Retrieve가 SQL 조회이기 때문이다. 흔히 RAG라고 하면 문서 저장소를 벡터 임베딩으로 검색하는 모양을 떠올리는데, 그것과는 다르다.</p>
        <ol>
          <li><strong>번역</strong> 단계에서는 LLM이 질문을 거래 <code>type</code>, <code>fromDate</code>, <code>toDate</code>로 된 구조화 필터로 바꾼다.</li>
          <li><strong>조회</strong> 단계에서는 평범한 repository 쿼리가 그 필터로 데이터를 가져온다. 여기엔 LLM이 끼지 않는다.</li>
          <li><strong>생성</strong> 단계에서는 LLM을 한 번 더 불러, 조회해 온 데이터에만 근거해 답을 쓰게 한다.</li>
        </ol>
        <pre><code>{`// application/service/nl-transaction-query-translator.ts — 인터페이스
export interface TransactionFilter {
  readonly type?: TransactionType
  readonly fromDate?: string
  readonly toDate?: string
}
export abstract class NlTransactionQueryTranslator {
  abstract translate(question: string): Promise<TransactionFilter>
}

// application/service/nl-transaction-answer-composer.ts — 인터페이스
export abstract class NlTransactionAnswerComposer {
  abstract compose(question: string, transactions: TransactionSummaryResult[]): Promise<string>
}`}</code></pre>
        <p>세 단계를 엮는 일은 전부 Application 계층의 Query Handler가 맡는다. Controller는 HTTP 요청을 이 Query로 감싸 보내기만 하고, 흐름은 건드리지 않는다. 핸들러는 다음과 같다.</p>
        <pre><code>{`// application/query/ask-transaction-history-query-handler.ts
const filter = await this.translator.translate(query.question)

const { transactions, count } = await this.accountQuery.getTransactions({
  accountId: query.accountId,
  ownerId: query.requesterId, // 항상 인증된 호출자 —
                               // \`filter\`에서 나온 값은 절대 아님
  type: filter.type,
  fromDate: filter.fromDate,
  toDate: filter.toDate,
  take: 50,
  page: 0
})

const answer = await this.composer.compose(query.question, transactions)
return { answer, matchedCount: count }`}</code></pre>
        <h2>가드레일은 어디에 있나</h2>
        <p><code>TransactionFilter</code>에는 <code>ownerId</code> 필드가 아예 없다. 들어와도 무시하도록 검증하는 게 아니라, 구조상 그 값을 실을 수가 없다. 번역된 필터가 좁힐 수 있는 건 <em>무엇이</em> 돌아오느냐뿐이다. <em>누구의</em> 계좌를 조회할지는 LLM 출력이 호출에 들어가기 전에 인증된 요청자 값으로 이미 채워져 있다.</p>
        <p>번역이 틀려도 최악은 본인 데이터를 두고 엉뚱한 답을 받는 정도다. 질문을 아무리 교묘하게 짜도 남의 거래 내역에 닿을 길이 없다.</p>
        <div className="article-note"><strong>여기서 RAG는 임베딩 대신 SQL로 검색한다</strong><p>교과서적인 RAG는 비정형 문서 더미에서 벡터 유사도로 검색한다. 이 파이프라인의 조회 단계는 파라미터를 바인딩한 평범한 DB 쿼리다. 자기 정형 데이터를 두고 대화하는 기능을 만들 때 실무에서 흔히 쓰는 방식이고, "구조화 데이터 RAG"나 "DB 기반 RAG"라고 부른다. Retrieve → Augment → Generate의 흐름은 똑같고 조회 방식만 다르다.</p></div>
        <h2>직접 돌려 본 결과</h2>
        <p>설계 원칙은 돌려 봤을 때 무엇이 나오느냐로 증명된다. 그래서 로컬에 띄운 Ollama로 확인했다. 50,000원과 10,000원을 입금하고 3,000원을 출금한 다음 질문을 던져 봤다.</p>
        <table>
          <thead><tr><th>질문 / 동작</th><th>결과</th></tr></thead>
          <tbody>
            <tr><td>"How much have I deposited in total?"</td><td>"You have deposited a total of 60,000 KRW." (matchedCount 2), 맞음</td></tr>
            <tr><td>"How much did I withdraw?"</td><td>"You withdrew 3000 KRW..." (matchedCount 1), 맞음</td></tr>
            <tr><td>"이번 달에 얼마 입금했어?" (한국어, 상대 날짜)</td><td>날짜 필터는 맞았지만 답이 영어로 옴</td></tr>
            <tr><td>다른 사용자가 이 계좌에 질문</td><td>HTTP 404, 격리됨</td></tr>
            <tr><td>빈 질문</td><td>HTTP 400, 거부됨</td></tr>
          </tbody>
        </table>
        <div className="article-note"><strong>못 맞춘 것 하나</strong><p><code>qwen2.5:1.5b</code>는 시스템 프롬프트에 질문과 같은 언어로 답하라고 분명히 적어 뒀는데도 한국어 질문에 계속 영어로 답했다. 검색과 계산은 둘 다 맞았다. 파이프라인 버그라기보다 작은 모델의 한계다. 못 본 척 넘기지 않았고, 이 예제 범위를 벗어나는 번역 단계를 붙여 덮지도 않았다. 코드 주석에 그 사실을 그대로 적어 뒀다.</p></div>
        <h2>5개 언어에서 끝까지 안 바뀐 것</h2>
        <p>기준 구현을 Ollama에 붙여 직접 확인한 다음, 나머지 4개 스택으로 같은 설계를 옮겼다. 이때 기준 구현의 문법을 베끼지 말고 각 언어에서 원래 쓰던 쿼리/CQRS 관례를 따르라고 분명히 일러 뒀다. Java와 Kotlin Spring Boot는 원래 쿼리를 Handler+Bus 없이 평범한 서비스 오케스트레이터로 처리하고 있었다. 그래서 그 방식대로 옮겼고, 가드레일은 그 밑에 똑같이 배선했다.</p>
        <table>
          <thead><tr><th>언어</th><th>특이사항</th></tr></thead>
          <tbody>
            <tr><td>nestjs</td><td>기준 구현, 실제 Ollama로 직접 확인</td></tr>
            <tr><td>Go</td><td>첫 푸시에서 CI 실패(OpenAPI 문서 갱신 누락). 원인을 스스로 찾아 다음 커밋에서 고침</td></tr>
            <tr><td>Java Spring Boot</td><td>앞서 만든 LLM 환불 사유 분류기와 달리 Ollama HTTP 클라이언트를 빈으로 꺼내, 새 서비스 둘을 따로 모킹할 수 있게 함</td></tr>
            <tr><td>Kotlin Spring Boot</td><td>Kotlin 컴파일 오류가 남(두 파일이 같은 이름의 private 최상위 클래스를 각자 선언). 클래스를 안쪽으로 중첩해 해결</td></tr>
            <tr><td>FastAPI</td><td>이 패턴을 다룰 언어별 아키텍처 문서가 아직 없어서 layer-architecture.md에 정리</td></tr>
          </tbody>
        </table>
        <p>구현 방식은 언어마다 달랐다. 어디서는 쿼리 버스를 썼고 어디서는 평범한 서비스를 썼다. Kotlin에서는 패키지 프라이빗 규칙 때문에 작은 클래스 두 개를 다시 설계해야 했다. 그래도 <code>ownerId</code>는 인증된 호출자에게서만 받고 모델에게서는 받지 않는다는 가드레일은 한 번도 움직이지 않았다. 어떤 설계가 원칙인지, 원칙처럼 포장한 구현 디테일인지는 보통 여기서 갈린다. 원본과 전혀 다르게 돌아가는 언어로 다시 써도 살아남으면 원칙이다.</p>
        <div className="article-note"><strong>더 볼 자료</strong><p>
          <a href="/posts/the-fraud-signal-that-trusted-the-fraudster">사기꾼을 그대로 믿은 사기 탐지 신호</a>(이 기능의 가드레일이 나오게 된 기능 제거 이야기) · <a href="/posts/same-architecture-five-languages">같은 아키텍처를 5개 언어로</a>(다른 기능을 같은 방식으로 언어별 비교한 글) · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/domain-service.md" target="_blank" rel="noreferrer">docs/architecture/domain-service.md</a>(기준 구현의 코드를 그대로 담은 전체 문서)
        </p></div>
      </>
    ),
  },
};

export default function NarrowWhatNeverWho() {
  const { locale } = useLocale();
  const c = content[locale];

  return (
    <PostLayout slug="narrow-what-never-who" kicker={c.kicker} title={c.title} lede={c.lede}>
      {c.body}
    </PostLayout>
  );
}
