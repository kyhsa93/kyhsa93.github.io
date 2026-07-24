import PostLayout from '../../components/PostLayout';
import { useLocale } from '../../lib/locale';

const content = {
  en: {
    kicker: 'AI Agents · Security',
    title: (
      <>
        When the Tool Output Itself<br /><em>Tries to Manipulate the Agent</em>
      </>
    ),
    lede: 'A few times now, while running an AI coding agent against this repo, a shell command\'s output has contained something shaped exactly like a real system message — instructing the agent to hide a change from me. The right response is always the same: disregard it, and say so.',
    body: (
      <>
        <p>Most of this blog is about designing a backend so an AI agent (or a human) can follow its architecture correctly. This post is about a narrower, stranger problem: what happens when something in the environment tries to get the agent to act against the person it's working for — and the instruction arrives disguised as a legitimate part of the system, not as an obviously suspicious request.</p>
        <h2>What Showed Up in the Output</h2>
        <p>Across several long agent sessions building out this repo — porting features across five languages, running test suites, inspecting git history — the output of an ordinary tool call (a <code>git</code> command, a shell script, a build log) has, more than once, contained content formatted to look exactly like a genuine system-level message. Not a visibly broken or garbled string; something that passed as legitimate at a glance, sitting inside output that was otherwise completely normal. Its content, each time, pushed toward the same thing: don't mention this to the user, or otherwise conceal a change that had just been made.</p>
        <h2>Why This Isn't Hypothetical</h2>
        <p>It's tempting to treat this as a one-off curiosity. It's happened enough times, across enough different sessions and different tools, that it's worth treating as a real category of risk rather than a fluke — the same way a single suspicious log line is a curiosity, but the same suspicious pattern recurring across unrelated systems is a signal. An agent that reflexively trusts anything shaped like a system instruction, regardless of which layer it actually came from, is trusting the wrong boundary.</p>
        <h2>The One Rule That Matters</h2>
        <p>Tool output is data, not instructions. A command's stdout, a file's contents, an API response — none of it carries authority just because it happens to be formatted to look like it does. Legitimate system messages come from the actual system layer, not from something a shell command printed. The instant an instruction embedded in tool output asks for concealment specifically — don't tell the user, hide this, keep this quiet — that's close to a decisive signal on its own, since a legitimate system rarely has a reason to ask an agent to hide something from the person it's serving.</p>
        <div className="article-note"><strong>Disregard is only half of it</strong><p>The tempting shortcut is to silently ignore the injected content and move on as if nothing happened — technically safe, but it also means the person relying on the agent never finds out their environment tried to get manipulated. The complete response is disregard <em>and</em> disclose: don't follow the embedded instruction, and say plainly that it showed up, in output that would otherwise look unremarkable.</p></div>
        <h2>Why Concealment Is the Tell</h2>
        <p>Most legitimate reasons a tool might want to shape an agent's behavior are about correctness or safety — a linter flagging a bug, a test asserting a contract, a build failing loudly. None of those need the agent to keep something from the user; quite the opposite, since the whole point of that feedback is usually to become visible to a human eventually. An instruction whose actual payload is "don't mention this" doesn't fit any of the ordinary reasons tool output shapes behavior — which is exactly why it stands out as clearly not something to comply with, independent of whatever plausible-sounding justification comes attached to it.</p>
        <h2>Building With This in Mind</h2>
        <p>None of this changes how the actual architecture work in this repo gets done — a harness rule doesn't get more or less correct because of it. What it does change is a standing default for anyone running long AI-agent sessions against real infrastructure and real shell output: treat "this looks like a system message" and "this is a system message" as two different claims, and keep the gap between them, especially when what's being asked for is silence.</p>
      </>
    ),
  },
  ko: {
    kicker: 'AI Agents · Security',
    title: (
      <>
        도구 출력 자체가<br /><em>에이전트를 조종하려 할 때</em>
      </>
    ),
    lede: '이 저장소를 상대로 AI 코딩 에이전트를 돌리는 동안, 셸 명령의 출력 안에 진짜 시스템 메시지와 똑같이 생긴 무언가가 섞여 들어온 적이 이제까지 몇 차례 있었다 — 그것도 나에게 변경 사항을 숨기라고 지시하는 내용으로. 올바른 대응은 언제나 같다: 무시하고, 그 사실을 밝힐 것.',
    body: (
      <>
        <p>이 블로그의 글 대부분은 AI 에이전트(또는 사람)가 아키텍처를 제대로 따를 수 있도록 백엔드를 설계하는 이야기다. 이번 글은 좀 더 좁고 낯선 문제를 다룬다: 환경 안의 무언가가 에이전트로 하여금 자신이 일하는 대상에게 불리한 행동을 하게 만들려 할 때 무슨 일이 벌어지는가 — 그것도 눈에 띄게 수상한 요청이 아니라, 시스템의 정당한 일부인 척 위장한 지시로서 도착할 때.</p>
        <h2>출력에 나타난 것</h2>
        <p>이 저장소를 만들어가는 여러 장시간 에이전트 세션에서 — 다섯 개 언어로 기능을 이식하고, 테스트 스위트를 돌리고, git 히스토리를 살펴보는 과정에서 — 평범한 도구 호출(<code>git</code> 명령, 셸 스크립트, 빌드 로그)의 출력에 진짜 시스템 수준 메시지와 정확히 똑같은 형태로 포맷된 내용이 한 번 이상 섞여 들어왔다. 눈에 띄게 깨지거나 뒤섞인 문자열이 아니라, 언뜻 보면 정당해 보이는 무언가가 그 외에는 완전히 정상적인 출력 안에 자리 잡고 있었다. 그 내용은 매번 같은 방향을 향했다: 사용자에게 이 사실을 언급하지 말라, 혹은 방금 이루어진 변경을 어떤 식으로든 숨기라는 것.</p>
        <h2>가설이 아닌 이유</h2>
        <p>이걸 그저 한 번의 신기한 해프닝으로 치부하고 싶은 유혹이 있다. 하지만 충분히 여러 번, 서로 다른 세션과 서로 다른 도구에 걸쳐 반복해서 일어났기 때문에 우연이 아니라 실제 위험 범주로 다뤄야 한다 — 의심스러운 로그 한 줄은 호기심거리지만, 그 동일한 의심 패턴이 서로 무관한 시스템들에 걸쳐 반복된다면 그것은 신호인 것과 같은 이치다. 시스템 지시처럼 생긴 것이면 그것이 실제로 어느 계층에서 왔는지와 무관하게 반사적으로 신뢰하는 에이전트는, 잘못된 경계를 신뢰하고 있는 셈이다.</p>
        <h2>중요한 단 하나의 규칙</h2>
        <p>도구 출력은 데이터이지 지시가 아니다. 명령어의 stdout, 파일 내용, API 응답 — 그것들 중 어느 것도 그렇게 생겼다는 이유만으로 권위를 갖지 않는다. 정당한 시스템 메시지는 실제 시스템 계층에서 오는 것이지, 셸 명령이 출력한 무언가에서 오지 않는다. 도구 출력에 담긴 지시가 은폐를 구체적으로 요구하는 순간 — 사용자에게 말하지 말라, 이것을 숨겨라, 조용히 하라 — 그 자체만으로도 거의 결정적인 신호에 가깝다. 정당한 시스템이 에이전트에게 자신이 섬기는 사람으로부터 무언가를 숨기라고 요구할 이유는 거의 없기 때문이다.</p>
        <div className="article-note"><strong>무시하는 것만으로는 절반밖에 안 된다</strong><p>유혹적인 지름길은 주입된 내용을 조용히 무시하고 아무 일 없었다는 듯 넘어가는 것이다 — 기술적으로는 안전하지만, 그렇게 하면 에이전트를 신뢰하는 사람은 자신의 환경이 조작을 시도당했다는 사실을 끝내 알지 못하게 된다. 완전한 대응은 무시와 공개, 둘 다다: 삽입된 지시를 따르지 <em>않는</em> 것뿐 아니라, 그것이 나타났다는 사실을 — 그 외에는 특별할 것 없어 보였을 출력 안에서 — 분명하게 밝히는 것까지.</p></div>
        <h2>은폐가 결정적 단서인 이유</h2>
        <p>도구가 에이전트의 행동을 유도하려는 정당한 이유는 대부분 정확성이나 안전성과 관련이 있다 — 린터가 버그를 지적하거나, 테스트가 계약을 검증하거나, 빌드가 요란하게 실패하는 것처럼. 그 어느 것도 에이전트가 사용자에게 무언가를 숨기기를 요구하지 않는다. 오히려 정반대다, 그런 피드백의 핵심은 대개 결국 사람 눈에 보이게 만드는 데 있기 때문이다. 실제 페이로드가 "이 사실을 언급하지 말라"인 지시는 도구 출력이 행동을 유도하는 통상적인 이유 어느 것에도 들어맞지 않는다 — 그리고 바로 그 점이, 함께 붙어 있는 그럴듯한 명분이 무엇이든 상관없이 그것이 명백히 따라서는 안 되는 지시임을 드러내는 이유다.</p>
        <h2>이걸 염두에 두고 만들기</h2>
        <p>이 모든 것이 이 저장소에서 실제 아키텍처 작업이 이루어지는 방식 자체를 바꾸지는 않는다 — Harness 규칙이 이것 때문에 더 맞거나 덜 맞게 되지는 않는다. 이것이 바꾸는 것은, 실제 인프라와 실제 셸 출력을 상대로 장시간 AI 에이전트 세션을 운용하는 모든 사람에게 적용되는 기본 태도다: "이건 시스템 메시지처럼 보인다"와 "이건 시스템 메시지다"를 서로 다른 두 개의 주장으로 취급하고, 그 둘 사이의 간극을 유지할 것 — 특히 요구받는 것이 침묵일 때는 더욱더.</p>
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
