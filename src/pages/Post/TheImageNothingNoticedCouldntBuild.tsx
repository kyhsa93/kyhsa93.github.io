import PostLayout from '../../components/PostLayout';
import { useLocale, localeFromPathname } from '../../lib/locale';
import type { MetaFunction } from 'react-router';
import { createPostMeta } from '../../lib/seo';

export const meta: MetaFunction = ({ location }) =>
  createPostMeta('the-image-nothing-noticed-couldnt-build', localeFromPathname(location.pathname));

const content = {
  en: {
    kicker: 'Architecture · Tooling',
    title: (
      <>
        The Image Nothing Noticed<br /><em>Couldn't Build</em>
      </>
    ),
    lede: 'A Spring Boot 4 migration that started by checking whether it was even necessary — a stale doc said yes, git history said it had already happened two weeks earlier — ended a day later with every check green and the actual deployable container image unable to build at all, because nothing in CI was watching the one file whose meaning had just changed underneath it.',
    body: (
      <>
        <p>The root doc still described the Java implementation as running Spring Boot 3.3. Before starting that migration, checking <code>git log -S</code> on the build file instead of trusting the doc turned up something the doc hadn't caught up to: Java had already made the jump, two weeks earlier, in a single commit whose message read less like a version bump and more like a small essay of everything it had to route around. The doc was stale, not the code. That one check saved a day of redoing work that had already shipped — and set the pattern for the rest of the round: check the actual state before trusting what anything claims about it, docs included.</p>
        <h2>Kotlin's Turn, and a Dependency Chain That Broke Quietly</h2>
        <p>Kotlin hadn't migrated yet, and Boot 4's Gradle plugin turned out to no longer integrate with <code>io.spring.dependency-management</code> at all — the switch to native <code>platform()</code> BOMs was straightforward, but the first build afterward looked clean for the wrong reason: <code>build -x test</code> skips compiling the test sources entirely, so a real dependency-resolution break in the test classpath sat there unnoticed until something actually tried to compile against it.</p>
        <p>Testcontainers had its own version of the same shape of surprise. The project already imported a <code>testcontainers-bom</code>, and it turned out to have been a complete no-op the entire time — Boot 3's own BOM had been silently supplying a version for the old-named artifacts, so the explicit import never did anything at all. Only renaming to Testcontainers 2.x's actual artifact names — <code>testcontainers-junit-jupiter</code> and its siblings — made the previously-invisible BOM start mattering.</p>
        <h2>A Library That "Doesn't Exist," According to the Wrong Source</h2>
        <p>Resilience4j's Boot-3 starter crashes at application startup under Boot 4 — a verifier built into the library itself refuses to run. Searching for a Boot-4 replacement came up empty on the package search index's own web UI, which read as "nothing published yet." A rate limiter is small enough to hand-wire, so that's what happened: a manually assembled registry reading the same configuration keys the missing starter would have. It worked. Tests passed. The harness passed.</p>
        <div className="article-note"><strong>The search index isn't the repository</strong><p>Only later, cross-checking against what Java's own dependency list already used, did the actual answer turn up: <code>resilience4j-spring-boot4</code> existed on the real package repository the whole time — a direct probe of the repository's own file path returned it immediately. The web search UI simply hadn't indexed it. The hand-wired workaround came out, replaced by the real starter Java had already been using for two weeks. A package index's search box not finding something is a claim about that index, not about what's actually published — worth a direct probe before trusting it.</p></div>
        <h2>One Line of Actual Application Code</h2>
        <p>Underneath all the dependency and configuration churn, exactly one line of real business logic needed to change. Spring Security 7's JSpecify nullability annotations mark <code>PasswordEncoder.encode</code> as nullable, and Kotlin's null-safety caught it immediately at compile time — a <code>checkNotNull()</code> wrap around a call that, in practice, never actually returns null. Everything else in the entire migration was infrastructure and configuration; this was the only place the framework upgrade touched logic a developer had actually written.</p>
        <h2>The Check Nobody Had Pointed at the Right File</h2>
        <p>The migration looked finished: build green, full test suite green, harness green, pushed. The next day, an unrelated scheduled job — a weekly container-image security scan — failed. The Kotlin service's Dockerfile was still building on a <code>gradle:8.10</code> base image, not the repository's own 8.14+ wrapper, and Spring Boot 4.1's Gradle plugin requires Gradle 8.14 or later. The actual deployable container image had been unable to build for a full day, with every other check reporting green, because the image-scan workflow's trigger only watched changes to the Dockerfile itself — and this migration had touched the build file, never the Dockerfile.</p>
        <p>The base image version was the easy part to fix. The trigger was the part worth fixing properly: it now also watches each language's dependency manifest, not just its Dockerfile, so the next toolchain bump that quietly outgrows a base image gets caught by the same push that caused it, instead of by whatever scheduled job happens to run next.</p>
        <p>Three separate points in the same migration, each one trusting a source that turned out to be wrong about the thing that actually mattered: a doc claiming work was still pending that had already shipped, a search index claiming a package didn't exist that was sitting right there in the repository, and a green CI board claiming a migration was complete while the one artifact it was ostensibly protecting couldn't be built at all.</p>
        <div className="article-note"><strong>Further reading in the repo</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/implementations/kotlin-springboot/examples/build.gradle.kts" target="_blank" rel="noreferrer">build.gradle.kts</a> — the native platform() BOMs, resilience4j-spring-boot4, and everything else the migration touched · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/.github/workflows/docker-image-scan.yml" target="_blank" rel="noreferrer">docker-image-scan.yml</a> — the widened trigger
        </p></div>
      </>
    ),
  },
  ko: {
    kicker: 'Architecture · Tooling',
    title: (
      <>
        아무도 눈치채지 못한<br /><em>빌드 안 되는 이미지</em>
      </>
    ),
    lede: '이게 애초에 필요한 작업인지 확인하는 것으로 시작한 Spring Boot 4 마이그레이션 — 낡은 문서는 그렇다고 했고, git 히스토리는 이미 2주 전에 끝났다고 했다 — 은 하루 뒤, 모든 체크가 초록인데 실제 배포 가능한 컨테이너 이미지는 아예 빌드가 안 되는 상태로 끝났다. CI 안 그 무엇도, 바로 밑에서 의미가 바뀌어버린 그 파일 하나를 지켜보고 있지 않았기 때문이다.',
    body: (
      <>
        <p>루트 문서는 여전히 java 구현체가 Spring Boot 3.3을 쓰고 있다고 서술하고 있었다. 그 마이그레이션을 시작하기 전, 문서를 믿는 대신 빌드 파일에 <code>git log -S</code>를 돌려보니 문서가 따라잡지 못한 게 드러났다: java는 이미 2주 전에 그 도약을 마쳤고, 커밋 메시지 하나가 버전 업이라기보다 우회해야 했던 모든 것에 대한 작은 에세이처럼 읽혔다. 낡은 건 문서였지 코드가 아니었다. 이 확인 하나가 이미 배포된 작업을 다시 하는 하루를 아꼈다 — 그리고 이번 라운드 나머지의 패턴을 정했다: 무언가가 스스로에 대해 주장하는 걸 믿기 전에 실제 상태를 확인하라, 문서도 예외 없이.</p>
        <h2>kotlin 차례, 그리고 조용히 깨진 의존성 체인</h2>
        <p>kotlin은 아직 마이그레이션 전이었고, Boot 4의 Gradle 플러그인은 더 이상 <code>io.spring.dependency-management</code>와 연동하지 않았다 — 네이티브 <code>platform()</code> BOM으로의 전환은 단순했지만, 그 뒤 첫 빌드는 엉뚱한 이유로 깨끗해 보였다: <code>build -x test</code>는 테스트 소스 컴파일 자체를 건너뛰어서, 테스트 클래스패스의 진짜 의존성 해석 붕괴가 실제로 뭔가가 그걸 컴파일하려 시도할 때까지 눈에 띄지 않은 채 남아 있었다.</p>
        <p>Testcontainers도 같은 모양의 놀라움을 자기만의 버전으로 갖고 있었다. 프로젝트는 이미 <code>testcontainers-bom</code>을 임포트하고 있었는데, 알고 보니 그게 내내 완전한 무동작이었다 — Boot 3 자신의 BOM이 옛 이름의 아티팩트에 조용히 버전을 공급해주고 있어서, 명시적인 임포트는 아무것도 한 적이 없었다. Testcontainers 2.x의 실제 아티팩트 이름 — <code>testcontainers-junit-jupiter</code>와 그 형제들 — 로 리네이밍하고 나서야 지금까지 보이지 않던 그 BOM이 비로소 의미를 갖기 시작했다.</p>
        <h2>잘못된 곳에서 보면 "존재하지 않는" 라이브러리</h2>
        <p>resilience4j의 Boot 3 스타터는 Boot 4에서 애플리케이션 부팅 시점에 크래시한다 — 라이브러리 자체에 내장된 검증기가 실행을 거부한다. Boot 4용 대체재를 검색해보니 패키지 검색 인덱스의 웹 UI에서는 아무것도 안 나왔고, 이건 "아직 아무것도 공개되지 않았다"로 읽혔다. rate limiter는 손으로 만들기엔 충분히 작으니, 그렇게 했다: 없는 스타터가 했을 것과 같은 설정 키를 읽는, 손으로 조립한 레지스트리. 동작했다. 테스트도 통과했다. 하네스도 통과했다.</p>
        <div className="article-note"><strong>검색 인덱스는 저장소가 아니다</strong><p>나중에서야, java 자신의 의존성 목록이 이미 쓰고 있던 것과 대조해보다가, 진짜 답이 나왔다: <code>resilience4j-spring-boot4</code>는 실제 패키지 저장소에 내내 존재하고 있었다 — 저장소 자신의 파일 경로를 직접 조회하니 즉시 나왔다. 웹 검색 UI가 그냥 인덱싱을 안 해뒀을 뿐이었다. 손으로 조립한 우회책은 빠지고, java가 이미 2주째 쓰고 있던 진짜 스타터로 교체됐다. 패키지 인덱스의 검색창이 뭔가를 못 찾는다는 건 그 인덱스에 대한 주장이지 실제로 뭐가 공개돼 있는지에 대한 주장이 아니다 — 믿기 전에 직접 조회해볼 가치가 있다.</p></div>
        <h2>실제 애플리케이션 코드는 딱 한 줄</h2>
        <p>이 모든 의존성·설정 요동 밑에서, 실제로 바뀌어야 했던 진짜 비즈니스 로직은 딱 한 줄이었다. Spring Security 7의 JSpecify nullability 애노테이션이 <code>PasswordEncoder.encode</code>를 nullable로 표시하고, kotlin의 null 안전성이 컴파일 시점에 즉시 이걸 잡아냈다 — 실제로는 절대 null을 반환하지 않는 호출을 <code>checkNotNull()</code>로 감싼 것. 전체 마이그레이션의 나머지 전부는 인프라와 설정이었다 — 이게 프레임워크 업그레이드가 개발자가 실제로 작성한 로직을 건드린 유일한 지점이었다.</p>
        <h2>아무도 올바른 파일을 가리키고 있지 않던 체크</h2>
        <p>마이그레이션은 끝난 것처럼 보였다: 빌드 초록, 전체 테스트 스위트 초록, 하네스 초록, push 완료. 다음 날, 무관해 보이는 예약 작업 — 주간 컨테이너 이미지 보안 스캔 — 이 실패했다. kotlin 서비스의 Dockerfile은 여전히 <code>gradle:8.10</code> 베이스 이미지로 빌드하고 있었다, 저장소 자체의 8.14+ 래퍼가 아니라. 그리고 Spring Boot 4.1의 Gradle 플러그인은 Gradle 8.14 이상을 요구한다. 실제 배포 가능한 컨테이너 이미지는 하루 온전히 빌드가 안 되고 있었다, 다른 모든 체크가 초록을 보고하는 동안. 이미지 스캔 워크플로의 트리거가 오직 Dockerfile 자체의 변경만 지켜보고 있었기 때문이다 — 그리고 이번 마이그레이션은 빌드 파일을 건드렸지, Dockerfile은 한 번도 건드리지 않았다.</p>
        <p>베이스 이미지 버전은 고치기 쉬운 부분이었다. 제대로 고칠 가치가 있던 건 트리거였다: 이제는 각 언어의 Dockerfile뿐 아니라 의존성 매니페스트도 함께 지켜본다. 그래야 다음번에 베이스 이미지를 조용히 뛰어넘는 툴체인 업그레이드가, 다음에 우연히 도는 예약 작업이 아니라 그걸 일으킨 바로 그 push에서 잡힌다.</p>
        <p>같은 마이그레이션 안의 서로 다른 세 지점에서, 각각 실제로 중요한 것에 대해 틀린 것으로 드러난 출처를 믿었다: 이미 배포된 작업을 아직 남았다고 주장하는 문서, 저장소에 멀쩡히 있는 패키지를 존재하지 않는다고 주장하는 검색 인덱스, 그리고 자신이 겉으로 보호하고 있다던 바로 그 산출물이 아예 빌드조차 안 되는 동안 마이그레이션이 끝났다고 주장하는 초록색 CI 보드.</p>
        <div className="article-note"><strong>저장소 내 추가 자료</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/implementations/kotlin-springboot/examples/build.gradle.kts" target="_blank" rel="noreferrer">build.gradle.kts</a> — 네이티브 platform() BOM, resilience4j-spring-boot4, 그 외 이번 마이그레이션이 건드린 전부 · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/.github/workflows/docker-image-scan.yml" target="_blank" rel="noreferrer">docker-image-scan.yml</a> — 넓어진 트리거
        </p></div>
      </>
    ),
  },
};

export default function TheImageNothingNoticedCouldntBuild() {
  const { locale } = useLocale();
  const c = content[locale];

  return (
    <PostLayout
      slug="the-image-nothing-noticed-couldnt-build"
      kicker={c.kicker}
      title={c.title}
      lede={c.lede}
    >
      {c.body}
    </PostLayout>
  );
}
