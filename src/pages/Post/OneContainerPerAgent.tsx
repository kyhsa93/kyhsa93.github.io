import PostLayout from '../../components/PostLayout';
import { useLocale, localeFromPathname } from '../../lib/locale';
import type { MetaFunction } from 'react-router';
import { createPostMeta } from '../../lib/seo';

export const meta: MetaFunction = ({ location }) =>
  createPostMeta('one-container-per-agent', localeFromPathname(location.pathname));

const RUN_SNIPPET = `docker run --rm --init \\
  --name agent-a1 \\
  --label agent.id=a1 --label agent.budget=3600 \\
  --cpuset-cpus 2,3 \\
  --memory 2500m --memory-swap 2500m \\
  --pids-limit 512 --shm-size 1g \\
  --network agents \\
  -v "$HOME/work/a1":/work -w /work \\
  -v "$HOME/.agent-secrets/a1":/run/secrets:ro \\
  agent-browser:2026.10 \\
  claude -p "$TASK"`;

const NETWORK_SNIPPET = `docker network create --internal agents
docker network create egress

docker run -d --name proxy --network egress egress-proxy
docker network connect agents proxy

docker run -d --name mailbox --network agents mailbox

# inside agent a1
curl -s -X POST http://mailbox:8080/agents/a2 \\
  -d '{"from":"a1","body":"schema is ready on branch a1/schema"}'
curl -s "http://mailbox:8080/agents/a1?wait=60"`;

const NESTED_SNIPPET = `docker run --rm --init \\
  --cgroup-parent agent-a1.slice \\
  -v /var/run/docker.sock:/var/run/docker.sock \\
  --add-host host.docker.internal:host-gateway \\
  -e TESTCONTAINERS_HOST_OVERRIDE=host.docker.internal \\
  ...

sudo systemctl set-property agent-a1.slice MemoryMax=4G CPUQuota=300%
sudo systemctl stop agent-a1.slice`;

const IMAGE_SNIPPET = `FROM node:22-bookworm-slim AS node
RUN apt-get update \\
 && apt-get install -y --no-install-recommends git ca-certificates \\
 && rm -rf /var/lib/apt/lists/*
RUN npm install -g @anthropic-ai/claude-code@2.1.289
USER node
WORKDIR /work

FROM mcr.microsoft.com/playwright:v1.62.0-jammy AS browser
RUN apt-get update \\
 && apt-get install -y --no-install-recommends git \\
 && rm -rf /var/lib/apt/lists/*
RUN npm install -g @anthropic-ai/claude-code@2.1.289
USER pwuser
WORKDIR /work`;

const CGROUP_SNIPPET = `systemd-run --user --unit=agent-a1 \\
  --same-dir --setenv=PATH --setenv=CLAUDE_CODE_OAUTH_TOKEN \\
  -p MemoryMax=2500M -p MemorySwapMax=0 \\
  -p TasksMax=512 -p CPUQuota=200% \\
  -p RuntimeMaxSec=3600 \\
  claude -p "$TASK"

systemctl --user stop agent-a1`;

const DELEGATE_SNIPPET = `sudo mkdir -p /etc/systemd/system/user@.service.d
sudo tee /etc/systemd/system/user@.service.d/delegate.conf <<'EOF'
[Service]
Delegate=cpu cpuset io memory pids
EOF
sudo systemctl daemon-reload`;

const SLOT_SNIPPET = `mkdir -p ~/.cache/agent-slots
for slot in 1 2 3; do
  exec 8>~/.cache/agent-slots/browser.$slot
  flock -n 8 && break
  exec 8>&-
done
[ -e /proc/self/fd/8 ] || { echo "no browser slot free"; exit 75; }`;

