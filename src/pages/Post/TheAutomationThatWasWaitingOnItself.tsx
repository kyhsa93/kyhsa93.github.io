import PostLayout from '../../components/PostLayout';
import { useLocale, localeFromPathname } from '../../lib/locale';
import type { MetaFunction } from 'react-router';
import { createPostMeta } from '../../lib/seo';

export const meta: MetaFunction = ({ location }) =>
  createPostMeta('the-automation-that-was-waiting-on-itself', localeFromPathname(location.pathname));

const content = {
  en: {
    kicker: 'Tooling · Automation',
    title: (
      <>
        The Automation<br /><em>That Was Waiting on Itself</em>
      </>
    ),
    lede: "A Dependabot auto-merge workflow had been running for weeks, and every PR it ever merged had genuinely squeaked through — not because the workflow worked, but because a race condition happened to resolve in its favor every single time. The real bug was structural: one of its own steps was waiting for a check run that could only ever finish after that same step did.",
    body: (
      <>
        <p>A backlog of dependency-update PRs had built up, and the auto-merge workflow meant to clear them looked, on paper, like it had been doing its job — some PRs in its history really had merged on their own. Digging into why the backlog existed at all turned up something worse than a workflow that occasionally failed. It was a workflow that had never once succeeded for the reason it was supposed to.</p>
        <h2>A Job Waiting on Itself</h2>
        <p>The merge step called <code>gh pr checks --watch</code> — wait until every check on the PR goes green, then approve and merge. The auto-merge job is itself one of that PR's checks. So the step was watching a list of checks that included its own still-running self, waiting for a condition that could only become true after the step watching for it had already finished. A deadlock with exactly one participant, and the only thing that ever ended it was GitHub Actions' own six-hour job timeout, silently, on every single run.</p>
        <p>Every PR that had ever "auto-merged" before this had done so by winning a timing race against that six-hour clock — some other event nudging the PR closed before the deadlocked job noticed. Not the workflow working. The workflow losing a race in a direction nobody minded.</p>
        <p>The fix replaced the self-referential wait with a poll: fetch <code>gh pr checks --json name,bucket</code>, explicitly filter out the check named <code>auto-merge</code> — the job's own name, excluded from the list of things it waits on — and cap the whole job at 45 minutes so a real hang fails loudly instead of burning six hours to find out.</p>
        <h2>The Second Bug, Waiting Right Behind the First</h2>
        <p>The first real end-to-end run of the corrected workflow made it all the way to the last step and died there. <code>gh pr review --approve</code> failed: GitHub Actions is not permitted to approve pull requests, a repository setting, not a bug in the call itself. The script's strict-mode shell treated that failure as fatal and aborted one line before the merge that was the entire point of the run.</p>
        <p>The approve call had never been doing anything useful in the first place — a workflow that isn't gated on a required-review branch rule has nothing riding on an approval existing at all. It came out rather than getting worked around.</p>
        <h2>What 502s Leave Behind</h2>
        <p>Clearing the backlog meant retrying <code>gh pr merge --squash</code> against a run of GitHub 502s, and a few PRs came out of that in a state the command's own exit code didn't reveal: the squash commit had actually landed on main, but the pull request itself stayed open — in one case with a second, duplicate squash commit from a retry that ran again against a request that had actually succeeded the first time. A merge command's reported failure and its real effect on the repository had quietly stopped being the same fact.</p>
        <p>The recovery was a single comment on every affected PR: <code>@dependabot recreate</code>. Dependabot closes the ones whose change is already sitting on main and force-pushes a fresh branch for the ones that genuinely still need to merge — cheaper and more reliable than trying to reconstruct, PR by PR, which category each one actually belonged to.</p>
        <h2>Each Failing PR Was Failing for Its Own Reason</h2>
        <p>Underneath the workflow-level bugs, several individual PRs were failing on their own unrelated merits, not because of anything wrong with the automation around them: a Go end-to-end test computing a statement period from an unnormalized date, which only broke when CI happened to run on the 31st of a month; a ruff 0.16 upgrade whose new formatter reached into every Python code block embedded in the docs, not just the source files; three Kotlin Gradle plugins that had to move to 2.4.10 together as one atomic bump, because any one of them landing alone broke the build. None of them were the automation's fault, and none of them would have been fixed by the automation running correctly — they needed to actually be looked at.</p>
        <h2>What "It Works Now" Actually Looked Like</h2>
        <p>The real test of whether any of this held up wasn't a green run watched live. It was noticing, later, in the middle of something unrelated, that one more routine dependency bump had opened, passed its checks, and merged itself, with nobody watching it happen at all.</p>
        <div className="article-note"><strong>The general shape of the bug</strong><p>Any workflow that gates a merge on "all checks are green" and is itself one of those checks has this failure waiting inside it — the deadlock only resolves by accident, via some outside timeout or unrelated event, never because the logic actually completes. Worth auditing for in any CI setup that self-approves or self-merges, not just Dependabot automation specifically.</p></div>
        <div className="article-note"><strong>Further reading</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/.github/workflows/dependabot-auto-merge.yml" target="_blank" rel="noreferrer">A worked example</a> of the corrected workflow — self-check excluded, no approve step
        </p></div>
      </>
    ),
  },
  ko: {
    kicker: 'Tooling · Automation',
    title: (
      <>
        자기 자신을<br /><em>기다리고 있던 자동화</em>
      </>
    ),
    lede: 'Dependabot auto-merge 워크플로가 몇 주째 돌고 있었고, 그동안 머지된 PR은 전부 정말로 어떻게든 통과한 것들이었다 — 워크플로가 제대로 동작해서가 아니라, 경쟁 조건이 매번 우연히 유리한 쪽으로 풀렸을 뿐이었다. 진짜 버그는 구조적이었다: 자기 자신의 스텝 하나가, 바로 그 스텝이 끝나야만 끝날 수 있는 체크 실행을 기다리고 있었다.',
    body: (
      <>
        <p>의존성 업데이트 PR이 잔뜩 쌓여 있었고, 이걸 정리해야 할 auto-merge 워크플로는 서류상으로는 제 몫을 하는 것처럼 보였다 — 실제로 이력 중 몇몇 PR은 정말로 스스로 머지됐었다. 왜 애초에 백로그가 쌓였는지 파고들자, 가끔 실패하는 워크플로보다 더 나쁜 게 나왔다. 원래 의도한 이유로는 단 한 번도 성공한 적이 없던 워크플로였다.</p>
        <h2>자기 자신을 기다리던 잡</h2>
        <p>머지 스텝은 <code>gh pr checks --watch</code>를 호출했다 — PR의 모든 체크가 초록이 될 때까지 기다린 뒤 승인하고 머지한다. auto-merge 잡 자체가 바로 그 PR의 체크 중 하나다. 그러니 이 스텝은 여전히 실행 중인 자기 자신을 포함한 체크 목록을 지켜보고 있었던 셈이다 — 그걸 지켜보는 스텝 자신이 이미 끝나야만 참이 될 수 있는 조건을 기다리면서. 참가자가 정확히 하나뿐인 데드락이었고, 이걸 끝낸 유일한 것은 GitHub Actions 자체의 6시간짜리 잡 타임아웃이었다, 조용히, 매 실행마다.</p>
        <p>이전까지 "자동 머지"됐던 모든 PR은 그 6시간짜리 시계를 상대로 한 타이밍 경쟁에서 이겨서 그렇게 된 것이었다 — 데드락된 잡이 눈치채기 전에 다른 어떤 이벤트가 PR을 먼저 닫아버린 것. 워크플로가 동작한 게 아니었다. 아무도 신경 쓰지 않는 방향으로 워크플로가 경쟁에서 진 것이었다.</p>
        <p>수정은 자기 참조적인 대기를 폴링으로 바꿨다: <code>gh pr checks --json name,bucket</code>을 가져와서, <code>auto-merge</code>라는 이름의 체크 — 잡 자기 자신의 이름 — 를 명시적으로 필터링해 대기 목록에서 제외하고, 잡 전체에 45분 제한을 걸어 진짜 행이 걸리면 6시간을 태우는 대신 시끄럽게 실패하도록 했다.</p>
        <h2>첫 번째 바로 뒤에서 기다리고 있던 두 번째 버그</h2>
        <p>수정된 워크플로의 첫 실제 end-to-end 실행은 마지막 스텝까지 도달했다가 거기서 죽었다. <code>gh pr review --approve</code>가 실패했다: GitHub Actions는 pull request를 승인할 권한이 없다, 저장소 설정이지 호출 자체의 버그가 아니었다. 스크립트의 strict-mode 셸은 이 실패를 치명적으로 취급해, 이 실행 전체의 목적이었던 머지 딱 한 줄 앞에서 중단해버렸다.</p>
        <p>애초에 이 승인 호출은 처음부터 아무 쓸모도 없었다 — 필수 리뷰 브랜치 보호 규칙이 걸려 있지 않은 워크플로라면, 승인이 존재하는지에 걸려 있는 게 애초에 아무것도 없다. 우회하지 않고 그냥 빠졌다.</p>
        <h2>502가 남기고 가는 것</h2>
        <p>백로그를 정리하는 건 GitHub 502가 연달아 뜨는 상황에서 <code>gh pr merge --squash</code>를 재시도하는 걸 뜻했고, 몇몇 PR은 그 과정에서 명령어 자신의 종료 코드로는 드러나지 않는 상태로 남았다: squash 커밋은 실제로 main에 반영됐는데, PR 자체는 열린 채로 남아 있었다 — 한 경우엔 이미 성공했던 요청을 상대로 재시도가 다시 실행되면서 중복 squash 커밋이 두 번째로 생기기까지 했다. 머지 명령어가 보고하는 실패와 저장소에 미친 실제 효과가 조용히 서로 다른 사실이 되어버린 것이다.</p>
        <p>복구는 영향받은 모든 PR에 댓글 하나였다: <code>@dependabot recreate</code>. Dependabot은 변경 사항이 이미 main에 올라간 것들은 닫고, 진짜로 아직 머지가 필요한 것들은 새 브랜치를 force-push한다 — PR마다 어느 쪽에 속하는지 재구성하려 애쓰는 것보다 싸고 훨씬 믿을 만했다.</p>
        <h2>실패하던 PR 각각은 각자의 이유로 실패하고 있었다</h2>
        <p>워크플로 레벨의 버그들 아래에서, 개별 PR 몇 개는 주변 자동화와는 무관한 자기 자신의 이유로 실패하고 있었다: 정규화되지 않은 날짜에서 명세서 기간을 계산하는 go e2e 테스트 — CI가 하필 어느 달 31일에 돌 때만 깨졌다; ruff 0.16 업그레이드 — 새 포매터가 소스 파일뿐 아니라 문서 안에 박힌 모든 파이썬 코드 블록까지 건드렸다; 함께 올려야만 하는 kotlin Gradle 플러그인 3개 — 셋 중 하나만 올라가면 빌드가 깨졌다. 셋 다 자동화의 잘못이 아니었고, 자동화가 제대로 돌았다고 해서 고쳐질 것도 아니었다 — 실제로 들여다봐야 했다.</p>
        <h2>"이제 정말 동작한다"는 실제로 이런 모습이었다</h2>
        <p>이게 정말 버텨내는지에 대한 진짜 시험은 실시간으로 지켜본 초록 실행이 아니었다. 나중에, 완전히 다른 작업을 하던 도중에, 평범한 의존성 업데이트 하나가 열리고, 체크를 통과하고, 아무도 지켜보지 않는 사이에 스스로 머지된 걸 알아챈 것이었다.</p>
        <div className="article-note"><strong>이 버그의 일반적인 형태</strong><p>"모든 체크가 초록이면 머지" 조건으로 게이트를 걸면서 그 잡 자신도 체크 목록에 포함되는 워크플로는 어디든 이 실패를 안고 있다 — 데드락은 로직이 실제로 완료돼서가 아니라 외부 타임아웃이나 무관한 이벤트 덕분에 우연히 풀릴 뿐이다. Dependabot 자동화뿐 아니라 자체 승인·자체 머지를 하는 어떤 CI 설정에서도 점검해볼 가치가 있다.</p></div>
        <div className="article-note"><strong>추가 자료</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/.github/workflows/dependabot-auto-merge.yml" target="_blank" rel="noreferrer">실제 예시</a> — 자기 자신의 체크를 제외하고, 승인 스텝 없이 수정된 워크플로
        </p></div>
      </>
    ),
  },
};

export default function TheAutomationThatWasWaitingOnItself() {
  const { locale } = useLocale();
  const c = content[locale];

  return (
    <PostLayout
      slug="the-automation-that-was-waiting-on-itself"
      kicker={c.kicker}
      title={c.title}
      lede={c.lede}
    >
      {c.body}
    </PostLayout>
  );
}
