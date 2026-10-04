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
    lede: 'A Spring Boot 4 migration that started by checking whether it was even necessary (a stale doc said yes, git history said it had already happened two weeks earlier) ended a day later with every check green and the deployable container image unable to build at all, because nothing in CI was watching the one file whose meaning had just changed underneath it.',
    body: (
      <>
        <p>The root doc still described the Java implementation as running Spring Boot 3.3. Before starting that migration, checking <code>git log -S</code> on the build file instead of trusting the doc turned up something the doc hadn't caught up to: Java had already made the jump, two weeks earlier, in a single commit whose message read less like a version bump and more like a small essay of everything it had to route around. The doc was stale, not the code. That one check saved a day of redoing work that had already shipped, and set the pattern for the rest of the round: check the current state before trusting what anything claims about it, docs included.</p>
        <h2>Kotlin's Turn, and a Dependency Chain That Broke Without a Sound</h2>
        <p>Kotlin hadn't migrated yet, and Boot 4's Gradle plugin turned out to no longer integrate with <code>io.spring.dependency-management</code> at all. The switch to native <code>platform()</code> BOMs was straightforward, but the first build afterward looked clean for the wrong reason: <code>build -x test</code> skips compiling the test sources entirely, so a dependency-resolution break in the test classpath sat there unnoticed until something tried to compile against it.</p>
        <p>Testcontainers had its own version of the same shape of surprise. The project already imported a <code>testcontainers-bom</code>, and it turned out to have been a complete no-op the entire time. Boot 3's own BOM had been supplying a version for the old-named artifacts, so the explicit import never did anything at all. Only renaming to Testcontainers 2.x's new artifact names (<code>testcontainers-junit-jupiter</code> and its siblings) made the previously-invisible BOM start mattering.</p>
        <h2>A Library That "Doesn't Exist," According to the Wrong Source</h2>
        <p>Resilience4j's Boot-3 starter crashes at application startup under Boot 4: a verifier built into the library itself refuses to run. Searching for a Boot-4 replacement came up empty on the package search index's own web UI, which read as "nothing published yet." A rate limiter is small enough to hand-wire, so that's what happened: a manually assembled registry reading the same configuration keys the missing starter would have. It worked. Tests passed. The harness passed.</p>
        <div className="article-note"><strong>The search index isn't the repository</strong><p>Only later, cross-checking against what Java's own dependency list already used, did the answer turn up: <code>resilience4j-spring-boot4</code> existed on the package repository the whole time. A direct probe of the repository's own file path returned it immediately. The web search UI simply hadn't indexed it. The hand-wired workaround came out, replaced by the starter Java had already been using for two weeks. A package index's search box not finding something is a claim about that index, not about what's published, and worth a direct probe before trusting it.</p></div>
        <h2>One Line of Application Code</h2>
        <p>Underneath all the dependency and configuration churn, exactly one line of business logic needed to change. Spring Security 7's JSpecify nullability annotations mark <code>PasswordEncoder.encode</code> as nullable, and Kotlin's null-safety caught it immediately at compile time. The fix was a <code>checkNotNull()</code> wrap around a call that, in practice, never returns null. Everything else in the entire migration was infrastructure and configuration; this was the only place the framework upgrade touched logic a developer had written.</p>
        <h2>The Check Nobody Had Pointed at the Right File</h2>
        <p>The migration looked finished: build green, full test suite green, harness green, pushed. The next day, an unrelated scheduled job, a weekly container-image security scan, failed. The Kotlin service's Dockerfile was still building on a <code>gradle:8.10</code> base image, not the repository's own 8.14+ wrapper, and Spring Boot 4.1's Gradle plugin requires Gradle 8.14 or later. The deployable container image had been unable to build for a full day, with every other check reporting green, because the image-scan workflow's trigger only watched changes to the Dockerfile itself, and this migration had touched the build file, never the Dockerfile.</p>
        <p>The base image version was the easy part to fix. The trigger was the part worth fixing properly: it now also watches each language's dependency manifest, not just its Dockerfile, so the next toolchain bump that outgrows a base image gets caught by the same push that caused it, instead of by whatever scheduled job happens to run next.</p>
        <p>Three separate points in the same migration, each one trusting a source that turned out to be wrong about the thing that mattered: a doc claiming work was still pending that had already shipped, a search index claiming a package didn't exist that was sitting right there in the repository, and a green CI board claiming a migration was complete while the one artifact it was ostensibly protecting couldn't be built at all.</p>
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
    lede: 'Spring Boot 4 마이그레이션은 이 작업이 정말 필요한지 확인하는 데서 시작했다. 낡은 문서는 해야 한다고 했고, git 히스토리는 2주 전에 이미 끝났다고 했다. 그리고 하루 뒤, 체크는 전부 초록인데 배포할 컨테이너 이미지는 아예 빌드되지 않는 상태로 끝났다. 방금 의미가 바뀐 파일 하나를 CI의 어떤 검사도 지켜보고 있지 않았기 때문이다.',
    body: (
      <>
        <p>루트 문서에는 Java 구현이 아직 Spring Boot 3.3을 쓴다고 적혀 있었다. 마이그레이션을 시작하기 전에 문서를 그냥 믿지 않고 빌드 파일에 <code>git log -S</code>를 돌려 봤다. 문서가 놓친 게 있었다. Java는 2주 전에 이미 올라가 있었다. 커밋은 하나였는데, 메시지가 버전 업이라기보다는 피해 가야 했던 것들을 늘어놓은 짧은 에세이 같았다. 낡은 쪽은 코드가 아니고 문서였다. 이 확인 하나 덕분에 이미 배포된 작업을 하루 들여 다시 하는 일을 피했다. 이후 작업도 같은 방식으로 했다. 문서든 뭐든, 그게 하는 말을 믿기 전에 지금 상태부터 확인했다.</p>
        <h2>Kotlin 차례와 소리 없이 깨진 의존성</h2>
        <p>Kotlin은 아직 마이그레이션 전이었다. Boot 4의 Gradle 플러그인은 이제 <code>io.spring.dependency-management</code>와 연동하지 않는다. 네이티브 <code>platform()</code> BOM으로 바꾸는 건 어렵지 않았다. 그런데 바꾼 뒤 첫 빌드가 깨끗해 보인 이유가 틀렸다. <code>build -x test</code>는 테스트 소스를 아예 컴파일하지 않는다. 그래서 테스트 클래스패스에서 의존성 해석이 깨진 게, 누군가 그걸로 컴파일을 해 보기 전까지 그대로 묻혀 있었다.</p>
        <p>Testcontainers도 비슷한 식으로 뒤통수를 쳤다. 프로젝트는 이미 <code>testcontainers-bom</code>을 임포트하고 있었는데, 알고 보니 그동안 아무 일도 안 하고 있었다. 옛 이름의 아티팩트 버전은 Boot 3의 BOM이 알아서 채워 주고 있었고, 명시적으로 넣은 임포트는 한 번도 쓰인 적이 없었다. Testcontainers 2.x의 새 아티팩트 이름(<code>testcontainers-junit-jupiter</code> 등)으로 바꾸고 나서야, 있는 줄도 몰랐던 그 BOM이 비로소 일을 하기 시작했다.</p>
        <h2>엉뚱한 곳에서 찾으면 "없는" 라이브러리</h2>
        <p>resilience4j의 Boot 3 스타터는 Boot 4에서 애플리케이션이 뜰 때 크래시한다. 라이브러리에 들어 있는 검증기가 실행을 막는다. Boot 4용 스타터를 찾아봤는데 패키지 검색 인덱스의 웹 UI에는 아무것도 없었다. 아직 나온 게 없다는 뜻으로 읽었다. rate limiter 정도는 손으로 엮을 만큼 작아서 그렇게 했다. 없는 스타터가 읽었을 설정 키를 그대로 읽는 레지스트리를 직접 조립했다. 잘 돌았고, 테스트와 하네스도 통과했다.</p>
        <div className="article-note"><strong>검색 인덱스는 저장소가 아니다</strong><p>답은 나중에 Java의 의존성 목록과 맞춰 보다가 나왔다. <code>resilience4j-spring-boot4</code>는 패키지 저장소에 처음부터 있었다. 저장소의 파일 경로를 직접 찔러 보니 바로 나왔다. 웹 검색 UI가 인덱싱을 안 해 뒀을 뿐이다. 손으로 엮은 우회책은 걷어 내고, Java가 이미 2주째 쓰던 스타터로 바꿨다. 검색창에 안 나온다는 건 그 인덱스 사정일 뿐, 패키지가 공개됐는지와는 다른 얘기다. 믿기 전에 저장소를 직접 확인해 보는 게 낫다.</p></div>
        <h2>애플리케이션 코드는 딱 한 줄</h2>
        <p>의존성과 설정이 그렇게 요동치는 동안, 비즈니스 로직에서 바뀐 건 딱 한 줄이었다. Spring Security 7은 JSpecify nullability 애노테이션으로 <code>PasswordEncoder.encode</code>를 nullable로 표시한다. Kotlin의 null 안전성이 컴파일할 때 이걸 바로 잡아냈다. 현실에서는 null을 돌려줄 일이 없는 호출이지만 <code>checkNotNull()</code>로 감쌌다. 마이그레이션의 나머지는 전부 인프라와 설정이었다. 프레임워크 업그레이드가 사람이 짠 로직을 건드린 곳은 여기 하나뿐이다.</p>
        <h2>엉뚱한 파일을 지켜보던 체크</h2>
        <p>마이그레이션은 끝난 것 같았다. 빌드, 전체 테스트, 하네스가 모두 초록이었고 푸시도 했다. 다음 날, 상관없어 보이는 예약 작업 하나가 실패했다. 매주 도는 컨테이너 이미지 보안 스캔이었다. Kotlin 서비스의 Dockerfile은 저장소의 8.14+ 래퍼가 아니라 아직 <code>gradle:8.10</code> 베이스 이미지로 빌드하고 있었다. Spring Boot 4.1의 Gradle 플러그인은 Gradle 8.14 이상이 필요하다.</p>
        <p>다른 체크가 전부 초록을 보고하는 동안, 배포할 컨테이너 이미지는 꼬박 하루 동안 빌드가 안 되고 있었다. 이미지 스캔 워크플로의 트리거가 Dockerfile 변경만 지켜봤기 때문이다. 이번 마이그레이션은 빌드 파일만 고쳤고 Dockerfile은 건드리지 않았다.</p>
        <p>베이스 이미지 버전을 올리는 건 쉬웠다. 제대로 고쳐야 했던 건 트리거다. 이제는 언어마다 Dockerfile뿐 아니라 의존성 매니페스트도 같이 지켜본다. 다음에 툴체인 업그레이드가 베이스 이미지를 슬쩍 넘어서더라도, 다음 예약 작업을 기다릴 필요 없이 그 변경을 푸시한 순간 잡힌다.</p>
        <p>한 마이그레이션 안에서 세 번, 정작 중요한 부분에서 틀린 출처를 믿었다. 이미 배포된 작업을 아직 남았다고 한 문서가 있었고, 저장소에 멀쩡히 있는 패키지를 없다고 한 검색 인덱스가 있었다. 마지막은 초록색 CI 보드였다. 지킨다던 산출물이 빌드조차 안 되는데도 마이그레이션이 끝났다고 했다.</p>
        <div className="article-note"><strong>저장소에서 더 볼 것</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/implementations/kotlin-springboot/examples/build.gradle.kts" target="_blank" rel="noreferrer">build.gradle.kts</a>(네이티브 platform() BOM, resilience4j-spring-boot4 등 이번 마이그레이션이 건드린 것 전부) · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/.github/workflows/docker-image-scan.yml" target="_blank" rel="noreferrer">docker-image-scan.yml</a>(넓힌 트리거)
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
