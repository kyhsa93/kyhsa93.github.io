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
    lede: 'A transfer between two Accounts needs one thing: writing two Aggregates atomically, in a single transaction. One language had that mechanism fully working. One had a naive fix sitting one edit away from a silent regression. One had a doc contradicting its own code. One had never needed the capability at all, until this feature made it the first caller.',
    body: (
      <>
        <p>One open issue had been sitting there for a while: Go had no multi-Repository transaction propagation, tracked, unresolved. A recurring-transfer feature had already validated the design in an earlier benchmark round, and been thrown away afterward, because the benchmark's worktree was disposable and main had no use case that needed it yet. Building an account-to-account transfer for real, across all five languages rather than just Go, gave every language's transaction mechanism a production caller, in more than one case its first.</p>
        <p>The shape was the same everywhere: <code>POST /accounts/&#123;sourceId&#125;/transfer</code>, and a <code>TransferEligibilityService</code> that checks same-account, both accounts' active status, currency match, and sufficient balance, fully, on both sides, before either account is touched, so a rejection can never leave one side withdrawn with the other side not yet deposited. A rejection reuses the same error <code>withdraw</code>/<code>deposit</code> already throw for that condition, not a new one, since Transfer has no persisted aggregate of its own to record a rejected state on. No new table, either: two correlated transaction rows, one withdrawal and one deposit, share a single fresh id as their <code>reference_id</code>, with no suffix. That was deliberate, after an earlier benchmark's suffixed id overflowed a <code>VARCHAR(36)</code> column and this feature had no interest in repeating it.</p>
        <h2>NestJS: The One That Already Worked</h2>
        <p>NestJS had a working <code>TransactionManager</code> built on <code>AsyncLocalStorage</code>, already wired and already used elsewhere. Zero infrastructure changes; both <code>saveAccount</code> calls just needed wrapping in one <code>.run()</code>.</p>
        <h2>Go: A Regression Waiting One Edit Inside the Obvious Fix</h2>
        <p>Go's <code>internal/infrastructure/database/</code> (<code>WithTx</code>, <code>TxFromContext</code>, <code>QuerierFrom</code>, <code>Manager</code>) got built for real, closing the open issue. The obvious next step looked simple: make <code>SaveAccount</code> always fetch its querier through <code>QuerierFrom</code>. It would have broken every existing single-account caller's atomicity without a sound, because <code>QuerierFrom</code> returns the raw <code>*sql.DB</code> whenever there's no transaction already on the context, turning what used to be one atomic write (account row, transaction row, outbox row together) into three separately auto-committed statements. The fix has <code>SaveAccount</code> check <code>TxFromContext</code> itself and decide whether it owns the commit, with the SQL body extracted into a shared private function so both paths, the new transfer call and every pre-existing single-account call, run the same code:</p>
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
        <p>A second version of the same shape of mistake showed up in the same change: an early draft cleared the in-memory pending-transaction and pending-event buffers before confirming the transaction committed. If a commit failed after that clear, every existing caller's retry path would have lost data it thought it still had. Caught before it landed, by gating the clear on confirmed commit success rather than on the write call simply returning.</p>
        <div className="article-note"><strong>The dangerous bug isn't in the new path</strong><p>Neither Go bug lived in the transfer feature's own code. Both lived in what a plausible-looking rewrite would have done to callers that already existed and already worked. Adding shared infrastructure under an established function is the moment every one of its existing callers is retested, whether anyone remembers to think of it that way or not.</p></div>
        <h2>Java and Kotlin: The Same Shape, and a Doc That Had Been Wrong to Itself</h2>
        <p>Both added <code>AccountRepository.saveAccounts(source, target)</code> with <code>@Transactional</code> at the Repository boundary, matching how the rest of each codebase already did it, and extracted a shared private <code>saveAccountInternal</code> so the new two-account path and the existing single-account path share one implementation. Deciding where <code>@Transactional</code> belongs forced a doc to be read closely enough to notice it disagreed with itself. Java's own <code>design-principles.md</code> said the annotation belongs on the Command/Query Service, directly contradicting <code>persistence.md</code>'s explicit warning that putting it back there is a regression, and contradicting the code, which had it on the Repository the whole time. The design-principles line was wrong, not the code; fixed to match reality.</p>
        <p>Kotlin's <code>persistence.md</code> had its own version of the same problem: an illustrative, never-implemented code sample showing <code>@Transactional</code> on a hypothetical Service-level <code>TransferService</code>, following Java's incorrect doc rather than Kotlin's own Repository-level convention. With the feature now real, the plan was to replace that illustrative snippet with the now-implemented code.</p>
        <h2>FastAPI: The Gap Nothing Had Ever Exercised</h2>
        <p>No new Repository method was even needed. A shared <code>AsyncSession</code> cached per request via <code>Depends</code> already makes two <code>save_account</code> calls atomic by construction. What surfaced instead was a latent gap in <code>get_session()</code>: no <code>except</code>, no rollback, on exception. Nothing had ever needed it, because nothing before this feature had saved two different Aggregate instances in the same request. Transfer is the first handler in the codebase to make that missing rollback load-bearing rather than theoretical.</p>
        <h2>Saying a Fix Landed Isn't the Same as It Landing</h2>
        <p>A follow-up documentation audit, run the same day specifically to look for anything the feature had made false, turned up nine stale-doc issues across all five languages, mostly docs that had described the pre-transfer state as current, now falsified by the feature shipping. One of the nine was uncomfortable in a different way. Kotlin's <code>persistence.md</code> fix (the one described two sections up, replacing the illustrative snippet with the implemented code) had been written down as done in the work's own summary. The edit had never happened. It surfaced only because a separate audit pass re-read the file afterward instead of trusting the earlier narration.</p>
        <p><code>check_docs_drift.py</code> reported zero findings the entire time. It's a path-existence checker, structurally blind to a doc's prose being wrong about what a file contains, as opposed to whether the file exists. What found the nine issues was grepping every language's docs for this repository's own recurring "doesn't exist yet" phrasing and manually checking each hit against current reality — the same method, run one level more skeptically, catching not just what the feature had changed but what a summary had merely claimed to change.</p>
        <p>One requirement, five already-different transaction conventions, and in every language but one the riskiest part wasn't writing the new code. It was what the new code, sitting next to the old code, revealed the old code had never been tested against.</p>
        <div className="article-note"><strong>Further reading in the repo</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/implementations/go/examples/internal/infrastructure/database/transaction.go" target="_blank" rel="noreferrer">transaction.go</a> (Go's transaction manager implementation) · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/persistence.md" target="_blank" rel="noreferrer">docs/architecture/persistence.md</a> (the root transaction-boundary principle every language's version answers to)
        </p></div>
      </>
    ),
  },
  ko: {
    kicker: 'Backend · Reliability',
    title: (
      <>
        계좌 둘, 트랜잭션 하나,<br /><em>답은 다섯 가지</em>
      </>
    ),
    lede: '두 Account 사이 송금에 필요한 건 하나다. Aggregate 2개를 트랜잭션 하나 안에서 원자적으로 쓰는 것이다. 어떤 언어는 이 장치가 이미 완전히 동작하고 있었다. 어떤 언어는 그럴듯한 수정 한 번이면 소리 없는 회귀로 이어질 뻔했다. 어떤 언어는 문서가 자기 코드와 어긋나 있었다. 그리고 어떤 언어는 이 기능이 처음 호출하기 전까지 이런 능력이 필요했던 적이 아예 없었다.',
    body: (
      <>
        <p>한동안 열려 있던 이슈가 하나 있었다. Go에 여러 Repository에 걸친 트랜잭션 전파가 없다는 내용이었고, 기록만 해 두고 풀지 못한 상태였다. 앞서 벤치마크에서 정기 송금(recurring-transfer) 기능으로 이 설계를 검증한 적은 있지만, 그 코드는 버렸다. 벤치마크용 worktree는 원래 쓰고 버리는 것이었고, main에는 이 기능이 필요한 사용처가 아직 없었다. 이번에 계좌 간 송금을 Go만이 아닌 5개 언어 모두에 진짜로 구현하면서, 모든 언어의 트랜잭션 장치가 프로덕션 호출자를 갖게 됐다. 몇몇 언어에서는 첫 호출자였다.</p>
        <p>모양은 어디서나 같았다. <code>POST /accounts/&#123;sourceId&#125;/transfer</code>가 있고, <code>TransferEligibilityService</code>가 어느 계좌도 건드리기 전에 양쪽을 모두 확인한다. 같은 계좌인지, 두 계좌가 활성 상태인지, 통화가 같은지, 잔액이 충분한지를 본다. 그래서 거부되더라도 한쪽은 출금됐는데 다른 쪽은 입금이 안 된 상태로 남는 일이 없다. 거부할 때는 새 에러를 만들지 않고, <code>withdraw</code>/<code>deposit</code>이 같은 조건에서 이미 던지는 에러를 그대로 쓴다. Transfer에는 거부 상태를 기록할 자기 영속 Aggregate가 없기 때문이다.</p>
        <p>새 테이블도 만들지 않았다. 출금 하나와 입금 하나, 서로 짝이 되는 transaction 행 2개가 새로 만든 id 하나를 <code>reference_id</code>로 같이 쓴다. 접미사는 일부러 붙이지 않았다. 예전 벤치마크에서 접미사 붙인 id가 <code>VARCHAR(36)</code> 컬럼을 넘친 적이 있어서, 같은 실수를 반복할 생각이 없었다.</p>
        <h2>NestJS, 이미 동작하던 언어</h2>
        <p>NestJS에는 <code>AsyncLocalStorage</code> 기반 <code>TransactionManager</code>가 이미 있었고, 다른 곳에서도 쓰고 있었다. 인프라는 하나도 바꿀 필요가 없었다. <code>saveAccount</code> 호출 두 개를 <code>.run()</code> 하나로 감싸면 끝이었다.</p>
        <h2>Go, 뻔한 수정 바로 안쪽에 숨은 회귀</h2>
        <p>Go에는 <code>internal/infrastructure/database/</code>를 새로 만들어 <code>WithTx</code>, <code>TxFromContext</code>, <code>QuerierFrom</code>, <code>Manager</code>를 넣었고, 열려 있던 이슈도 닫혔다. 다음 단계는 간단해 보였다. <code>SaveAccount</code>가 언제나 <code>QuerierFrom</code>으로 querier를 가져오게 하면 될 것 같았다. 그렇게 했다면 기존 단일 계좌 호출자들의 원자성이 소리 없이 깨졌을 것이다. <code>QuerierFrom</code>은 context에 트랜잭션이 없으면 원시 <code>*sql.DB</code>를 그대로 돌려준다. 계좌 행, transaction 행, outbox 행을 한 번에 쓰던 원자적 쓰기가, 각자 auto-commit되는 명령문 3개로 쪼개졌을 것이다.</p>
        <p>그래서 <code>SaveAccount</code>가 직접 <code>TxFromContext</code>를 확인해 커밋을 자기가 맡을지 정하게 했다. SQL 본문은 공용 private 함수로 뽑아서, 새 송금 호출과 기존 단일 계좌 호출이 모두 같은 코드를 타게 했다.</p>
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
        <p>같은 변경에서 같은 종류의 실수가 하나 더 나왔다. 초안은 트랜잭션이 커밋됐는지 확인하기도 전에 메모리에 쌓아 둔 미처리 transaction과 이벤트 버퍼를 먼저 비웠다. 그 뒤 커밋이 실패하면, 기존 호출자들의 재시도 경로는 아직 갖고 있다고 믿던 데이터를 잃었을 것이다. 머지하기 전에 잡았다. 쓰기 호출이 반환됐을 때가 아니라 커밋 성공을 확인했을 때 버퍼를 비우도록 바꿨다.</p>
        <div className="article-note"><strong>위험한 버그는 새 경로에 없다</strong><p>Go 버그 2개는 둘 다 송금 기능의 코드에 있지 않았다. 그럴듯한 리라이트가, 이미 있고 잘 돌던 호출자들을 망가뜨릴 뻔한 곳에 있었다. 자리 잡은 함수 밑에 공용 인프라를 깔면, 그 순간 기존 호출자 전부를 다시 시험대에 올리는 셈이다. 그걸 의식하든 못 하든 마찬가지다.</p></div>
        <h2>Java와 Kotlin, 같은 모양과 자기모순이던 문서</h2>
        <p>둘 다 <code>AccountRepository.saveAccounts(source, target)</code>를 추가하고, 각 코드베이스가 이미 하던 대로 Repository 경계에 <code>@Transactional</code>을 붙였다. 공용 private <code>saveAccountInternal</code>도 뽑아서, 새 두 계좌 경로와 기존 단일 계좌 경로가 구현 하나를 같이 쓰게 했다.</p>
        <p><code>@Transactional</code>을 어디에 붙일지 정하려고 문서를 꼼꼼히 읽다가, 문서끼리 서로 어긋나 있다는 걸 알게 됐다. Java의 <code>design-principles.md</code>는 이 애노테이션이 Command/Query Service에 있어야 한다고 적고 있었다. 그런데 <code>persistence.md</code>는 "Command Service에 <code>@Transactional</code>을 다시 붙이는 건 회귀다"라고 분명히 경고하고 있었고, 실제 코드도 처음부터 Repository에 붙어 있었다. 틀린 건 design-principles의 그 문장이었으니, 실제에 맞게 고쳤다.</p>
        <p>Kotlin의 <code>persistence.md</code>에도 비슷한 문제가 있었다. 한 번도 구현된 적 없는 예시 코드가, 가상의 Service 레벨 <code>TransferService</code>에 <code>@Transactional</code>을 붙이고 있었다. Kotlin의 Repository 레벨 컨벤션을 따르지 않고 Java의 틀린 문서를 따른 모양이었다. 이제 기능이 실제로 생겼으니, 그 예시를 구현된 코드로 바꿀 계획이었다.</p>
        <h2>FastAPI, 한 번도 시험받지 않은 빈틈</h2>
        <p>새 Repository 메서드도 필요 없었다. <code>Depends</code>로 요청마다 캐싱되는 공용 <code>AsyncSession</code> 덕분에 <code>save_account</code> 두 번은 구조상 이미 원자적이었다. 대신 <code>get_session()</code>에 숨어 있던 빈틈이 드러났다. 예외가 나도 <code>except</code>도 rollback도 없었다. 지금까지는 그게 필요한 적이 없었다. 이 기능 전에는 한 요청에서 서로 다른 Aggregate 인스턴스 2개를 저장하는 일이 없었기 때문이다. 빠진 rollback이 이론상의 문제에서 실제로 일해야 하는 코드가 된 건 Transfer 핸들러가 처음이다.</p>
        <h2>고쳤다고 적은 것과 고친 것은 다르다</h2>
        <p>같은 날 후속 문서 감사를 돌렸다. 이 기능 때문에 틀린 말이 된 문서가 없는지 찾으려는 감사였고, 5개 언어에서 낡은 문서 9건이 나왔다. 대부분 송금 기능 전의 상태를 현재처럼 설명하던 문서로, 기능이 배포되면서 틀린 말이 됐다. 9건 중 하나는 조금 다른 의미로 불편했다. 두 절 위에서 말한, 예시 코드를 구현 코드로 바꾸는 Kotlin <code>persistence.md</code> 수정이 작업 요약에는 끝났다고 적혀 있었다. 그런데 그 편집은 실제로 한 적이 없었다. 별도 감사에서 앞의 설명을 믿지 않고 파일을 다시 읽었기에 드러났다.</p>
        <p><code>check_docs_drift.py</code>는 그동안 계속 0건을 보고했다. 이 스크립트는 경로가 있는지만 보기 때문에, 파일은 있는데 문서 설명이 그 내용과 다른 경우는 구조상 볼 수 없다. 9건을 찾은 방법은 따로 있었다. 모든 언어 문서에서 내 저장소가 습관처럼 쓰는 "아직 없다" 표현을 grep하고, 걸린 것마다 지금 상태와 손으로 대조했다. 방법은 같았고 한 단계 더 의심했을 뿐인데, 기능이 바꾼 것뿐 아니라 요약이 바꿨다고 주장만 한 것까지 잡혔다.</p>
        <p>요구사항은 하나였고, 언어마다 이미 다른 트랜잭션 컨벤션이 5가지 있었다. 그리고 한 언어를 빼면 가장 위험한 부분은 새 코드를 쓰는 일이 아니었다. 새 코드를 옛 코드 옆에 두자, 옛 코드가 그런 조건에서 한 번도 테스트된 적이 없다는 사실이 드러났다.</p>
        <div className="article-note"><strong>저장소에서 더 볼 것</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/implementations/go/examples/internal/infrastructure/database/transaction.go" target="_blank" rel="noreferrer">transaction.go</a>(Go 트랜잭션 매니저 구현) · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/persistence.md" target="_blank" rel="noreferrer">docs/architecture/persistence.md</a>(모든 언어의 구현이 따라야 하는 루트 트랜잭션 경계 원칙)
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
