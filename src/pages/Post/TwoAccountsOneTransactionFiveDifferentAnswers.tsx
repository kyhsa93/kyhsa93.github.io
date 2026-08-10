import PostLayout from '../../components/PostLayout';
import { useLocale, localeFromPathname } from '../../lib/locale';
import type { MetaFunction } from 'react-router';
import { createPostMeta } from '../../lib/seo';

export const meta: MetaFunction = ({ location }) =>
  createPostMeta('two-accounts-one-transaction-five-different-answers', localeFromPathname(location.pathname));

const content = {
  en: {
    kicker: 'Backend · Reliability',
    title: (
      <>
        Two Accounts, One Transaction,<br /><em>Five Different Answers</em>
      </>
    ),
    lede: 'A transfer between two Accounts needs exactly one thing: writing two Aggregates atomically, in a single transaction. One language had that mechanism fully working. One had a naive fix sitting one edit away from a silent regression. One had a doc quietly contradicting its own code. One had never needed the capability at all — until this feature made it the first caller.',
    body: (
      <>
        <p>One open issue had been sitting there for a while: Go had no multi-Repository transaction propagation, tracked, unresolved. A recurring-transfer feature had already validated the design in an earlier benchmark round — and been thrown away afterward, because the benchmark's worktree was disposable and main had no real use case that actually needed it yet. Building an account-to-account transfer for real, across all five languages rather than just Go, gave every language's transaction mechanism an actual production caller — in more than one case, its first.</p>
        <p>The shape was the same everywhere: <code>POST /accounts/&#123;sourceId&#125;/transfer</code>, a <code>TransferEligibilityService</code> that checks same-account, both accounts' active status, currency match, and sufficient balance — fully, on both sides — before either account is touched, so a rejection can never leave one side withdrawn with the other side not yet deposited. A rejection reuses the exact error <code>withdraw</code>/<code>deposit</code> already throw for that condition, not a new one, since Transfer has no persisted aggregate of its own to record a rejected state on. No new table, either — two correlated transaction rows, one withdrawal and one deposit, sharing a single fresh id as their <code>reference_id</code>, with no suffix — deliberately, after an earlier benchmark's suffixed id overflowed a <code>VARCHAR(36)</code> column and this feature had no interest in repeating it.</p>
        <h2>NestJS: The One That Already Worked</h2>
        <p>NestJS had a real <code>TransactionManager</code> built on <code>AsyncLocalStorage</code>, already wired and already used elsewhere. Zero infrastructure changes — both <code>saveAccount</code> calls just needed wrapping in one <code>.run()</code>.</p>
        <h2>Go: A Regression Waiting One Edit Inside the Obvious Fix</h2>
        <p>Go's <code>internal/infrastructure/database/</code> — <code>WithTx</code>, <code>TxFromContext</code>, <code>QuerierFrom</code>, <code>Manager</code> — got built for real, closing the open issue. The obvious next step looked simple: make <code>SaveAccount</code> always fetch its querier through <code>QuerierFrom</code>. It would have silently broken every existing single-account caller's atomicity, because <code>QuerierFrom</code> returns the raw <code>*sql.DB</code> whenever there's no transaction already on the context — turning what used to be one atomic write (account row, transaction row, outbox row together) into three separately auto-committed statements. The actual fix has <code>SaveAccount</code> check <code>TxFromContext</code> itself and decide whether it owns the commit, with the real SQL body extracted into a shared private function so both paths — the new transfer call and every pre-existing single-account call — run the same code:</p>
        <pre><code>{`func (r *AccountRepository) SaveAccount(ctx context.Context, a *account.Account) error {
	if tx, ok := database.TxFromContext(ctx); ok {
		// An ambient transaction already owns the commit — just run inside it.
		return r.saveAccount(ctx, tx, a)
	}
	// No ambient transaction: this call owns its own commit, exactly as it always did.
	return database.WithTx(ctx, r.db, func(tx *sql.Tx) error {
		return r.saveAccount(ctx, tx, a)
	})
}`}</code></pre>
        <p>A second version of the same shape of mistake showed up in the same change: an early draft cleared the in-memory pending-transaction and pending-event buffers before confirming the transaction actually committed. If a commit failed after that clear, every existing caller's retry path would have silently lost data it thought it still had. Caught before it landed, by gating the clear on confirmed commit success rather than on the write call simply returning.</p>
        <div className="article-note"><strong>The dangerous bug isn't in the new path</strong><p>Neither Go bug lived in the transfer feature's own code — both lived in what a plausible-looking rewrite would have done to callers that already existed and already worked. Adding shared infrastructure under an established function is exactly the moment every one of its existing callers is retested, whether anyone remembers to think of it that way or not.</p></div>
        <h2>Java and Kotlin: The Same Shape, and a Doc That Had Been Wrong to Itself</h2>
        <p>Both added <code>AccountRepository.saveAccounts(source, target)</code> with <code>@Transactional</code> at the Repository boundary — matching how the rest of each codebase already did it — and extracted a shared private <code>saveAccountInternal</code> so the new two-account path and the existing single-account path share one implementation. Deciding exactly where <code>@Transactional</code> belongs forced a doc to be read closely enough to notice it disagreed with itself: Java's own <code>design-principles.md</code> said the annotation belongs on the Command/Query Service, directly contradicting <code>persistence.md</code>'s explicit warning that putting it back there is a regression — and contradicting the real code, which had it on the Repository the whole time. The design-principles line was wrong, not the code; fixed to match reality.</p>
        <p>Kotlin's <code>persistence.md</code> had its own version of the same problem: an illustrative, never-implemented code sample showing <code>@Transactional</code> on a hypothetical Service-level <code>TransferService</code> — following Java's incorrect doc rather than Kotlin's own actual Repository-level convention. With the feature now real, the plan was to replace that illustrative snippet with the genuine, now-implemented code.</p>
        <h2>FastAPI: The Gap Nothing Had Ever Exercised</h2>
        <p>No new Repository method was even needed — a shared <code>AsyncSession</code> cached per request via <code>Depends</code> already makes two <code>save_account</code> calls atomic by construction. What surfaced instead was a latent gap in <code>get_session()</code>: no <code>except</code>, no rollback, on exception. Nothing had ever needed it, because nothing before this feature had saved two different Aggregate instances in the same request — Transfer is the first handler in the codebase to make that missing rollback load-bearing rather than theoretical.</p>
        <h2>Saying a Fix Landed Isn't the Same as It Landing</h2>
        <p>A follow-up documentation audit, run the same day specifically to look for anything the feature had quietly made false, turned up nine stale-doc issues across all five languages — mostly docs that had described the pre-transfer state as current, now falsified by the feature actually shipping. One of the nine was uncomfortable in a different way: Kotlin's <code>persistence.md</code> fix — the one described two sections up, replacing the illustrative snippet with the real implemented code — had been written down as done in the session's own summary. The edit had never actually happened. It surfaced only because a separate audit pass re-read the file afterward instead of trusting the earlier narration.</p>
        <p><code>check_docs_drift.py</code> reported zero findings the entire time — it's a path-existence checker, structurally blind to a doc's prose being wrong about what a file contains, as opposed to whether the file exists. What actually found the nine issues was grepping every language's docs for this repository's own recurring "doesn't exist yet" phrasing and manually checking each hit against current reality — the same method, run one level more skeptically, catching not just what the feature had changed but what a summary had merely claimed to change.</p>
        <p>One requirement, five already-different transaction conventions, and in every language but one the riskiest part wasn't writing the new code — it was what the new code, sitting next to the old code, revealed the old code had never actually been tested against.</p>
        <div className="article-note"><strong>Further reading in the repo</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/implementations/go/examples/internal/infrastructure/database/transaction.go" target="_blank" rel="noreferrer">transaction.go</a> — Go's transaction manager, the real implementation · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/persistence.md" target="_blank" rel="noreferrer">docs/architecture/persistence.md</a> — the root transaction-boundary principle every language's version answers to
        </p></div>
      </>
    ),
  },
  ko: {
    kicker: 'Backend · Reliability',
    title: (
      <>
        두 계좌, 하나의 트랜잭션,<br /><em>다섯 개의 서로 다른 답</em>
      </>
    ),
    lede: '두 Account 사이의 송금에 필요한 건 딱 하나다: 두 개의 Aggregate를 하나의 트랜잭션 안에서 원자적으로 쓰는 것. 한 언어는 이 메커니즘이 이미 완전히 동작하고 있었다. 한 언어는 그럴듯한 수정 한 번이면 조용한 회귀로 이어질 뻔했다. 한 언어는 문서가 자기 코드와 조용히 모순되고 있었다. 한 언어는 이 능력이 필요했던 적이 아예 없었다 — 이 기능이 처음으로 그걸 호출하기 전까지는.',
    body: (
      <>
        <p>이슈 하나가 한동안 그대로 남아 있었다: go에는 멀티 Repository 트랜잭션 전파가 없었고, 등록된 채 미해결 상태였다. 이전 벤치마크 라운드에서 recurring-transfer 기능으로 이 설계를 이미 검증했지만, 그 뒤 버려졌다 — 벤치마크의 worktree는 원래 일회용이었고, main에는 그게 실제로 필요한 진짜 사용 사례가 아직 없었기 때문이다. 계좌 간 송금을 go뿐 아니라 5개 언어 전부에 실제로 구현하자, 모든 언어의 트랜잭션 메커니즘이 진짜 프로덕션 호출자를 갖게 됐다 — 일부는 처음으로.</p>
        <p>형태는 어디서나 같았다: <code>POST /accounts/&#123;sourceId&#125;/transfer</code>, 그리고 <code>TransferEligibilityService</code>가 동일 계좌 여부·양쪽 계좌의 활성 상태·통화 일치·잔액 충분 여부를 — 양쪽 모두, 어느 한쪽도 건드리기 전에 — 전부 확인한다. 그래서 거부되는 경우 한쪽은 출금됐는데 다른 쪽은 아직 입금 안 된 상태로 남는 일이 절대 없다. 거부는 <code>withdraw</code>/<code>deposit</code>이 같은 조건에서 이미 던지는 바로 그 에러를 재사용한다 — 새 에러가 아니다. Transfer 자체는 거부 상태를 기록할 자기만의 영속 애그리게이트가 없기 때문이다. 새 테이블도 없다 — 출금 하나, 입금 하나, 상관된 두 transaction 행이 새로 만든 id 하나를 <code>reference_id</code>로 공유한다, 접미사 없이 — 의도적으로. 이전 벤치마크의 접미사 붙은 id가 <code>VARCHAR(36)</code> 컬럼을 오버플로우시킨 적이 있었고, 이번엔 그걸 반복할 생각이 없었다.</p>
        <h2>nestjs: 이미 동작하고 있던 하나</h2>
        <p>nestjs는 <code>AsyncLocalStorage</code> 기반의 진짜 <code>TransactionManager</code>를 이미 갖고 있었고, 이미 다른 곳에서 쓰이고 있었다. 인프라 변경은 0건 — 두 <code>saveAccount</code> 호출을 <code>.run()</code> 하나로 감싸기만 하면 됐다.</p>
        <h2>go: 당연해 보이는 수정 한 걸음 안쪽에 도사린 회귀</h2>
        <p>go의 <code>internal/infrastructure/database/</code> — <code>WithTx</code>, <code>TxFromContext</code>, <code>QuerierFrom</code>, <code>Manager</code> — 가 실제로 만들어지면서 미해결 이슈가 닫혔다. 다음 단계는 단순해 보였다: <code>SaveAccount</code>가 항상 <code>QuerierFrom</code>을 통해 querier를 가져오게 만드는 것. 그랬다면 기존에 있던 모든 단일 계좌 호출자의 원자성을 조용히 깨뜨렸을 것이다 — <code>QuerierFrom</code>은 context에 이미 트랜잭션이 없을 땐 원시 <code>*sql.DB</code>를 그대로 반환하기 때문이다. 원래 하나의 원자적 쓰기였던 것(계좌 행, transaction 행, outbox 행이 함께)이 각자 따로 auto-commit되는 세 개의 명령문으로 바뀌었을 것이다. 실제 수정은 <code>SaveAccount</code> 스스로 <code>TxFromContext</code>를 확인해 자신이 커밋을 소유하는지 판단하게 했고, 실제 SQL 본문은 공유 private 함수로 뽑아내 새 송금 호출과 기존의 모든 단일 계좌 호출이 같은 코드를 타도록 했다:</p>
        <pre><code>{`func (r *AccountRepository) SaveAccount(ctx context.Context, a *account.Account) error {
	if tx, ok := database.TxFromContext(ctx); ok {
		// An ambient transaction already owns the commit — just run inside it.
		return r.saveAccount(ctx, tx, a)
	}
	// No ambient transaction: this call owns its own commit, exactly as it always did.
	return database.WithTx(ctx, r.db, func(tx *sql.Tx) error {
		return r.saveAccount(ctx, tx, a)
	})
}`}</code></pre>
        <p>같은 변경 안에서 같은 모양의 실수 두 번째 버전도 나타났다: 초안은 트랜잭션이 실제로 커밋됐는지 확인하기 전에 메모리 속 미처리 transaction/이벤트 버퍼를 먼저 비웠다. 그 뒤에 커밋이 실패했다면, 기존의 모든 호출자의 재시도 경로는 여전히 갖고 있다고 믿는 데이터를 조용히 잃었을 것이다. 배포되기 전에 잡혔다 — 버퍼 비우기를 쓰기 호출이 단순히 반환하는 시점이 아니라, 커밋 성공이 확인된 시점에 걸어두는 방식으로.</p>
        <div className="article-note"><strong>위험한 버그는 새 경로에 있지 않다</strong><p>go의 버그 두 개 모두 송금 기능 자신의 코드 안에 있지 않았다 — 둘 다 그럴듯해 보이는 리라이트가 이미 존재하고 이미 잘 동작하던 호출자들에게 무슨 짓을 했을지에 있었다. 이미 확립된 함수 아래에 공유 인프라를 넣는 순간이, 그 함수의 기존 호출자 전부가 다시 테스트되는 바로 그 순간이다 — 누군가 그렇게 생각하기로 기억하든 안 하든.</p></div>
        <h2>java와 kotlin: 같은 모양, 그리고 스스로와 어긋나 있던 문서</h2>
        <p>둘 다 <code>AccountRepository.saveAccounts(source, target)</code>를 추가하고 Repository 경계에 <code>@Transactional</code>을 뒀다 — 각 코드베이스의 나머지 부분이 이미 하던 방식 그대로 — 그리고 공유 private <code>saveAccountInternal</code>을 뽑아 새로운 두 계좌 경로와 기존 단일 계좌 경로가 하나의 구현을 공유하게 했다. <code>@Transactional</code>이 정확히 어디에 있어야 하는지 결정하려면 문서를 자세히 읽어야 했고, 그 과정에서 문서가 스스로와 모순되고 있다는 게 드러났다: java 자신의 <code>design-principles.md</code>는 이 애노테이션이 Command/Query Service에 있어야 한다고 했는데, 이는 <code>persistence.md</code>의 명시적 경고("Command Service에 <code>@Transactional</code>을 다시 붙이는 건 회귀다")와 정면으로 모순됐고, 실제 코드와도 모순됐다 — 실제 코드는 처음부터 계속 Repository에 붙어 있었다. 틀린 건 design-principles의 그 문장이었지 코드가 아니었다 — 실제에 맞춰 수정됐다.</p>
        <p>kotlin의 <code>persistence.md</code>에는 같은 문제의 또 다른 버전이 있었다: 한 번도 구현된 적 없는 예시용 코드 샘플이, 가상의 Service 레벨 <code>TransferService</code>에 <code>@Transactional</code>을 붙인 모습을 보여주고 있었다 — kotlin 자신의 실제 Repository 레벨 컨벤션이 아니라 java의 잘못된 문서를 따른 형태였다. 이제 기능이 실제로 존재하니, 그 예시용 스니펫을 진짜로 구현된 코드로 교체할 계획이 세워졌다.</p>
        <h2>fastapi: 아무것도 시험해본 적 없던 갭</h2>
        <p>새 Repository 메서드조차 필요 없었다 — <code>Depends</code>를 통해 요청당 캐싱되는 공유 <code>AsyncSession</code>이 이미 구조적으로 두 번의 <code>save_account</code> 호출을 원자적으로 만들어주고 있었다. 대신 드러난 건 <code>get_session()</code>의 잠재된 갭이었다: 예외 발생 시 <code>except</code>도, rollback도 없었다. 아무것도 그걸 필요로 한 적이 없었다 — 이 기능 이전엔 한 요청 안에서 서로 다른 두 개의 Aggregate 인스턴스를 저장한 적이 없었기 때문이다. Transfer는 이 코드베이스에서 그 빠진 rollback을 이론이 아니라 실제로 작동해야 하는 것으로 만든 첫 핸들러다.</p>
        <h2>수정이 반영됐다고 말하는 것과 실제로 반영된 것은 다르다</h2>
        <p>같은 날 진행된 후속 문서 감사 — 이 기능이 조용히 거짓으로 만들어버린 게 없는지 특정해서 찾으려던 — 는 5개 언어에 걸쳐 문서 잔재 9건을 찾아냈다. 대부분 송금 이전 상태를 현재라고 서술하던 문서들이, 기능이 실제로 배포되면서 거짓이 된 것이었다. 아홉 개 중 하나는 다른 방식으로 불편했다: kotlin의 <code>persistence.md</code> 수정 — 두 문단 위에서 언급한, 예시 스니펫을 실제 구현 코드로 교체하는 것 — 이 세션 자신의 요약에는 완료된 것으로 적혀 있었다. 그 편집은 실제로 일어난 적이 없었다. 이건 오직 별도의 감사 과정이 나중에 파일을 다시 읽어보고 나서야, 이전의 서술을 그대로 믿지 않아서야 드러났다.</p>
        <p><code>check_docs_drift.py</code>는 그동안 내내 0건을 보고했다 — 그건 경로 존재 여부 검사기이지, 파일이 존재하느냐가 아니라 문서의 산문이 그 파일 내용에 대해 틀렸느냐는 구조적으로 볼 수 없다. 실제로 아홉 건을 찾아낸 방법은 모든 언어의 문서에서 이 저장소가 반복적으로 쓰는 "아직 없다" 표현을 grep하고, 걸리는 것마다 현재 실제 상태와 수동으로 대조하는 것이었다 — 같은 방법을, 한 단계 더 의심하며 실행했을 뿐이다. 그렇게 해서 이 기능이 실제로 바꾼 것뿐 아니라, 요약이 바꿨다고 그냥 주장만 한 것까지 잡아냈다.</p>
        <p>요구사항은 하나, 이미 서로 달랐던 트랜잭션 컨벤션은 다섯 개, 그리고 딱 하나를 제외한 모든 언어에서 가장 위험했던 부분은 새 코드를 쓰는 게 아니었다 — 새 코드가 옛 코드 옆에 놓이는 순간 드러난 건, 옛 코드가 실은 한 번도 그런 조건으로 테스트된 적이 없었다는 사실이었다.</p>
        <div className="article-note"><strong>저장소 내 추가 자료</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/implementations/go/examples/internal/infrastructure/database/transaction.go" target="_blank" rel="noreferrer">transaction.go</a> — go 트랜잭션 매니저의 실제 구현 · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/persistence.md" target="_blank" rel="noreferrer">docs/architecture/persistence.md</a> — 각 언어의 구현이 답해야 하는 루트 트랜잭션 경계 원칙
        </p></div>
      </>
    ),
  },
};

export default function TwoAccountsOneTransactionFiveDifferentAnswers() {
  const { locale } = useLocale();
  const c = content[locale];

  return (
    <PostLayout
      slug="two-accounts-one-transaction-five-different-answers"
      kicker={c.kicker}
      title={c.title}
      lede={c.lede}
    >
      {c.body}
    </PostLayout>
  );
}
