import PostLayout from '../../components/PostLayout';
import { useLocale } from '../../lib/locale';
import type { MetaFunction } from 'react-router';
import { createPostMeta } from '../../lib/seo';

export const meta: MetaFunction = () => createPostMeta('narrow-what-never-who');

const content = {
  en: {
    kicker: 'LLM · Architecture',
    title: (
      <>
        Narrow What,<br /><em>Never Who</em>
      </>
    ),
    lede: "AskTransactionHistoryQuery answers a free-text question about an account's own transaction history. The filter an LLM produces can only narrow what comes back — who it belongs to is wired in before the model's output ever enters the call.",
    body: (
      <>
        <p><a href="/posts/the-fraud-signal-that-trusted-the-fraudster">The previous post</a> removed an LLM feature that let a model's read of user-controlled text influence a security-relevant judgment, and left behind one rule: an LLM may narrow what an authorized user sees, but must never decide who is authorized. This is what building on that rule, instead of just avoiding its violation, looks like.</p>
        <h2>Three Steps, Only Two of Which Touch an LLM</h2>
        <p>The feature is on Account BC: a free-text question over an account's own transaction history — <code>"How much did I deposit this month?"</code> — answered through a structured-data RAG pipeline. "Structured-data" because Retrieve here is a real SQL query, not a vector-embedding search over a document store, which is the more usual shape people mean by RAG.</p>
        <ol>
          <li><strong>Translate</strong> — an LLM turns the question into a structured filter: transaction <code>type</code>, <code>fromDate</code>, <code>toDate</code>.</li>
          <li><strong>Retrieve</strong> — an ordinary repository query runs that filter. No LLM involved.</li>
          <li><strong>Compose</strong> — a second LLM call writes the answer, grounded only in what was actually retrieved.</li>
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
        <p>All orchestration lives in the Query Handler, in the Application layer — never in the Controller, which only wraps the HTTP request into this Query and dispatches it:</p>
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
        <h2>Where the Guardrail Actually Lives</h2>
        <p><code>TransactionFilter</code> has no <code>ownerId</code> field. Not "validated to ignore it if present" — it structurally cannot carry one. The translated filter can only ever narrow <em>what</em> comes back; <em>whose</em> account gets queried is wired from the authenticated requester before the LLM's output ever enters the call. Worst case on a bad translation: an inaccurate answer about the requester's own data. There is no path from a crafted question to someone else's transactions.</p>
        <div className="article-note"><strong>"RAG" here means retrieval by SQL, not by embedding</strong><p>The canonical RAG shape retrieves via vector-similarity search over an unstructured document corpus. This pipeline's retrieval step is a plain, parameterized database query — the same "structured-data RAG" or "RAG over a database" pattern common in practice for chatting with your own tabular data. The Retrieve → Augment → Generate shape is identical either way; only the retrieval mechanism differs.</p></div>
        <h2>Proof, Not Assertion</h2>
        <p>A design principle is only as good as what happens when you actually run it. This one was tested against a real, locally-running Ollama instance — deposits of 50,000 and 10,000 KRW, a withdrawal of 3,000, then real questions:</p>
        <table>
          <thead><tr><th>Question / action</th><th>Result</th></tr></thead>
          <tbody>
            <tr><td>"How much have I deposited in total?"</td><td>"You have deposited a total of 60,000 KRW." (matchedCount 2) — correct</td></tr>
            <tr><td>"How much did I withdraw?"</td><td>"You withdrew 3000 KRW..." (matchedCount 1) — correct</td></tr>
            <tr><td>"이번 달에 얼마 입금했어?" (Korean, relative date)</td><td>correct date filter, but the answer came back in English</td></tr>
            <tr><td>a different owner asks about this account</td><td>HTTP 404 — isolated</td></tr>
            <tr><td>empty question</td><td>HTTP 400 — rejected</td></tr>
          </tbody>
        </table>
        <div className="article-note"><strong>One honest miss</strong><p><code>qwen2.5:1.5b</code> kept answering in English for a Korean question, despite an explicit system-prompt instruction to match the question's language. The retrieval and the arithmetic were both right — this is a small model being a small model, not a pipeline bug, and it's noted in the code as exactly that rather than quietly ignored or worked around with a translation step that would have been out of scope for this example.</p></div>
        <h2>Five Languages, One Invariant</h2>
        <p>Once the reference implementation was live-verified, the same design was ported to the other four stacks — each one told explicitly to follow its own existing query/CQRS convention rather than copy the reference's syntax. Java and Kotlin Spring Boot already used a plain service orchestrator for queries, not a Handler+Bus — so that's what they got, with the identical guardrail wired the same way underneath.</p>
        <table>
          <thead><tr><th>Language</th><th>Commit</th><th>Notable</th></tr></thead>
          <tbody>
            <tr><td>nestjs</td><td>708c815</td><td>reference; live-verified against real Ollama</td></tr>
            <tr><td>Go</td><td>4814b19</td><td>first push failed CI (stale OpenAPI docs) — self-diagnosed, fixed in a follow-up commit</td></tr>
            <tr><td>Java Spring Boot</td><td>fa209cd</td><td>exposed the Ollama HTTP client as a bean, unlike the earlier classifier — made both new services independently mockable</td></tr>
            <tr><td>Kotlin Spring Boot</td><td>77d0f9f</td><td>hit a real Kotlin compile error (two files redeclaring identically-named private top-level classes) — found and fixed by nesting them</td></tr>
            <tr><td>FastAPI</td><td>aca6a3a</td><td>no per-language architecture doc for this pattern existed yet — the write-up landed in layer-architecture.md instead</td></tr>
          </tbody>
        </table>
        <p>The mechanism differs everywhere — a query bus here, a plain service there, Kotlin's package-private rules forcing a real redesign of two small classes. The guardrail — <code>ownerId</code> from the authenticated caller, never from the model — didn't move once. That's usually the tell for whether a design is actually a principle or just an implementation detail dressed up as one: it survives being rewritten in a language that works nothing like the original.</p>
        <div className="article-note"><strong>Further reading</strong><p>
          <a href="/posts/the-fraud-signal-that-trusted-the-fraudster">The Fraud Signal That Trusted the Fraudster</a> — the removal this feature's guardrail is a direct answer to · <a href="/posts/same-architecture-five-languages">Same Architecture, Five Languages</a> — the same cross-language comparison, applied to an earlier feature · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/domain-service.md" target="_blank" rel="noreferrer">docs/architecture/domain-service.md</a> — the full write-up, with real code from the reference implementation
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
    lede: 'AskTransactionHistoryQuery는 계좌 본인의 거래 내역에 대한 자유 텍스트 질문에 답한다. LLM이 만든 필터는 무엇이 돌아올지만 좁힐 수 있을 뿐, 그게 누구의 것인지는 모델의 출력이 호출에 들어가기도 전에 이미 배선되어 있다.',
    body: (
      <>
        <p><a href="/posts/the-fraud-signal-that-trusted-the-fraudster">이전 글</a>은 사용자가 통제하는 텍스트를 모델이 읽고 그 결과가 보안과 직결된 판단에 영향을 주는 LLM 기능을 제거하면서 규칙 하나를 남겼다: LLM은 인가된 사용자가 무엇을 보게 될지 좁힐 수는 있지만, 누구에게 권한이 있는지를 결정해서는 안 된다는 것. 이번 글은 그 위반을 피하는 데서 그치지 않고, 그 규칙 위에 실제로 무언가를 지으면 어떤 모습이 되는지를 보여준다.</p>
        <h2>세 단계, 그중 LLM이 관여하는 건 두 곳</h2>
        <p>이 기능은 Account BC에 있다: 계좌 본인의 거래 내역에 대한 자유 텍스트 질문 — <code>"이번 달에 얼마 입금했어?"</code> — 을 구조화 데이터 RAG 파이프라인으로 답한다. "구조화 데이터"라고 부르는 이유는, 여기서 Retrieve가 문서 저장소에 대한 벡터 임베딩 검색이 아니라 실제 SQL 조회이기 때문이다 — 흔히 RAG라고 하면 떠올리는 형태와는 다르다.</p>
        <ol>
          <li><strong>번역</strong> — LLM이 질문을 구조화된 필터로 바꾼다: 거래 <code>type</code>, <code>fromDate</code>, <code>toDate</code>.</li>
          <li><strong>조회</strong> — 평범한 repository 쿼리가 그 필터로 조회한다. LLM은 전혀 관여하지 않는다.</li>
          <li><strong>생성</strong> — 두 번째 LLM 호출이 실제로 조회된 데이터에만 근거해 답변을 작성한다.</li>
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
        <p>모든 오케스트레이션은 Application 계층의 Query Handler에 있다 — HTTP 요청을 이 Query로 감싸서 던지기만 하는 Controller에는 절대 없다:</p>
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
        <h2>가드레일이 실제로 걸리는 지점</h2>
        <p><code>TransactionFilter</code>에는 <code>ownerId</code> 필드 자체가 없다. "있어도 무시하도록 검증한다"가 아니라, 애초에 그 값을 담을 수 있는 구조가 아니다. 번역된 필터가 좁힐 수 있는 건 오직 <em>무엇이</em> 돌아올지뿐이고, <em>누구의</em> 계좌를 조회할지는 LLM의 출력이 호출에 들어가기도 전에 인증된 요청자로부터 이미 배선돼 있다. 번역이 잘못돼도 최악의 경우는 본인 데이터에 대한 부정확한 답변뿐이다. 조작된 질문으로 타인의 거래에 닿는 경로는 존재하지 않는다.</p>
        <div className="article-note"><strong>여기서 "RAG"는 임베딩이 아니라 SQL로 검색한다는 뜻</strong><p>정석적인 RAG는 비정형 문서 저장소에 대한 벡터 유사도 검색으로 조회한다. 이 파이프라인의 조회 단계는 평범하게 파라미터화된 데이터베이스 쿼리다 — 자기 소유의 정형 데이터를 상대로 대화하는 데 실무에서 흔히 쓰이는 "구조화 데이터 RAG" 혹은 "DB 기반 RAG" 패턴이다. Retrieve → Augment → Generate라는 형태는 어느 쪽이든 동일하고, 다른 건 조회 메커니즘뿐이다.</p></div>
        <h2>주장이 아니라 증거</h2>
        <p>설계 원칙은 실제로 돌려봤을 때 뭐가 나오는지로만 증명된다. 실제로 로컬에서 돌아가는 Ollama에 대고 검증했다 — 50,000원과 10,000원 입금, 3,000원 출금 후, 진짜 질문을 던졌다:</p>
        <table>
          <thead><tr><th>질문 / 동작</th><th>결과</th></tr></thead>
          <tbody>
            <tr><td>"How much have I deposited in total?"</td><td>"You have deposited a total of 60,000 KRW." (matchedCount 2) — 정확</td></tr>
            <tr><td>"How much did I withdraw?"</td><td>"You withdrew 3000 KRW..." (matchedCount 1) — 정확</td></tr>
            <tr><td>"이번 달에 얼마 입금했어?" (한국어, 상대 날짜)</td><td>날짜 필터는 정확, 다만 답변은 영어로 돌아옴</td></tr>
            <tr><td>다른 사용자가 이 계좌에 질문</td><td>HTTP 404 — 격리됨</td></tr>
            <tr><td>빈 질문</td><td>HTTP 400 — 거부됨</td></tr>
          </tbody>
        </table>
        <div className="article-note"><strong>솔직히 인정할 부분 하나</strong><p><code>qwen2.5:1.5b</code>는 질문 언어에 맞추라는 시스템 프롬프트의 명시적 지시에도 한국어 질문에 계속 영어로 답했다. 검색과 계산은 둘 다 정확했다 — 이건 파이프라인의 버그가 아니라 소형 모델이 소형 모델다운 것뿐이다. 조용히 넘어가거나 이 예제의 범위를 벗어나는 번역 단계로 땜질하는 대신, 코드에 정확히 그렇게 주석으로 남겨뒀다.</p></div>
        <h2>다섯 개 언어, 변하지 않는 것 하나</h2>
        <p>기준 구현을 라이브로 검증한 뒤, 나머지 네 스택에 같은 설계를 포팅했다 — 다만 기준 구현의 문법을 그대로 베끼지 말고 각자 기존에 쓰던 쿼리/CQRS 관례를 따르라고 명시적으로 지시했다. Java·Kotlin Spring Boot는 이미 쿼리에 Handler+Bus 대신 평범한 서비스 오케스트레이터를 쓰고 있었으므로, 그대로 그 방식으로 포팅됐다 — 그 아래 깔린 가드레일은 동일하게 배선한 채로.</p>
        <table>
          <thead><tr><th>언어</th><th>커밋</th><th>특이사항</th></tr></thead>
          <tbody>
            <tr><td>nestjs</td><td>708c815</td><td>기준 구현; 실제 Ollama로 라이브 검증</td></tr>
            <tr><td>Go</td><td>4814b19</td><td>첫 푸시는 CI 실패(OpenAPI 문서 갱신 누락) — 스스로 진단하고 후속 커밋으로 수정</td></tr>
            <tr><td>Java Spring Boot</td><td>fa209cd</td><td>기존 classifier와 달리 Ollama HTTP 클라이언트를 빈으로 노출 — 두 서비스 모두 독립적으로 모킹 가능해짐</td></tr>
            <tr><td>Kotlin Spring Boot</td><td>77d0f9f</td><td>실제 코틀린 컴파일 오류(두 파일이 동일한 이름의 private 최상위 클래스를 재선언) — 클래스를 내부로 옮겨 직접 발견·수정</td></tr>
            <tr><td>FastAPI</td><td>aca6a3a</td><td>이 패턴을 위한 언어별 아키텍처 문서가 아직 없어서 layer-architecture.md에 대신 정리</td></tr>
          </tbody>
        </table>
        <p>메커니즘은 어디서나 다르다 — 여기선 쿼리 버스, 저기선 평범한 서비스, 코틀린의 패키지-프라이빗 규칙이 작은 클래스 두 개의 실제 재설계를 강제하기도 했다. 하지만 가드레일 — <code>ownerId</code>는 인증된 호출자에게서만, 모델에게서는 절대 아님 — 은 단 한 번도 움직이지 않았다. 어떤 설계가 진짜 원칙인지, 아니면 원칙으로 포장된 구현 디테일일 뿐인지는 보통 이걸로 갈린다: 원본과 전혀 다르게 동작하는 언어로 다시 쓰여도 살아남는지.</p>
        <div className="article-note"><strong>더 읽을거리</strong><p>
          <a href="/posts/the-fraud-signal-that-trusted-the-fraudster">사기꾼을 그대로 믿은 사기 탐지 신호</a> — 이 기능의 가드레일이 직접 응답하고 있는 그 제거 이야기 · <a href="/posts/same-architecture-five-languages">같은 아키텍처, 다섯 개의 언어</a> — 이전 기능을 대상으로 한 같은 방식의 언어 간 비교 · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/domain-service.md" target="_blank" rel="noreferrer">docs/architecture/domain-service.md</a> — 기준 구현의 실제 코드가 담긴 전체 문서
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
