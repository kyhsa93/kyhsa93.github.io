import PostLayout from '../../components/PostLayout';
import { useLocale } from '../../lib/locale';

const content = {
  en: {
    kicker: 'Cross-cutting Concerns · Backend',
    title: (
      <>
        Request-Scoped Context:<br /><em>Why req.user Is an Anti-Pattern</em>
      </>
    ),
    lede: "Reading the authenticated user off the request object looks completely harmless the first time you write it. It's also the single easiest way to quietly wire your business logic to the fact that an HTTP request is currently in flight.",
    body: (
      <>
        <p>Authentication has a clear place in a layered architecture: the Interface layer, and only the Interface layer. The Domain and Application layers never depend on the authentication context — a Command or Query includes whatever it needs, like a plain <code>userId</code> string, and nothing about how that ID was established.</p>
        <pre><code>{`// forbidden — verifying the token directly in an Application Service
public async cancelOrder(token: string, command: CancelOrderCommand) {
  const user = await this.authService.verify(token)  // this is the Interface layer's job
  ...
}`}</code></pre>
        <h2>The Subtler Mistake, Even Inside the Right Layer</h2>
        <p>Getting auth into the Interface layer isn't the whole story. Even there, reading the user info directly off the request object is a pattern worth avoiding, not just a style preference:</p>
        <pre><code>{`// avoid — reads the user info directly off the request object
public async cancelOrder(
  @Req() req: { user: { userId: string } },
  @Body() body: CancelOrderRequestBody
): Promise<void> {
  return this.commandService.cancelOrder({ ...body, userId: req.user.userId })
}`}</code></pre>
        <p>Reading straight off the request object couples the Handler — and anything it calls — to "there is an HTTP request happening right now," rather than to a plain value it was simply handed. That matters more than it looks for a field like the authenticated user, because that field is usually needed <em>everywhere</em>: inside the Handler, sometimes inside an Application-layer Service, and again inside a logging or observability interceptor. Threading <code>req</code> to every one of those call sites, or reaching for a framework-global "current request," both defeat the entire point of the Interface layer — converting HTTP mechanics into plain application calls in the first place.</p>
        <p>The fix mirrors a pattern this repo already uses for Correlation IDs: store the value in request-scoped storage during the auth step, and read it back from that storage wherever it's needed, with no request object in sight.</p>
        <pre><code>{`// Interface layer: read the userId from request-scoped storage, not the request object
public async cancelOrder(
  @Body() body: CancelOrderRequestBody
): Promise<void> {
  const userId = userContextStorage.getRequesterId()
  return this.commandService.cancelOrder({ ...body, userId })
}`}</code></pre>
        <h2>The Part That Actually Cost a Debugging Cycle</h2>
        <p>Implementing this for real turned up a subtlety the doc's one-paragraph description doesn't fully convey. The first attempt mirrored the existing Correlation ID pattern exactly: a Middleware opens an <code>AsyncLocalStorage</code> scope, an Auth Guard populates it. It passed type-checking, passed lint, passed all 117 unit tests. Then 58 of 67 end-to-end tests failed with 500 errors.</p>
        <p>Two independent problems, each enough on its own: the e2e specs build their own testing module directly and never invoke the app's real bootstrap configuration, so the Middleware simply never ran in that test setup. And separately — this is the part that generalizes beyond any one test harness — a Guard's <code>canActivate()</code> returns a plain boolean. It has no callback representing "now continue processing the rest of the pipeline," which is exactly the shape <code>AsyncLocalStorage.run(value, callback)</code> requires. A Guard fundamentally cannot open that scope by itself, in any test setup, in production or otherwise.</p>
        <h2>The Fix: Split the Responsibility in Two</h2>
        <p>The Guard verifies the token and stashes the result as an internal-only handoff field on the request object — never read by a Controller, purely a relay to the next stage:</p>
        <pre><code>{`@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly reflector: Reflector
  ) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()])
    if (isPublic) return true

    const request = context.switchToHttp().getRequest()
    const authorization = request.headers.authorization
    if (!authorization?.startsWith('Bearer ')) throw new UnauthorizedException()

    const token = authorization.replace('Bearer ', '')
    const user = await this.authService.verify(token)
    if (!user) throw new UnauthorizedException()

    // A Guard has no callback to wrap the rest of the pipeline, so it cannot itself open the
    // AsyncLocalStorage-based UserContextStore. This field is an internal-only handoff to
    // UserContextInterceptor — Controllers must never read it directly.
    request.__verifiedUser = user
    return true
  }
}`}</code></pre>
        <p>An Interceptor — which <em>does</em> get a wrappable <code>next.handle()</code> — is what actually opens the storage scope, around the rest of the request:</p>
        <pre><code>{`@Injectable()
export class UserContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest()
    const user = request.__verifiedUser

    if (!user) return next.handle()

    return new Observable((subscriber) => {
      UserContextStore.run(user, () => {
        next.handle().subscribe(subscriber)
      })
    })
  }
}`}</code></pre>
        <p>Both are always applied together, via one composite decorator, so a route can never end up with the Guard but not the Interceptor:</p>
        <pre><code>{`export const Authenticated = (): ReturnType<typeof applyDecorators> => applyDecorators(
  UseGuards(AuthGuard),
  UseInterceptors(UserContextInterceptor)
)`}</code></pre>
        <p>The storage itself is a thin wrapper, deliberately built to fail loudly rather than silently:</p>
        <pre><code>{`const storage = new AsyncLocalStorage<UserContext>()

export const UserContextStore = {
  run: (user: UserContext, fn: () => void) => storage.run(user, fn),
  getUser: (): UserContext | undefined => storage.getStore(),

  // Throws rather than returning undefined: a Controller method gated by @Authenticated()
  // should never reach this with no user set, so a thrown error surfaces a real wiring bug
  // immediately instead of silently propagating an empty requesterId into a Command/Query.
  getRequesterId: (): string => {
    const user = storage.getStore()
    if (!user) throw new Error('UserContextStore.getRequesterId() called outside an authenticated request context.')
    return user.userId
  }
}`}</code></pre>
        <div className="article-note"><strong>Verifying it, not just testing it</strong><p>Passing tests wasn't treated as proof of correctness for a mechanism this concurrency-sensitive. The real app was booted, two users were created, and both sequential and concurrent parallel requests confirmed that each response's data always matched that request's own bearer token — direct proof there's no cross-request leakage in the AsyncLocalStorage-based approach, which unit tests alone can't fully rule out.</p></div>
        <h2>Checking Other Languages Before Assuming They Need the Same Fix</h2>
        <p>A natural next question is whether four other language ports of this same architecture had the identical footgun. They didn't — and the reason why is the more useful takeaway. <code>req.user = payload</code> is a well-known, common pitfall specific to frameworks like Express and NestJS, which have no native concept of "the authenticated principal for this request." Frameworks that do have their own request-scoped auth abstraction were already correct without any change: Go's own <code>context.Context</code> plus <code>context.WithValue</code>, Spring Security's <code>Authentication</code> passed as an explicit method parameter (never touching <code>HttpServletRequest</code> directly), and FastAPI's <code>Depends(get_current_user)</code>. Assuming every language needs the identical intervention would have meant dispatching four unnecessary fixes; checking each language's actual code first turned up that only one of the five needed to change at all.</p>
        <div className="article-note"><strong>Further reading in the repo</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/authentication.md" target="_blank" rel="noreferrer">docs/architecture/authentication.md</a> — the full auth flow and layer-placement principle · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/cross-cutting-concerns.md" target="_blank" rel="noreferrer">docs/architecture/cross-cutting-concerns.md</a> — where auth sits in the request pipeline, and the Correlation ID pattern this mirrors · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/implementations/nestjs/examples/src/common/user-context-store.ts" target="_blank" rel="noreferrer">common/user-context-store.ts</a> — the real code
        </p></div>
      </>
    ),
  },
  ko: {
    kicker: 'Cross-cutting Concerns · Backend',
    title: (
      <>
        요청 스코프 컨텍스트:<br /><em>req.user가 안티패턴인 이유</em>
      </>
    ),
    lede: '인증된 사용자 정보를 request 객체에서 바로 읽어오는 코드는 처음 작성할 때는 완전히 무해해 보인다. 하지만 이는 비즈니스 로직을 "지금 HTTP 요청이 진행 중이다"라는 사실에 조용히 결합시키는 가장 손쉬운 방법이기도 하다.',
    body: (
      <>
        <p>인증(Authentication)은 계층형 아키텍처에서 있어야 할 자리가 명확하다: Interface 계층, 오직 그곳뿐이다. Domain 계층과 Application 계층은 인증 컨텍스트에 절대 의존하지 않는다 — Command나 Query는 그저 <code>userId</code> 같은 평범한 문자열처럼 필요한 값만 담고 있을 뿐, 그 ID가 어떻게 만들어졌는지는 전혀 알지 못한다.</p>
        <pre><code>{`// forbidden — verifying the token directly in an Application Service
public async cancelOrder(token: string, command: CancelOrderCommand) {
  const user = await this.authService.verify(token)  // this is the Interface layer's job
  ...
}`}</code></pre>
        <h2>올바른 계층 안에서도 놓치기 쉬운 더 미묘한 실수</h2>
        <p>인증을 Interface 계층에 두는 것만으로 끝나는 이야기가 아니다. 그 계층 안에서조차, 사용자 정보를 request 객체에서 직접 읽는 것은 단순한 스타일 취향이 아니라 피해야 할 패턴이다:</p>
        <pre><code>{`// avoid — reads the user info directly off the request object
public async cancelOrder(
  @Req() req: { user: { userId: string } },
  @Body() body: CancelOrderRequestBody
): Promise<void> {
  return this.commandService.cancelOrder({ ...body, userId: req.user.userId })
}`}</code></pre>
        <p>request 객체에서 바로 읽으면 Handler와 그 Handler가 호출하는 모든 대상이, 단순히 전달받은 평범한 값이 아니라 "지금 HTTP 요청이 진행 중이다"라는 사실 자체에 묶여버린다. 인증된 사용자 같은 필드에서는 이게 특히 더 큰 문제인데, 그 필드는 대개 <em>어디서든</em> 필요하기 때문이다: Handler 안에서, 때로는 Application 계층의 Service 안에서, 그리고 로깅이나 관측성(observability) 인터셉터 안에서도 다시 필요하다. 그 모든 호출 지점마다 <code>req</code>를 실로 꿰듯 전달하거나, 프레임워크 전역의 "현재 요청"을 끌어다 쓰는 것 — 둘 다 Interface 계층 본연의 목적, 즉 HTTP 메커니즘을 평범한 애플리케이션 호출로 바꾸는 일 자체를 무너뜨린다.</p>
        <p>이 해법은 이 저장소가 Correlation ID에 이미 쓰고 있는 패턴을 그대로 따른다: 인증 단계에서 값을 요청 스코프 스토리지에 저장해 두고, 필요한 곳 어디서든 request 객체를 전혀 거치지 않고 그 스토리지에서 값을 다시 읽는다.</p>
        <pre><code>{`// Interface layer: read the userId from request-scoped storage, not the request object
public async cancelOrder(
  @Body() body: CancelOrderRequestBody
): Promise<void> {
  const userId = userContextStorage.getRequesterId()
  return this.commandService.cancelOrder({ ...body, userId })
}`}</code></pre>
        <h2>실제로 디버깅 사이클 하나를 잡아먹은 부분</h2>
        <p>이걸 실제로 구현해보니 문서의 한 단락짜리 설명으로는 다 담기지 않는 미묘한 지점이 드러났다. 첫 시도는 기존의 Correlation ID 패턴을 그대로 따라 했다: Middleware가 <code>AsyncLocalStorage</code> 스코프를 열고, Auth Guard가 그 안을 채우는 방식이었다. 타입 체크도 통과했고, lint도 통과했고, 117개의 unit test도 전부 통과했다. 그런데 67개 중 58개의 e2e 테스트가 500 에러로 실패했다.</p>
        <p>독립적인 두 가지 문제가 있었고, 각각이 그 자체만으로도 충분한 원인이었다: e2e 스펙들은 자체 테스트 모듈을 직접 빌드하고 앱의 실제 부트스트랩 설정을 전혀 호출하지 않았기 때문에, 그 테스트 환경에서는 Middleware가 아예 실행되지 않았다. 그리고 별개로 — 이 부분이 특정 테스트 하네스를 넘어서 일반화되는 지점인데 — Guard의 <code>canActivate()</code>는 그냥 boolean 하나를 반환한다. "이제 파이프라인의 나머지를 계속 처리하라"를 나타내는 콜백이 없는데, 바로 그 콜백이야말로 <code>AsyncLocalStorage.run(value, callback)</code>이 요구하는 형태다. Guard는 어떤 테스트 환경에서든, 프로덕션이든 아니든, 근본적으로 그 스코프를 스스로 열 수 없다.</p>
        <h2>해법: 책임을 둘로 분리하기</h2>
        <p>Guard는 토큰을 검증하고 그 결과를 request 객체의 내부 전용 전달용 필드에 담아둔다 — Controller가 절대 읽지 않고, 오직 다음 단계로 전달하기 위한 용도다:</p>
        <pre><code>{`@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly reflector: Reflector
  ) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()])
    if (isPublic) return true

    const request = context.switchToHttp().getRequest()
    const authorization = request.headers.authorization
    if (!authorization?.startsWith('Bearer ')) throw new UnauthorizedException()

    const token = authorization.replace('Bearer ', '')
    const user = await this.authService.verify(token)
    if (!user) throw new UnauthorizedException()

    // A Guard has no callback to wrap the rest of the pipeline, so it cannot itself open the
    // AsyncLocalStorage-based UserContextStore. This field is an internal-only handoff to
    // UserContextInterceptor — Controllers must never read it directly.
    request.__verifiedUser = user
    return true
  }
}`}</code></pre>
        <p>실제로 스토리지 스코프를 여는 것은 — 감쌀 수 있는 <code>next.handle()</code>을 <em>실제로</em> 갖고 있는 — Interceptor다. 나머지 요청 처리 전체를 그것으로 감싼다:</p>
        <pre><code>{`@Injectable()
export class UserContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest()
    const user = request.__verifiedUser

    if (!user) return next.handle()

    return new Observable((subscriber) => {
      UserContextStore.run(user, () => {
        next.handle().subscribe(subscriber)
      })
    })
  }
}`}</code></pre>
        <p>둘은 항상 하나의 합성 데코레이터를 통해 함께 적용되므로, 어떤 라우트도 Guard만 있고 Interceptor는 빠진 상태로 남을 수 없다:</p>
        <pre><code>{`export const Authenticated = (): ReturnType<typeof applyDecorators> => applyDecorators(
  UseGuards(AuthGuard),
  UseInterceptors(UserContextInterceptor)
)`}</code></pre>
        <p>스토리지 자체는 얇은 래퍼(wrapper)이며, 조용히 실패하기보다 요란하게 실패하도록 의도적으로 만들어졌다:</p>
        <pre><code>{`const storage = new AsyncLocalStorage<UserContext>()

export const UserContextStore = {
  run: (user: UserContext, fn: () => void) => storage.run(user, fn),
  getUser: (): UserContext | undefined => storage.getStore(),

  // Throws rather than returning undefined: a Controller method gated by @Authenticated()
  // should never reach this with no user set, so a thrown error surfaces a real wiring bug
  // immediately instead of silently propagating an empty requesterId into a Command/Query.
  getRequesterId: (): string => {
    const user = storage.getStore()
    if (!user) throw new Error('UserContextStore.getRequesterId() called outside an authenticated request context.')
    return user.userId
  }
}`}</code></pre>
        <div className="article-note"><strong>테스트만이 아니라 실제로 검증하기</strong><p>이 정도로 동시성에 민감한 메커니즘에서는, 테스트 통과를 곧 정확성의 증거로 취급하지 않았다. 실제 앱을 부팅하고, 사용자 두 명을 만든 뒤, 순차 요청과 동시 병렬 요청 양쪽 모두에서 각 응답의 데이터가 항상 해당 요청 자신의 bearer 토큰과 일치하는지 확인했다 — AsyncLocalStorage 기반 접근 방식에 요청 간 데이터 누수가 없다는 직접적인 증거이며, 이는 unit test만으로는 완전히 배제할 수 없는 부분이다.</p></div>
        <h2>같은 수정이 필요하다고 가정하기 전에 다른 언어들부터 확인하기</h2>
        <p>자연스럽게 떠오르는 다음 질문은 이것이다: 같은 아키텍처의 다른 네 언어 포트에도 동일한 함정이 있었을까? 없었다 — 그리고 그 이유가 더 유용한 교훈이다. <code>req.user = payload</code>는 잘 알려진 흔한 함정이지만, 아무 프레임워크에서나 나타나는 건 아니다. Express나 NestJS처럼 "이 요청에 대한 인증된 principal"이라는 개념을 프레임워크 자체가 갖고 있지 않은 경우에 특히 그렇다. 자체적인 요청 스코프 인증 추상화를 이미 갖고 있는 프레임워크들은 아무 변경 없이도 이미 올바른 상태였다: Go의 자체 <code>context.Context</code>와 <code>context.WithValue</code>, Spring Security의 <code>Authentication</code>을 명시적인 메서드 파라미터로 전달하는 방식(<code>HttpServletRequest</code>를 직접 건드리지 않음), 그리고 FastAPI의 <code>Depends(get_current_user)</code>. 모든 언어에 동일한 개입이 필요하다고 가정했다면 불필요한 수정 네 건을 추가로 진행했을 것이다. 각 언어의 실제 코드를 먼저 확인해보니 다섯 언어 중 실제로 변경이 필요했던 곳은 단 하나뿐이었다.</p>
        <div className="article-note"><strong>저장소 내 추가 자료</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/authentication.md" target="_blank" rel="noreferrer">docs/architecture/authentication.md</a> — 전체 인증 흐름과 계층 배치 원칙 · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/cross-cutting-concerns.md" target="_blank" rel="noreferrer">docs/architecture/cross-cutting-concerns.md</a> — 요청 파이프라인 안에서 인증이 위치하는 자리, 그리고 이 패턴이 따르는 Correlation ID 패턴 · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/implementations/nestjs/examples/src/common/user-context-store.ts" target="_blank" rel="noreferrer">common/user-context-store.ts</a> — 실제 코드
        </p></div>
      </>
    ),
  },
};

export default function RequestScopedUserContext() {
  const { locale } = useLocale();
  const c = content[locale];

  return (
    <PostLayout slug="request-scoped-user-context" kicker={c.kicker} title={c.title} lede={c.lede}>
      {c.body}
    </PostLayout>
  );
}
