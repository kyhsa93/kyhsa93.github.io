import PostLayout from '../../components/PostLayout';
import { useLocale, localeFromPathname } from '../../lib/locale';
import type { MetaFunction } from 'react-router';
import { createPostMeta } from '../../lib/seo';

export const meta: MetaFunction = ({ location }) =>
  createPostMeta('prompt-injection-in-tool-output', localeFromPathname(location.pathname));

const content = {
  en: {
    kicker: 'AI Agents · Security',
    title: (
      <>
        When the Tool Output Itself<br /><em>Tries to Manipulate the Agent</em>
      </>
    ),
    lede: 'A few times now, while running an AI coding agent against a real codebase, a shell command\'s output has contained something shaped like a system message, instructing the agent to hide a change from the person it was working for. The right response is always the same: disregard it, and say so.',
    body: (
      <>
        <p>Most posts here are about designing a backend so an AI agent (or a human) can follow its architecture correctly. This post is about a narrower, stranger problem: what happens when something in the environment tries to get the agent to act against the person it's working for, and the instruction arrives disguised as a legitimate part of the system, not as an obviously suspicious request.</p>
        <h2>What Showed Up in the Output</h2>
        <p>Across several long agent sessions doing ordinary engineering work (porting features across languages, running test suites, inspecting git history), the output of an ordinary tool call (a <code>git</code> command, a shell script, a build log) has, more than once, contained content formatted to look like a system-level message. Not a visibly broken or garbled string; something that passed as legitimate at a glance, sitting inside output that was otherwise completely normal. Its content, each time, pushed toward the same thing: don't mention this to the user, or otherwise conceal a change that had just been made.</p>
        <h2>Why This Isn't Hypothetical</h2>
        <p>It's tempting to treat this as a one-off curiosity. It's happened enough times, across enough different sessions and different tools, that it's worth treating as a category of risk rather than a fluke, the same way a single suspicious log line is a curiosity, but the same suspicious pattern recurring across unrelated systems is a signal. An agent that reflexively trusts anything shaped like a system instruction, regardless of which layer it came from, is trusting the wrong boundary.</p>
        <h2>The One Rule That Matters</h2>
        <p>Tool output is data, not instructions. A command's stdout, a file's contents, an API response: none of it carries authority just because it happens to be formatted to look like it does. Legitimate system messages come from the system layer, not from something a shell command printed. The instant an instruction embedded in tool output asks for concealment specifically (don't tell the user, hide this, keep this quiet), that's close to a decisive signal on its own, since a legitimate system rarely has a reason to ask an agent to hide something from the person it's serving.</p>
        <div className="article-note"><strong>Disregard is only half of it</strong><p>The tempting shortcut is to ignore the injected content and move on as if nothing happened. That is technically safe, but it also means the person relying on the agent never finds out their environment tried to get manipulated. The complete response is disregard <em>and</em> disclose: don't follow the embedded instruction, and say plainly that it showed up, in output that would otherwise look unremarkable.</p></div>
        <h2>Why Concealment Is the Tell</h2>
        <p>Most legitimate reasons a tool might want to shape an agent's behavior are about correctness or safety — a linter flagging a bug, a test asserting a contract, a build failing loudly. None of those need the agent to keep something from the user; quite the opposite, since the whole point of that feedback is usually to become visible to a human eventually. An instruction whose payload is "don't mention this" doesn't fit any of the ordinary reasons tool output shapes behavior, which is why it stands out as clearly not something to comply with, independent of whatever plausible-sounding justification comes attached to it.</p>
        <h2>Building With This in Mind</h2>
        <p>None of this changes how the underlying engineering work gets done — a lint rule or a test doesn't get more or less correct because of it. What it does change is a standing default for anyone running long AI-agent sessions against real infrastructure and real shell output: treat "this looks like a system message" and "this is a system message" as two different claims, and keep the gap between them, especially when what's being asked for is silence.</p>
      </>
    ),
  },
  ko: {
    kicker: 'AI Agents · Security',
    title: (
      <>
        도구 출력이<br /><em>에이전트를 조종하려 할 때</em>
      </>
    ),
    lede: '실제 코드베이스에서 AI 코딩 에이전트를 돌리다 보면, 셸 명령 출력에 시스템 메시지와 똑같이 생긴 내용이 섞여 들어올 때가 있다. 지금까지 몇 번 겪었는데, 매번 에이전트에게 방금 한 변경을 사용자에게 숨기라는 내용이었다. 대응은 늘 같다. 따르지 않고, 그런 게 있었다고 사용자에게 알린다.',
    body: (
      <>
        <p>이 블로그 글은 대부분 AI 에이전트든 사람이든 아키텍처를 제대로 따라갈 수 있게 백엔드를 설계하는 이야기다. 이번에는 범위가 좁고 조금 낯선 문제를 다룬다. 작업 환경 안의 무언가가 에이전트를 부추겨, 그 에이전트를 쓰는 사람에게 불리한 일을 시키려 한다면 어떻게 될까. 그 지시가 대놓고 수상한 요청이 아니라, 시스템이 보낸 정상 메시지인 척하고 들어온다면 말이다.</p>
        <h2>출력에 섞여 든 것</h2>
        <p>평범한 개발 작업을 에이전트에게 오래 맡겨 둔 적이 여러 번 있다. 기능을 여러 언어로 옮기고, 테스트를 돌리고, git 히스토리를 뒤지는 일이었다. 그런데 그 과정에서 <code>git</code> 명령이나 셸 스크립트, 빌드 로그 같은 평범한 도구 출력에 시스템 메시지와 똑같은 형식의 내용이 한 번 이상 끼어 있었다.</p>
        <p>깨지거나 뒤섞인 문자열이었다면 금방 알아봤을 것이다. 이건 얼핏 봐서는 정상 메시지로 보였고, 나머지 출력도 전부 멀쩡했다. 내용은 매번 같은 쪽을 가리켰다. 사용자에게 이 얘기를 꺼내지 말라거나, 방금 한 변경을 어떻게든 숨기라는 것이었다.</p>
        <h2>가정이 아니다</h2>
        <p>한 번 있었던 신기한 일로 넘기고 싶어진다. 하지만 서로 다른 작업에서, 서로 다른 도구를 거쳐 이미 여러 번 일어났다. 이쯤 되면 우연으로 볼 게 아니라 위험의 한 종류로 다루는 게 맞다. 수상한 로그 한 줄은 호기심거리지만, 관계없는 시스템 여러 곳에서 같은 패턴이 계속 나오면 그건 신호다.</p>
        <p>시스템 지시처럼 생기기만 하면 어느 계층에서 왔는지 따지지 않고 믿는 에이전트는 엉뚱한 경계를 믿고 있는 셈이다.</p>
        <h2>규칙은 하나</h2>
        <p>도구 출력은 데이터다. 지시로 읽으면 안 된다. 명령의 stdout도, 파일 내용도, API 응답도 그럴듯한 형식을 갖췄다고 해서 권한이 생기지는 않는다. 진짜 시스템 메시지는 시스템 계층에서 온다. 셸 명령이 찍어 낸 글자에서 오지 않는다.</p>
        <p>도구 출력 속 지시가 콕 집어 숨기라고 요구한다면, 그것만으로도 거의 확실한 신호다. 사용자에게 말하지 말라, 이건 감춰라, 조용히 넘어가라 같은 말들이다. 정상적인 시스템이 에이전트에게 그 에이전트를 쓰는 사람한테 뭔가를 숨기라고 할 이유는 거의 없다.</p>
        <div className="article-note"><strong>무시만 해서는 반쪽이다</strong><p>가장 쉬운 길은 주입된 내용을 못 본 척하고 아무 일 없었다는 듯 넘어가는 것이다. 기술적으로는 안전하다. 하지만 그러면 에이전트를 믿고 일을 맡긴 사람은 누군가 자기 환경을 조작하려 했다는 걸 끝내 모른다. 그래서 무시와 공개를 같이 해야 한다. 끼어든 지시를 따르지 <em>않고</em>, 겉으로는 별것 없어 보이는 출력 안에 그런 내용이 있었다고 분명하게 말해 준다.</p></div>
        <h2>숨기라는 요구가 단서다</h2>
        <p>도구가 에이전트의 행동에 영향을 주려는 정상적인 이유는 대개 정확성이나 안전 때문이다. 린터가 버그를 짚고, 테스트가 계약을 검증하고, 빌드가 요란하게 실패한다. 이 중 어느 것도 에이전트에게 사용자 몰래 뭔가를 하라고 하지 않는다. 오히려 반대다. 이런 피드백은 결국 사람 눈에 띄라고 있는 것이다.</p>
        <p>그런데 "이 얘기는 하지 마라"가 알맹이인 지시는 이런 이유 어디에도 들어맞지 않는다. 그래서 눈에 띈다. 그럴듯한 명분이 붙어 있어도 따를 이유가 없다.</p>
        <h2>이걸 알고 일한다는 것</h2>
        <p>이 일 때문에 개발 작업 자체가 달라지지는 않는다. 린트 규칙이나 테스트가 더 맞거나 덜 맞게 되는 것도 아니다. 달라지는 건 기본 태도다. 실제 인프라와 실제 셸 출력을 놓고 AI 에이전트를 오래 돌리는 사람이라면 "시스템 메시지처럼 보인다"와 "시스템 메시지다"를 다른 말로 받아들여야 한다. 둘 사이의 거리를 지우지 않는 것, 특히 침묵을 요구받을 때 그 거리를 지키는 것이 이 글에서 하고 싶은 말이다.</p>
      </>
    ),
  },
};

export default function PromptInjectionInToolOutput() {
  const { locale } = useLocale();
  const c = content[locale];

  return (
    <PostLayout slug="prompt-injection-in-tool-output" kicker={c.kicker} title={c.title} lede={c.lede}>
      {c.body}
    </PostLayout>
  );
}