const content = {
  en: {
    kicker: 'AI Agents · Docker',
    title: (
      <>
        One Container<br /><em>per AI Agent</em>
      </>
    ),
    lede: 'When several coding agents share one machine, they are usually kept apart by convention: a lock per job, a port per script, a cleanup command that hopes it kills the right process. Giving each agent its own container makes the unit you isolate and the unit you reclaim the same thing. These are design notes for that setup, plus a lighter cgroup-only version for when containers cost more than they save.',
    body: (
      <>
        <p>On my workstation, a single WSL machine with 8 cores and about 10 GB of memory, several AI coding agents run at the same time. Some are subagents I start from an interactive session. Others are scheduled jobs that start a headless session every hour. They all run as the same user, in the same filesystem, against the same Docker daemon.</p>
        <p>What keeps them apart is mostly convention. Each scheduled job holds a file lock so it never overlaps with itself, but nothing stops two different jobs from running browser tests at once. A dev server on a fixed port collides as soon as two agents start one, and the obvious cleanup (kill whatever holds that port) would kill the other agent's server. I have had a lock held for days by a process that had already died, five parallel test suites that each started their own database containers wedge the Docker daemon, and an agent that was supposed to work in its own git worktree write into the main checkout anyway.</p>
        <p>These notes describe the setup I would move to: one container per agent. I haven't applied it yet. On a machine this small the setup cost looks larger than what it would save for now. Some of the pieces below I tested on the machine, and I say so where that's the case.</p>
        <h2>Isolation and Reclamation as One Unit</h2>
        <p>The goal here isn't a security sandbox. The goal is that everything an agent starts (its shell, dev servers, browsers, test databases) lives inside one boundary with a resource ceiling, and that one command removes all of it. A container gives both because a container is a cgroup. <code>docker rm -f</code> kills every process in it, including ones that daemonized themselves or started a new session.</p>
        <pre><code>{RUN_SNIPPET}</code></pre>
        <ul>
          <li><code>--cpus</code> caps total CPU time, and <code>--cpuset-cpus</code> pins the agent to specific cores. For checks that measure time, like frame time in a browser, pinning is better. A quota makes every agent equally slow, while pinned cores keep agents from disturbing each other.</li>
          <li><code>--memory</code> with the same value for <code>--memory-swap</code> turns swap off, so a leaking agent dies at its own ceiling instead of slowing down the whole machine.</li>
          <li><code>--pids-limit</code> stops a loop that keeps spawning processes.</li>
          <li><code>--shm-size</code> matters for browsers. Docker gives <code>/dev/shm</code> 64 MB by default, and Chromium crashes in it. <code>--ipc=host</code> also works but gives up part of the isolation.</li>
          <li><code>--init</code> runs a tiny init process as PID 1 that reaps zombies. Without it, an orphaned child that exits stays defunct until the container is gone.</li>
          <li>Labels let a sweeper find what belongs to which agent and how long it was allowed to run.</li>
        </ul>
        <p>On 10 GB the arithmetic is unforgiving. An agent with a headless browser, a dev server and the CLI itself needs 2 to 2.5 GB, so three slots is about the limit. Containers don't remove the need to cap how many agents run at once. They make each slot bounded.</p>
        <h2>Agents Talk Over the Network</h2>
        <p>Each container gets its own network namespace, and that alone fixes the port problem. Every agent can run its dev server on 5173, because each 5173 lives in a different namespace. Scripts that hardcode a port stop being a hazard.</p>
        <p>Agents that need to coordinate do it over a user-defined bridge network, where Docker's embedded DNS resolves container names. The pattern I would use is a small coordinator with a mailbox per agent. An agent posts a message to another agent's mailbox and long-polls its own. Code travels through git, as branches pushed to a shared remote, and never through a shared writable directory. A shared directory is the side channel the containers are there to remove.</p>
        <pre><code>{NETWORK_SNIPPET}</code></pre>
        <p>The agents' network is created with <code>--internal</code>, so nothing on it can reach the internet directly. Agents still need the model API, the git host and package registries, so one egress proxy joins both the internal network and a normal one and forwards only to an allowlist of hosts. Agents get <code>HTTPS_PROXY=http://proxy:3128</code>. This also limits what a prompt-injected agent can do, because it can't send data to an arbitrary host.</p>
        <h2>Containers Inside Containers, Only When Needed</h2>
        <p>Most agents never need Docker. The ones that do, for integration tests with Testcontainers or for building images, need a decision, because every option trades isolation against cost.</p>
        <table>
          <thead>
            <tr><th>Option</th><th>Isolation</th><th>Reclamation</th></tr>
          </thead>
          <tbody>
            <tr><td>Mount the host's Docker socket</td><td>None. Access to the socket is root on the host</td><td>Child containers are siblings, outside the agent's limits</td></tr>
            <tr><td>Docker-in-Docker (<code>--privileged</code>, own daemon)</td><td>Own daemon and storage, but the container is privileged</td><td>One <code>docker rm -f</code> removes everything, image cache included</td></tr>
            <tr><td>Sysbox runtime (<code>--runtime=sysbox-runc</code>)</td><td>A nested daemon without <code>--privileged</code></td><td>Same as Docker-in-Docker. The runtime must be installed on the host</td></tr>
            <tr><td>Rootless Podman inside the container</td><td>Good, and there is no daemon</td><td>Child processes stay inside the agent's cgroup</td></tr>
          </tbody>
        </table>
        <p>The socket option is the cheapest, and <code>--cgroup-parent</code> brings resource ceilings back to it. With the systemd cgroup driver the flag takes a slice name. I checked that <code>--cgroup-parent=agent-a1.slice</code> puts the container under <code>/agent.slice/agent-a1.slice</code>. If the agent's own container and every container it starts use the same slice, a limit set on the slice covers all of them, and stopping the slice reclaims them together. Setting slice properties needs root.</p>
        <pre><code>{NESTED_SNIPPET}</code></pre>
        <p>The weak spot is enforcement. The socket accepts any API call, so an agent can start a container without the flag. Forcing it would take a proxy in front of the socket that rewrites container-create requests. The socket proxies I know of filter which endpoints are allowed but don't add fields to a request.</p>
        <p>Testcontainers inside an agent container also has to know where sibling containers' ports are. They are published on the host, not inside the agent. Adding <code>host.docker.internal</code> as the host gateway and setting <code>TESTCONTAINERS_HOST_OVERRIDE</code> to it covers that.</p>
        <p>My default would be no Docker at all, the socket plus a slice for agents that start test databases, and Sysbox for agents that build images or need their own daemon. Five agents starting database containers on one shared daemon is how I wedged it. A separate daemon per agent moves that failure inside the agent that caused it.</p>
        <h2>Sharing Credentials Without Baking Them In</h2>
        <p>Agents need up to three kinds of credentials: the model API, the git host, and sometimes a cloud account. None of them belong in an image layer.</p>
        <ul>
          <li><strong>The model credential.</strong> The CLI's interactive login stores an OAuth token that it refreshes and writes back to a file. Mount that file into several containers and several processes race to refresh one token. A long-lived token from <code>claude setup-token</code>, or an API key, given to each container avoids the shared write.</li>
          <li><strong>Files, not environment variables.</strong> Environment variables show up in <code>docker inspect</code> and in every child process. A read-only file under <code>/run/secrets</code> stays out of both.</li>
          <li><strong>Short-lived git tokens.</strong> Instead of one personal token that can reach every repository, a coordinator that holds a GitHub App key mints an installation token per agent, scoped to the repositories that agent works on. These tokens expire after one hour, which is reclamation for credentials. A killed agent's token stops working on its own.</li>
          <li><strong>SSH.</strong> Mount the SSH agent's socket (<code>SSH_AUTH_SOCK</code>) instead of the keys.</li>
          <li><strong>Settings.</strong> Shared settings and agent definitions go in read-only. Each container gets its own writable home directory, so session state and caches don't collide.</li>
        </ul>
        <h2>How the Image Is Built</h2>
        <p>One image with everything in it gets large and slow to rebuild. I would split it by how often each part changes, as build targets of one Dockerfile.</p>
        <pre><code>{IMAGE_SNIPPET}</code></pre>
        <ul>
          <li>Toolchains are separate targets: Node, JVM and Python agents don't need to carry each other's runtimes.</li>
          <li>The browser target starts from Playwright's official image, pinned to the Playwright version the project uses. If the versions differ, the browsers in the image don't match what the test library expects. That image is about 2.3 GB on my machine, the largest piece by far.</li>
          <li>The CLI version is pinned in the image. An upgrade becomes a rebuild, never something that changes under a running agent.</li>
          <li>Caches live in volumes. npm's content-addressed cache is built to tolerate concurrent use, so one named volume can be shared. <code>node_modules</code> stays per worktree, in a volume tied to that agent.</li>
          <li>The image runs as a non-root user, and no secret is in any layer.</li>
        </ul>
        <h2>What Reclamation Looks Like, and What It Doesn't Fix</h2>
        <p>The lifecycle is short. A wrapper starts the container with <code>--rm</code> and labels, and when the task ends it removes the container and the agent's worktree. A sweeper on a timer removes anything whose label says it has outlived its time budget. A timeout that removes a container takes the whole process tree with it, which a timeout around one process can't promise.</p>
        <p>Three things stay unsolved. A process stuck in uninterruptible kernel I/O (D state), for example after disk errors, can't be killed from user space, and removing its container hangs too. The Docker daemon is one shared point of failure, so when it wedges every agent stops. And memory is still the budget, so a cap on concurrent agents is still needed.</p>
        <h2>The Lighter Alternative: A cgroup per Agent</h2>
        <p>Most of the reclamation benefit comes from the cgroup, not the container. systemd can create one per agent without images, mounts or credential plumbing.</p>
        <pre><code>{CGROUP_SNIPPET}</code></pre>
        <p>I tested this on the machine. A child that escaped with <code>setsid</code> was still inside the unit, and <code>systemctl --user stop</code> removed it. <code>MemoryMax</code> and <code>TasksMax</code> were applied. <code>CPUQuota</code> was not. The user session there (systemd 249) delegates only the memory and pids controllers, so the CPU limit was dropped without any error. Enabling it takes a drop-in for <code>user@.service</code> and a new login.</p>
        <pre><code>{DELEGATE_SNIPPET}</code></pre>
        <p>A transient unit doesn't inherit the shell's environment or working directory, which is what <code>--same-dir</code> and <code>--setenv</code> are for. And a cgroup isolates neither the network nor the filesystem, so it needs three conventions alongside it.</p>
        <ul>
          <li><strong>Dynamic ports.</strong> Pick a port per run and start the server with a strict-port option, so it fails instead of drifting to the next port. Clean up by unit or process group, never by port.</li>
          <li><strong>A git worktree per agent.</strong> Then check the main checkout afterwards, because an agent can still write outside its worktree.</li>
          <li><strong>Slots for scarce resources.</strong> N lock files act as a counting semaphore. An agent that needs a browser takes a free slot or waits.</li>
        </ul>
        <pre><code>{SLOT_SNIPPET}</code></pre>
        <table>
          <thead>
            <tr><th></th><th>Container per agent</th><th>cgroup per agent</th></tr>
          </thead>
          <tbody>
            <tr><td>Resource ceiling</td><td>CPU, memory, processes, shared memory</td><td>Memory and processes (CPU after delegation)</td></tr>
            <tr><td>Reclamation</td><td><code>docker rm -f</code> removes every process</td><td><code>systemctl --user stop</code> removes every process</td></tr>
            <tr><td>Port collisions</td><td>Gone (own network namespace)</td><td>Need dynamic ports</td></tr>
            <tr><td>Filesystem</td><td>Only what is mounted</td><td>Everything the user can reach</td></tr>
            <tr><td>Agent-to-agent channel</td><td>Network with DNS names</td><td>Whatever the agents agree on</td></tr>
            <tr><td>Setup cost</td><td>Images, mounts, credentials, networks</td><td>One command around the existing one</td></tr>
          </tbody>
        </table>
        <p>My order would be the cgroup first. It wraps the command I already run, and it fixes the failure I see most often, which is something left running after its agent is gone. Containers come in once port and filesystem collisions start to cost more than the setup, or once more agents run at the same time than a handful of locks can keep apart.</p>
        <div className="article-note"><strong>Further reading</strong><p>
          <a href="https://docs.docker.com/engine/containers/resource_constraints/" target="_blank" rel="noreferrer">Docker: resource constraints</a> (every flag used for the per-agent ceiling) · <a href="https://www.freedesktop.org/software/systemd/man/latest/systemd.resource-control.html" target="_blank" rel="noreferrer">systemd.resource-control</a> (<code>MemoryMax</code>, <code>CPUQuota</code>, <code>TasksMax</code> and delegation) · <a href="https://github.com/nestybox/sysbox" target="_blank" rel="noreferrer">Sysbox</a> (nested Docker without a privileged container) · <a href="/posts/containerized-development-experience">Developer Experience in Containerized Environments</a> (the same container contract, from the human developer's side)
        </p></div>
      </>
    ),
  },
  ko: {
    kicker: 'AI Agents · Docker',
    title: (
      <>
        AI 에이전트마다<br /><em>컨테이너 하나씩</em>
      </>
    ),
    lede: '코딩 에이전트 여러 개가 머신 하나를 같이 쓰면, 보통은 약속으로 서로를 떼어 놓는다. 작업마다 락을 하나씩 걸고, 스크립트마다 포트를 정하고, 정리 명령이 엉뚱한 프로세스를 죽이지 않기를 바란다. 에이전트마다 컨테이너를 하나씩 주면 격리하는 단위와 회수하는 단위가 같아진다. 그 설계를 정리하고, 컨테이너가 과할 때 쓸 cgroup만으로 하는 가벼운 방법도 같이 적었다.',
    body: (
      <>
        <p>내 작업용 머신은 8코어에 메모리 10GB 남짓인 WSL 한 대다. 여기서 AI 코딩 에이전트 여러 개가 동시에 돈다. 대화형 세션에서 띄우는 서브에이전트도 있고, 매시간 헤드리스 세션을 띄우는 예약 작업도 있다. 모두 같은 사용자로, 같은 파일시스템에서, 같은 Docker 데몬을 쓴다.</p>
        <p>이들을 떼어 놓는 건 대부분 약속이다. 예약 작업마다 파일 락을 걸어 자기 자신과는 겹치지 않게 했지만, 서로 다른 두 작업이 브라우저 테스트를 동시에 돌리는 건 막지 못한다. 포트를 고정한 개발 서버는 에이전트 둘이 띄우는 순간 부딪친다. 그 포트를 잡은 프로세스를 죽이는 손쉬운 정리 방법은 다른 에이전트의 서버까지 죽인다. 이미 죽은 프로세스가 락을 며칠씩 쥐고 있던 적이 있다. 테스트 5개를 병렬로 돌렸더니 저마다 데이터베이스 컨테이너를 띄우다가 Docker 데몬이 멈춘 적도 있다. 자기 git 워크트리에서만 일해야 할 에이전트가 메인 체크아웃에 파일을 써 넣은 일도 있었다.</p>
        <p>그래서 옮겨 갈 구조를 정리해 둔다. 에이전트마다 컨테이너를 하나씩 주는 구조다. 아직 적용하지는 않았다. 이 정도 크기의 머신에서는 준비 비용이 얻는 것보다 커 보여서다. 아래 내용 중 일부는 이 머신에서 직접 시험했고, 그런 곳은 따로 밝혔다.</p>
        <h2>격리와 회수를 한 단위로</h2>
        <p>목표는 보안 샌드박스가 아니다. 에이전트가 띄운 모든 것(셸, 개발 서버, 브라우저, 테스트용 데이터베이스)을 자원 상한이 있는 경계 하나 안에 두고, 명령 하나로 전부 걷어 내는 것이다. 컨테이너는 그 자체가 cgroup이라 둘 다 된다. <code>docker rm -f</code>는 컨테이너 안의 프로세스를 모두 죽인다. 스스로 데몬이 된 프로세스나 새 세션을 연 프로세스도 빠지지 않는다.</p>
        <pre><code>{RUN_SNIPPET}</code></pre>
        <ul>
          <li><code>--cpus</code>는 CPU 사용 시간 총량을 막고, <code>--cpuset-cpus</code>는 에이전트를 특정 코어에 묶는다. 브라우저 프레임 시간처럼 시간을 재는 검사가 있으면 코어를 묶는 쪽이 낫다. 총량 제한은 모든 에이전트를 똑같이 느리게 만들 뿐이고, 코어를 나눠 주면 서로를 흔들지 않는다.</li>
          <li><code>--memory</code>와 <code>--memory-swap</code>을 같은 값으로 주면 스왑이 꺼진다. 메모리가 새는 에이전트는 머신 전체를 느리게 만드는 대신 자기 상한에서 죽는다.</li>
          <li><code>--pids-limit</code>는 프로세스를 끝없이 띄우는 루프를 멈춘다.</li>
          <li><code>--shm-size</code>는 브라우저에 필요하다. Docker는 <code>/dev/shm</code>을 기본 64MB로 주는데, Chromium은 여기서 죽는다. <code>--ipc=host</code>로도 해결되지만 격리를 일부 포기하게 된다.</li>
          <li><code>--init</code>을 주면 아주 작은 init 프로세스가 PID 1이 되어 좀비를 거둔다. 이게 없으면 부모를 잃은 자식이 끝난 뒤에도 컨테이너가 없어질 때까지 defunct로 남는다.</li>
          <li>라벨이 있으면 정리 작업이 무엇이 어느 에이전트 것인지, 얼마나 돌아도 되는지 알 수 있다.</li>
        </ul>
        <p>10GB에서는 계산이 빡빡하다. 헤드리스 브라우저와 개발 서버, CLI까지 띄운 에이전트 하나가 2~2.5GB를 쓰니 동시에 3칸 정도가 한계다. 컨테이너를 써도 동시에 도는 에이전트 수는 따로 막아야 한다. 컨테이너가 해 주는 건 칸마다 상한을 거는 일이다.</p>
        <h2>에이전트끼리는 네트워크로 말한다</h2>
        <p>컨테이너마다 네트워크 네임스페이스가 따로 생기고, 이것만으로 포트 문제가 풀린다. 모든 에이전트가 개발 서버를 5173에 띄워도 된다. 5173이 저마다 다른 네임스페이스에 있기 때문이다. 포트를 박아 둔 스크립트도 더는 위험하지 않다.</p>
        <p>서로 협업해야 하는 에이전트는 사용자 정의 브리지 네트워크로 묶는다. 이 네트워크에서는 Docker 내장 DNS가 컨테이너 이름을 풀어 준다. 나라면 에이전트마다 메일함을 하나씩 둔 작은 조정자 서비스를 쓰겠다. 에이전트는 상대 메일함에 메시지를 POST하고, 자기 메일함은 롱 폴링으로 기다린다. 코드는 git으로 오간다. 공유 원격 저장소에 가지를 푸시하는 식이고, 같이 쓰는 쓰기 가능 디렉터리는 두지 않는다. 그런 디렉터리가 바로 컨테이너로 없애려는 옆길이다.</p>
        <pre><code>{NETWORK_SNIPPET}</code></pre>
        <p>에이전트 네트워크는 <code>--internal</code>로 만들어 인터넷에 직접 나가지 못하게 한다. 그래도 모델 API, git 호스트, 패키지 레지스트리에는 닿아야 하니, 내부 네트워크와 일반 네트워크에 함께 붙은 프록시 하나를 두고 허용 목록에 있는 호스트로만 내보낸다. 에이전트에는 <code>HTTPS_PROXY=http://proxy:3128</code>를 준다. 프롬프트 인젝션에 넘어간 에이전트가 할 수 있는 일도 이걸로 줄어든다. 아무 호스트로나 데이터를 보낼 수 없기 때문이다.</p>
        <h2>컨테이너 안의 컨테이너는 필요할 때만</h2>
        <p>대부분의 에이전트는 Docker가 필요 없다. Testcontainers로 통합 테스트를 돌리거나 이미지를 빌드하는 에이전트는 필요한데, 어느 방법이든 격리와 비용을 맞바꾸므로 골라야 한다.</p>
        <table>
          <thead>
            <tr><th>방법</th><th>격리</th><th>회수</th></tr>
          </thead>
          <tbody>
            <tr><td>호스트 Docker 소켓 마운트</td><td>없다. 소켓에 접근하면 호스트 root와 같다</td><td>자식 컨테이너가 형제로 떠서 에이전트 상한 밖에 있다</td></tr>
            <tr><td>Docker-in-Docker(<code>--privileged</code>, 자체 데몬)</td><td>데몬과 저장소가 따로지만 컨테이너가 특권을 갖는다</td><td><code>docker rm -f</code> 한 번에 이미지 캐시까지 전부 사라진다</td></tr>
            <tr><td>Sysbox 런타임(<code>--runtime=sysbox-runc</code>)</td><td><code>--privileged</code> 없이 안쪽 데몬을 띄운다</td><td>Docker-in-Docker와 같다. 호스트에 런타임을 설치해야 한다</td></tr>
            <tr><td>컨테이너 안의 rootless Podman</td><td>좋다. 데몬도 없다</td><td>자식 프로세스가 에이전트 cgroup 안에 머문다</td></tr>
          </tbody>
        </table>
        <p>가장 싼 건 소켓 마운트다. 여기에 <code>--cgroup-parent</code>를 쓰면 자원 상한을 되찾을 수 있다. systemd cgroup 드라이버에서는 이 옵션에 슬라이스 이름을 준다. <code>--cgroup-parent=agent-a1.slice</code>로 띄운 컨테이너가 <code>/agent.slice/agent-a1.slice</code> 아래에 붙는 것을 확인했다. 에이전트 자신의 컨테이너와 그 에이전트가 띄우는 컨테이너가 모두 같은 슬라이스를 쓰면, 슬라이스에 건 상한이 전부에 적용되고 슬라이스를 멈추면 함께 회수된다. 슬라이스 속성을 바꾸려면 root가 필요하다.</p>
        <pre><code>{NESTED_SNIPPET}</code></pre>
        <p>약점은 강제할 수 없다는 점이다. 소켓은 어떤 API 호출이든 받으니, 에이전트가 이 옵션 없이 컨테이너를 띄우면 그만이다. 강제하려면 소켓 앞에 프록시를 두고 컨테이너 생성 요청을 고쳐 써야 한다. 내가 아는 소켓 프록시들은 어떤 엔드포인트를 허용할지만 거르고, 요청에 필드를 더해 주지는 않는다.</p>
        <p>에이전트 컨테이너 안에서 Testcontainers를 쓰려면 형제 컨테이너의 포트가 어디 있는지도 알려 줘야 한다. 포트는 에이전트 안이 아니라 호스트에 열린다. <code>host.docker.internal</code>을 호스트 게이트웨이로 추가하고 <code>TESTCONTAINERS_HOST_OVERRIDE</code>에 그 이름을 주면 된다.</p>
        <p>내 기본값은 이렇다. 보통은 Docker를 주지 않는다. 테스트용 데이터베이스를 띄우는 에이전트에는 소켓과 슬라이스를 준다. 이미지를 빌드하거나 자기 데몬이 필요한 에이전트에는 Sysbox를 쓴다. 공유 데몬 하나에서 에이전트 5개가 데이터베이스 컨테이너를 띄우다 데몬을 멈춰 세운 적이 있다. 에이전트마다 데몬을 따로 주면 그런 고장이 그 고장을 낸 에이전트 안에서 끝난다.</p>
        <h2>인증 정보는 나눠 주되 이미지에 굽지 않는다</h2>
        <p>에이전트에 필요한 인증 정보는 많아야 세 가지다. 모델 API, git 호스트, 가끔 클라우드 계정이다. 어느 것도 이미지 레이어에 들어가면 안 된다.</p>
        <ul>
          <li><strong>모델 인증.</strong> CLI의 대화형 로그인은 OAuth 토큰을 파일에 저장하고, 갱신할 때마다 그 파일에 다시 쓴다. 이 파일을 여러 컨테이너에 마운트하면 여러 프로세스가 토큰 하나를 서로 갱신하려고 다툰다. <code>claude setup-token</code>으로 만든 장기 토큰이나 API 키를 컨테이너마다 넘기면 같은 파일에 쓸 일이 없다.</li>
          <li><strong>환경 변수 말고 파일로.</strong> 환경 변수는 <code>docker inspect</code>에도, 모든 자식 프로세스에도 보인다. <code>/run/secrets</code> 아래 읽기 전용 파일로 넘기면 어디에도 드러나지 않는다.</li>
          <li><strong>수명이 짧은 git 토큰.</strong> 모든 저장소에 닿는 개인 토큰 하나를 돌려 쓰는 대신, GitHub App 키를 쥔 조정자가 에이전트마다 설치 토큰을 발급한다. 범위는 그 에이전트가 일하는 저장소로 좁힌다. 이 토큰은 1시간 뒤 만료되는데, 인증 정보 쪽의 회수가 바로 이것이다. 죽은 에이전트의 토큰은 알아서 못 쓰게 된다.</li>
          <li><strong>SSH.</strong> 키 대신 SSH 에이전트 소켓(<code>SSH_AUTH_SOCK</code>)을 마운트한다.</li>
          <li><strong>설정.</strong> 공용 설정과 에이전트 정의는 읽기 전용으로 넣는다. 홈 디렉터리는 컨테이너마다 쓰기 가능한 것을 따로 줘서 세션 상태와 캐시가 섞이지 않게 한다.</li>
        </ul>
        <h2>이미지는 바뀌는 빈도로 나눈다</h2>
        <p>모든 걸 담은 이미지 하나는 커지고 다시 빌드하기도 느리다. 부분마다 얼마나 자주 바뀌는지에 따라 나눠서, Dockerfile 하나의 빌드 타깃으로 두겠다.</p>
        <pre><code>{IMAGE_SNIPPET}</code></pre>
        <ul>
          <li>툴체인은 타깃을 나눈다. Node, JVM, Python 에이전트가 서로의 런타임을 짊어질 이유가 없다.</li>
          <li>브라우저 타깃은 Playwright 공식 이미지에서 시작하고, 프로젝트가 쓰는 Playwright 버전에 맞춰 고정한다. 버전이 다르면 이미지 안의 브라우저가 테스트 라이브러리가 기대하는 것과 어긋난다. 이 이미지가 내 머신에서 2.3GB쯤으로 단연 가장 크다.</li>
          <li>CLI 버전도 이미지에 고정한다. 업그레이드는 다시 빌드하는 일이 되고, 돌고 있는 에이전트 밑에서 바뀌는 일은 없어진다.</li>
          <li>캐시는 볼륨에 둔다. npm 캐시는 내용 주소 방식이라 동시에 써도 버티게 만들어져 있어서, 이름 붙인 볼륨 하나를 같이 써도 된다. <code>node_modules</code>는 워크트리마다 따로, 그 에이전트에 딸린 볼륨에 둔다.</li>
          <li>root가 아닌 사용자로 돌리고, 어느 레이어에도 비밀값을 넣지 않는다.</li>
        </ul>
        <h2>회수는 어떻게 되고, 무엇은 못 고치나</h2>
        <p>생명 주기는 짧다. 래퍼가 <code>--rm</code>과 라벨을 붙여 컨테이너를 띄우고, 작업이 끝나면 컨테이너와 그 에이전트의 워크트리를 지운다. 타이머로 도는 정리 작업은 라벨에 적힌 시간 예산을 넘긴 것을 걷어 낸다. 시간 초과로 컨테이너를 지우면 프로세스 트리 전체가 같이 사라진다. 프로세스 하나에 건 timeout으로는 장담할 수 없는 일이다.</p>
        <p>그래도 남는 문제가 셋 있다. 디스크 오류 같은 이유로 커널 I/O 대기(D 상태)에 빠진 프로세스는 사용자 공간에서 죽일 수 없고, 그 컨테이너를 지우는 명령도 같이 멈춘다. Docker 데몬은 모두가 같이 쓰는 단일 장애점이라, 데몬이 멈추면 모든 에이전트가 멈춘다. 메모리는 여전히 예산이라 동시에 도는 에이전트 수는 계속 막아야 한다.</p>
        <h2>더 가벼운 방법, 에이전트마다 cgroup 하나</h2>
        <p>회수 효과의 대부분은 컨테이너보다 cgroup에서 나온다. systemd를 쓰면 이미지도 마운트도 인증 배관도 없이 에이전트마다 cgroup을 하나씩 만들 수 있다.</p>
        <pre><code>{CGROUP_SNIPPET}</code></pre>
        <p>이 머신에서 시험해 봤다. <code>setsid</code>로 빠져나간 자식도 유닛 안에 그대로 있었고, <code>systemctl --user stop</code>이 그것까지 지웠다. <code>MemoryMax</code>와 <code>TasksMax</code>는 적용됐다. <code>CPUQuota</code>는 적용되지 않았다. 이 머신의 사용자 세션(systemd 249)은 memory와 pids 컨트롤러만 위임받아서, CPU 상한은 오류 하나 없이 버려졌다. 켜려면 <code>user@.service</code>에 드롭인을 넣고 다시 로그인해야 한다.</p>
        <pre><code>{DELEGATE_SNIPPET}</code></pre>
        <p>임시 유닛은 셸의 환경 변수와 작업 디렉터리를 물려받지 않는다. <code>--same-dir</code>과 <code>--setenv</code>가 그래서 있다. 그리고 cgroup은 네트워크도 파일시스템도 격리하지 않으니, 약속 세 가지를 같이 둬야 한다.</p>
        <ul>
          <li><strong>동적 포트.</strong> 실행마다 포트를 고르고, 서버는 strict port 옵션으로 띄워 다음 포트로 슬쩍 옮겨 가는 대신 실패하게 한다. 정리는 포트가 아닌 유닛이나 프로세스 그룹 단위로 한다.</li>
          <li><strong>에이전트마다 git 워크트리.</strong> 그래도 에이전트가 워크트리 밖에 쓸 수 있으니, 끝나면 메인 체크아웃도 확인한다.</li>
          <li><strong>귀한 자원에는 칸을 둔다.</strong> 락 파일 N개를 카운팅 세마포어로 쓴다. 브라우저가 필요한 에이전트는 빈 칸을 잡거나 기다린다.</li>
        </ul>
        <pre><code>{SLOT_SNIPPET}</code></pre>
        <table>
          <thead>
            <tr><th></th><th>에이전트마다 컨테이너</th><th>에이전트마다 cgroup</th></tr>
          </thead>
          <tbody>
            <tr><td>자원 상한</td><td>CPU, 메모리, 프로세스 수, 공유 메모리</td><td>메모리, 프로세스 수(CPU는 위임 설정 뒤)</td></tr>
            <tr><td>회수</td><td><code>docker rm -f</code>가 모든 프로세스를 지운다</td><td><code>systemctl --user stop</code>이 모든 프로세스를 지운다</td></tr>
            <tr><td>포트 충돌</td><td>없다(네트워크 네임스페이스가 따로)</td><td>동적 포트가 필요하다</td></tr>
            <tr><td>파일시스템</td><td>마운트한 것만 보인다</td><td>사용자가 닿는 곳은 다 보인다</td></tr>
            <tr><td>에이전트 사이 통신</td><td>DNS 이름이 있는 네트워크</td><td>에이전트끼리 정한 방식</td></tr>
            <tr><td>준비 비용</td><td>이미지, 마운트, 인증 정보, 네트워크</td><td>지금 쓰는 명령 앞에 명령 하나</td></tr>
          </tbody>
        </table>
        <p>나라면 cgroup부터 하겠다. 지금 쓰는 명령을 감싸기만 하면 되고, 가장 자주 겪는 고장인 "에이전트는 끝났는데 뭔가 남아서 돈다"를 바로 고친다. 컨테이너는 포트와 파일시스템 충돌이 준비 비용보다 비싸지기 시작할 때, 혹은 락 몇 개로는 떼어 놓기 어려울 만큼 많은 에이전트가 한꺼번에 돌 때 들여오면 된다.</p>
        <div className="article-note"><strong>더 볼 자료</strong><p>
          <a href="https://docs.docker.com/engine/containers/resource_constraints/" target="_blank" rel="noreferrer">Docker: resource constraints</a>(에이전트별 상한에 쓴 옵션 전체) · <a href="https://www.freedesktop.org/software/systemd/man/latest/systemd.resource-control.html" target="_blank" rel="noreferrer">systemd.resource-control</a>(<code>MemoryMax</code>, <code>CPUQuota</code>, <code>TasksMax</code>와 위임) · <a href="https://github.com/nestybox/sysbox" target="_blank" rel="noreferrer">Sysbox</a>(특권 컨테이너 없이 Docker를 중첩하는 런타임) · <a href="/posts/containerized-development-experience">컨테이너화된 환경의 개발자 경험</a>(같은 컨테이너 계약을 사람 개발자 쪽에서 본 글)
        </p></div>
      </>
    ),
  },
};

export default function OneContainerPerAgent() {
  const { locale } = useLocale();
  const c = content[locale];

  return (
    <PostLayout slug="one-container-per-agent" kicker={c.kicker} title={c.title} lede={c.lede}>
      {c.body}
    </PostLayout>
  );
}
