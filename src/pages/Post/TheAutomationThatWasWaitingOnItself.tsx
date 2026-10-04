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
    lede: "A Dependabot auto-merge workflow had been running for weeks, and every PR it ever merged had squeaked through, not because the workflow worked, but because a race condition happened to resolve in its favor every single time. The bug was structural: one of its own steps was waiting for a check run that could only ever finish after that same step did.",
    body: (
      <>
        <p>A backlog of dependency-update PRs had built up, and the auto-merge workflow meant to clear them looked, on paper, like it had been doing its job. Some PRs in its history had merged on their own. Digging into why the backlog existed at all turned up something worse than a workflow that occasionally failed. It was a workflow that had never once succeeded for the reason it was supposed to.</p>
        <h2>A Job Waiting on Itself</h2>
        <p>The merge step called <code>gh pr checks --watch</code>: wait until every check on the PR goes green, then approve and merge. The auto-merge job is itself one of that PR's checks. So the step was watching a list of checks that included its own still-running self, waiting for a condition that could only become true after the step watching for it had already finished. A deadlock with exactly one participant, and the only thing that ever ended it was GitHub Actions' own six-hour job timeout, with no error, on every single run.</p>
        <p>Every PR that had ever "auto-merged" before this had done so by winning a timing race against that six-hour clock, with some other event nudging the PR closed before the deadlocked job noticed. Not the workflow working. The workflow losing a race in a direction nobody minded.</p>
        <p>The fix replaced the self-referential wait with a poll: fetch <code>gh pr checks --json name,bucket</code>, explicitly filter out the check named <code>auto-merge</code> (the job's own name, excluded from the list of things it waits on), and cap the whole job at 45 minutes so a real hang fails loudly instead of burning six hours to find out.</p>
        <h2>The Second Bug, Waiting Right Behind the First</h2>
        <p>The first end-to-end run of the corrected workflow made it all the way to the last step and died there. <code>gh pr review --approve</code> failed: GitHub Actions is not permitted to approve pull requests, a repository setting, not a bug in the call itself. The script's strict-mode shell treated that failure as fatal and aborted one line before the merge that was the entire point of the run.</p>
        <p>The approve call had never been doing anything useful in the first place. A workflow that isn't gated on a required-review branch rule has nothing riding on an approval existing at all. It came out rather than getting worked around.</p>
        <h2>What 502s Leave Behind</h2>
        <p>Clearing the backlog meant retrying <code>gh pr merge --squash</code> against a run of GitHub 502s, and a few PRs came out of that in a state the command's own exit code didn't reveal: the squash commit had landed on main, but the pull request itself stayed open — in one case with a second, duplicate squash commit from a retry that ran again against a request that had succeeded the first time. A merge command's reported failure and its effect on the repository had stopped being the same fact.</p>
        <p>The recovery was a single comment on every affected PR: <code>@dependabot recreate</code>. Dependabot closes the ones whose change is already sitting on main and force-pushes a fresh branch for the ones that still need to merge. That was cheaper and more reliable than trying to reconstruct, PR by PR, which category each one belonged to.</p>
        <h2>Each Failing PR Was Failing for Its Own Reason</h2>
        <p>Underneath the workflow-level bugs, several individual PRs were failing on their own unrelated merits, not because of anything wrong with the automation around them: a Go end-to-end test computing a statement period from an unnormalized date, which only broke when CI happened to run on the 31st of a month; a ruff 0.16 upgrade whose new formatter reached into every Python code block embedded in the docs, not just the source files; three Kotlin Gradle plugins that had to move to 2.4.10 together as one atomic bump, because any one of them landing alone broke the build. None of them were the automation's fault, and none of them would have been fixed by the automation running correctly. They needed to be looked at.</p>
        <h2>What "It Works Now" Looked Like</h2>
        <p>The test of whether any of this held up wasn't a green run watched live. It was noticing, later, in the middle of something unrelated, that one more routine dependency bump had opened, passed its checks, and merged itself, with nobody watching it happen at all.</p>
        <div className="article-note"><strong>The general shape of the bug</strong><p>Any workflow that gates a merge on "all checks are green" and is itself one of those checks has this failure waiting inside it. The deadlock only resolves by accident, via some outside timeout or unrelated event, never because the logic completes. Worth auditing for in any CI setup that self-approves or self-merges, not just Dependabot automation specifically.</p></div>
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
    lede: 'Dependabot auto-merge 워크플로가 몇 주째 돌고 있었다. 그동안 머지된 PR은 하나같이 겨우 빠져나간 것들이었다. 워크플로가 제대로 동작해서 머지된 게 아니고, 경쟁 조건이 매번 운 좋게 유리한 쪽으로 풀렸을 뿐이다. 버그는 구조에 있었다. 워크플로의 스텝 하나가, 그 스텝이 끝나야만 끝날 수 있는 체크를 기다리고 있었다.',
    body: (
      <>
        <p>의존성 업데이트 PR이 잔뜩 쌓여 있었다. 이걸 치워야 할 auto-merge 워크플로는 겉으로는 제 할 일을 하는 듯 보였다. 이력을 보면 혼자 머지된 PR도 몇 개 있었다. 그런데 애초에 PR이 왜 쌓였는지 파고들어 보니, 가끔 실패하는 워크플로보다 더 나쁜 게 나왔다. 원래 의도한 방식으로는 한 번도 성공한 적이 없는 워크플로였다.</p>
        <h2>자기 자신을 기다리던 잡</h2>
        <p>머지 스텝은 <code>gh pr checks --watch</code>를 호출했다. PR의 체크가 전부 초록이 될 때까지 기다렸다가 승인하고 머지하는 방식이다. 문제는 auto-merge 잡 자신도 그 PR의 체크 중 하나라는 점이다. 스텝이 지켜보는 체크 목록에 아직 돌고 있는 자기 자신이 들어 있었다. 그 조건은 지켜보는 스텝이 끝나야만 참이 될 수 있다. 참가자가 하나뿐인 데드락이었다. 이걸 끝낸 건 GitHub Actions의 6시간 잡 타임아웃뿐이었고, 매번 아무 알림 없이 그렇게 끝났다.</p>
        <p>그때까지 "자동 머지"된 PR은 모두 이 6시간짜리 시계와의 타이밍 경쟁에서 이긴 것이다. 데드락에 걸린 잡이 알아채기 전에 다른 이벤트가 PR을 먼저 닫아 준 경우들이다. 워크플로가 동작한 게 아니었다. 워크플로가 경쟁에서 졌는데, 마침 아무도 신경 쓰지 않는 방향으로 졌을 뿐이다.</p>
        <p>자기 자신을 기다리는 대기는 폴링으로 바꿨다. <code>gh pr checks --json name,bucket</code>으로 체크 목록을 받아 오고, 잡 자신의 이름인 <code>auto-merge</code> 체크는 기다릴 목록에서 명시적으로 뺐다. 잡 전체에는 45분 제한을 걸었다. 정말로 멈춘 경우라면 6시간을 날린 뒤에야 아는 대신 바로 요란하게 실패한다.</p>
        <h2>첫 번째 버그 바로 뒤에 있던 두 번째 버그</h2>
        <p>고친 워크플로를 처음 끝까지 돌려 보니 마지막 스텝까지 가서 죽었다. <code>gh pr review --approve</code>가 실패한 것이다. GitHub Actions에는 pull request를 승인할 권한이 없었다. 호출이 잘못된 게 아니고 저장소 설정이 그랬다. 스크립트는 strict mode 셸로 돌고 있어서 이 실패를 치명적인 오류로 보고 멈췄다. 이 실행의 목적인 머지를 딱 한 줄 남겨 두고서다.</p>
        <p>사실 이 승인 호출은 처음부터 하는 일이 없었다. 브랜치에 필수 리뷰 규칙이 걸려 있지 않으니 승인이 있든 없든 달라지는 게 없다. 우회할 방법을 찾지 않고 그냥 지웠다.</p>
        <h2>502가 남기고 간 것</h2>
        <p>쌓인 PR을 치우려면 GitHub이 502를 연달아 내는 와중에 <code>gh pr merge --squash</code>를 계속 재시도해야 했다. 그러다 몇몇 PR이 명령의 종료 코드만 봐서는 알 수 없는 상태로 남았다. squash 커밋은 main에 들어갔는데 PR은 열린 채였다. 한 PR은 첫 요청이 이미 성공했는데 재시도가 또 돌아서, 같은 squash 커밋이 하나 더 생기기도 했다. 머지 명령이 보고한 실패와 저장소에 일어난 일이 어느새 서로 다른 얘기가 돼 있었다.</p>
        <p>복구는 영향받은 PR마다 <code>@dependabot recreate</code> 댓글 하나로 끝냈다. Dependabot은 변경이 이미 main에 있는 PR은 닫고, 아직 머지가 필요한 PR은 브랜치를 새로 만들어 force-push한다. PR마다 어느 쪽인지 하나하나 따져 보는 것보다 싸고 훨씬 믿을 만했다.</p>
        <h2>실패하던 PR은 저마다 이유가 따로 있었다</h2>
        <p>워크플로 버그와는 별개로, 몇몇 PR은 자동화와 상관없는 자기 사정으로 실패하고 있었다. 하나는 Go e2e 테스트였다. 정규화하지 않은 날짜로 명세서 기간을 계산하는 바람에, CI가 하필 31일에 돌 때만 깨졌다. ruff 0.16 업그레이드도 있었다. 새 포매터가 소스 파일만이 아니라 문서에 들어 있는 파이썬 코드 블록까지 전부 손댔다. Kotlin Gradle 플러그인 3개는 한꺼번에 2.4.10으로 올려야 했다. 하나만 먼저 올라가면 빌드가 깨졌기 때문이다.</p>
        <p>셋 다 자동화 탓이 아니었다. 자동화가 제대로 돌았어도 고쳐지지 않았을 문제들이다. 사람이 직접 들여다봐야 했다.</p>
        <h2>"이제 된다"는 어떤 모습이었나</h2>
        <p>제대로 고쳐졌는지 확인한 건 실시간으로 지켜본 초록불이 아니었다. 한참 뒤 전혀 다른 작업을 하다가, 평범한 의존성 업데이트 하나가 열리고 체크를 통과하고 아무도 보지 않는 사이에 혼자 머지된 걸 발견했을 때였다.</p>
        <div className="article-note"><strong>이 버그의 일반적인 모양</strong><p>"체크가 전부 초록이면 머지"를 조건으로 거는 워크플로가 그 체크 목록에 자기 자신도 들어 있다면, 어디서든 이 실패가 숨어 있다. 이런 데드락은 로직이 끝나서 풀리는 일이 없다. 외부 타임아웃이나 상관없는 이벤트 덕분에 우연히 풀릴 뿐이다. Dependabot 자동화만이 아니고, 스스로 승인하거나 머지하는 CI 설정이라면 한 번쯤 점검해 볼 만하다.</p></div>
        <div className="article-note"><strong>더 볼 자료</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/.github/workflows/dependabot-auto-merge.yml" target="_blank" rel="noreferrer">고친 워크플로 예시</a>(자기 자신의 체크는 빼고, 승인 스텝은 없앴다)
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
