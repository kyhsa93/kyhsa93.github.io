import PostLayout from '../../components/PostLayout';
import { useLocale, localeFromPathname } from '../../lib/locale';
import type { MetaFunction } from 'react-router';
import { createPostMeta } from '../../lib/seo';

export const meta: MetaFunction = ({ location }) =>
  createPostMeta('request-scoped-user-context', localeFromPathname(location.pathname));

const content = {
  en: {
    kicker: 'Cross-cutting Concerns · Backend',
    title: (
      <>
        Request-Scoped Context:<br /><em>Why req.user Is an Anti-Pattern</em>
      </>
    ),
    lede: "Reading the authenticated user off the request object looks completely harmless the first time you write it. It's also the single easiest way to wire your business logic to the fact that an HTTP request is currently in flight.",
    body: (
      <>
        <p>Authentication has a clear place in a layered architecture: the Interface layer, and only the Interface layer. The Domain and Application layers never depend on the authentication context. A Command or Query includes whatever it needs, like a plain <code>userId</code> string, and nothing about how that ID was established.</p>
        <pre><code>{`// forbidden — verifying the token directly in an Application Service
public async cancelOrder(token: string, command: CancelOrderCommand) {
  const user = await this.authService.verify(token)  // this is the Interface layer's job
  ...
}`}</code></pre>
        <h2>The Subtler Mistake, Even Inside the Right Layer</h2>
        <p>Getting auth into the Interface layer isn't the whole story. Even there, reading the user info directly off the request object is a pattern worth avoiding:</p>
        <pre><code>{`// avoid — reads the user info directly off the request object
public async cancelOrder(
  @Req() req: { user: { userId: string } },
  @Body() body: CancelOrderRequestBody
): Promise<void> {
  return this.commandService.cancelOrder({ ...body, userId: req.user.userId })
}`}</code></pre>
        <p>Reading straight off the request object couples the Handler (and anything it calls) to "there is an HTTP request happening right now," rather than to a plain value it was simply handed. That matters more than it looks for a field like the authenticated user, because that field is usually needed <em>everywhere</em>: inside the Handler, sometimes inside an Application-layer Service, and again inside a logging or observability interceptor. Threading <code>req</code> to every one of those call sites, or reaching for a framework-global "current request," both defeat the entire point of the Interface layer, which is converting HTTP mechanics into plain application calls in the first place.</p>
        <p>The fix mirrors a pattern already used for Correlation IDs in my example project, which implements the same backend design in five languages side by side: store the value in request-scoped storage during the auth step, and read it back from that storage wherever it's needed, with no request object in sight.</p>
        <pre><code>{`// Interface layer: read the userId from request-scoped storage, not the request object
public async cancelOrder(
  @Body() body: CancelOrderRequestBody
): Promise<void> {
  const userId = userContextStorage.getRequesterId()
  return this.commandService.cancelOrder({ ...body, userId })
}`}</code></pre>
        <h2>The Part That Cost a Debugging Cycle</h2>
        <p>Implementing this turned up a subtlety the doc's one-paragraph description doesn't fully convey. The first attempt mirrored the existing Correlation ID pattern: a Middleware opens an <code>AsyncLocalStorage</code> scope, an Auth Guard populates it. It passed type-checking, passed lint, passed all 117 unit tests. Then 58 of 67 end-to-end tests failed with 500 errors.</p>
        <p>Two independent problems, each enough on its own: the e2e specs build their own testing module directly and never invoke the app's real bootstrap configuration, so the Middleware simply never ran in that test setup. And separately (this is the part that generalizes beyond any one test setup), a Guard's <code>canActivate()</code> returns a plain boolean. It has no callback representing "now continue processing the rest of the pipeline," which is the shape <code>AsyncLocalStorage.run(value, callback)</code> requires. A Guard fundamentally cannot open that scope by itself, in any test setup, in production or otherwise.</p>
        <h2>The Fix: Split the Responsibility in Two</h2>
        <p>The Guard verifies the token and stashes the result as an internal-only handoff field on the request object. A Controller never reads it; it's purely a relay to the next stage:</p>
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
        <p>An Interceptor, which <em>does</em> get a wrappable <code>next.handle()</code>, is what opens the storage scope around the rest of the request:</p>
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
        <p>The storage itself is a thin wrapper, deliberately built to fail loudly:</p>
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
        <div className="article-note"><strong>Verifying it, not just testing it</strong><p>Passing tests wasn't treated as proof of correctness for a mechanism this concurrency-sensitive. The app itself was booted, two users were created, and both sequential and concurrent parallel requests confirmed that each response's data always matched that request's own bearer token. That is direct proof there's no cross-request leakage in the AsyncLocalStorage-based approach, which unit tests alone can't fully rule out.</p></div>
        <h2>Checking Other Languages Before Assuming They Need the Same Fix</h2>
        <p>A natural next question is whether the four other language implementations of that design had the identical footgun. They didn't, and the reason why is the more useful takeaway. <code>req.user = payload</code> is a well-known, common pitfall specific to frameworks like Express and NestJS, which have no native concept of "the authenticated principal for this request." Frameworks that do have their own request-scoped auth abstraction were already correct without any change: Go's own <code>context.Context</code> plus <code>context.WithValue</code>, Spring Security's <code>Authentication</code> passed as an explicit method parameter (never touching <code>HttpServletRequest</code> directly), and FastAPI's <code>Depends(get_current_user)</code>. Assuming every language needs the identical intervention would have meant dispatching four unnecessary fixes; checking each language's code first turned up that only one of the five needed to change at all.</p>
        <div className="article-note"><strong>Further reading</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/authentication.md" target="_blank" rel="noreferrer">docs/architecture/authentication.md</a> (the full auth flow and layer-placement principle, in the example project) · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/cross-cutting-concerns.md" target="_blank" rel="noreferrer">docs/architecture/cross-cutting-concerns.md</a> (where auth sits in the request pipeline, and the Correlation ID pattern this mirrors) · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/implementations/nestjs/examples/src/common/user-context-store.ts" target="_blank" rel="noreferrer">common/user-context-store.ts</a> (the NestJS implementation)
        </p></div>
      </>
    ),
  },
  ko: {
    kicker: 'Cross-cutting Concerns · Backend',
    title: (
      <>
        요청 스코프 컨텍스트<br /><em>req.user가 안티패턴인 이유</em>
      </>
    ),
    lede: '인증된 사용자를 request 객체에서 바로 꺼내 쓰는 코드는 처음 쓸 때는 아무 문제 없어 보인다. 그런데 비즈니스 로직을 "지금 HTTP 요청을 처리하는 중"이라는 사실에 슬그머니 묶어 버리는 데 이만큼 쉬운 방법도 없다.',
    body: (
      <>
        <p>계층형 아키텍처에서 인증이 있을 자리는 분명하다. Interface 계층 한 곳뿐이다. Domain 계층과 Application 계층은 인증 컨텍스트에 기대지 않는다. Command나 Query에는 <code>userId</code> 같은 평범한 문자열처럼 필요한 값만 들어가고, 그 ID를 어떻게 확인했는지는 담기지 않는다.</p>
        <pre><code>{`// forbidden — verifying the token directly in an Application Service
public async cancelOrder(token: string, command: CancelOrderCommand) {
  const user = await this.authService.verify(token)  // this is the Interface layer's job
  ...
}`}</code></pre>
        <h2>맞는 계층 안에서도 생기는 실수</h2>
        <p>인증을 Interface 계층에 뒀다고 끝은 아니다. 그 계층 안에서도 사용자 정보를 request 객체에서 직접 읽는 건 피하는 게 좋다. 취향 문제로 넘길 일이 아니다.</p>
        <pre><code>{`// avoid — reads the user info directly off the request object
public async cancelOrder(
  @Req() req: { user: { userId: string } },
  @Body() body: CancelOrderRequestBody
): Promise<void> {
  return this.commandService.cancelOrder({ ...body, userId: req.user.userId })
}`}</code></pre>
        <p>request 객체에서 바로 읽으면 Handler, 그리고 Handler가 부르는 코드 전부가 넘겨받은 값 하나에 기대는 대신 "지금 HTTP 요청이 진행 중"이라는 사실에 묶인다. 인증된 사용자는 특히 그렇다. 이 값은 보통 <em>여기저기서</em> 필요하다. Handler에서도, 때로는 Application 계층의 Service에서도, 로깅이나 observability 인터셉터에서도 또 쓴다.</p>
        <p>그 호출 지점마다 <code>req</code>를 줄줄이 넘기든, 프레임워크 전역의 "현재 요청"을 끌어다 쓰든 결과는 같다. HTTP의 사정을 평범한 애플리케이션 호출로 바꿔 주는 게 Interface 계층이 있는 이유인데, 그 이유가 사라진다.</p>
        <p>고치는 방법은 Correlation ID에 이미 쓰고 있던 패턴과 같다. 같은 백엔드 설계를 5개 언어로 나란히 구현해 둔 내 예제 프로젝트에서 쓰던 패턴이다. 인증 단계에서 값을 요청 스코프 스토리지에 넣어 두고, 필요한 곳에서는 request 객체 없이 그 스토리지에서 꺼내 쓴다.</p>
        <pre><code>{`// Interface layer: read the userId from request-scoped storage, not the request object
public async cancelOrder(
  @Body() body: CancelOrderRequestBody
): Promise<void> {
  const userId = userContextStorage.getRequesterId()
  return this.commandService.cancelOrder({ ...body, userId })
}`}</code></pre>
        <h2>디버깅에 한참 걸린 부분</h2>
        <p>막상 구현해 보니 문서의 한 단락 설명에는 안 담긴 함정이 있었다. 처음에는 Correlation ID 패턴을 그대로 따라 했다. Middleware가 <code>AsyncLocalStorage</code> 스코프를 열고, Auth Guard가 그 안에 사용자를 채우는 식이다. 타입 체크와 lint를 통과했고 unit test 117개도 다 통과했다. 그런데 e2e 테스트는 67개 중 58개가 500 에러로 실패했다.</p>
        <p>원인은 서로 관계없는 두 가지였고, 둘 다 혼자서도 실패를 낼 만했다. 하나는 e2e 스펙이 테스트 모듈을 직접 만들어 쓰면서 앱의 부트스트랩 설정을 한 번도 부르지 않았다는 것이다. 그래서 테스트 환경에서는 Middleware가 아예 돌지 않았다.</p>
        <p>다른 하나는 테스트 구성과 상관없이 어디서나 해당되는 문제다. Guard의 <code>canActivate()</code>는 boolean 하나를 돌려줄 뿐이다. "이제 파이프라인의 나머지를 이어서 처리하라"는 콜백을 받지 않는데, <code>AsyncLocalStorage.run(value, callback)</code>에 필요한 게 그 콜백이다. 테스트든 프로덕션이든 Guard 혼자서는 그 스코프를 열 수가 없다.</p>
        <h2>책임을 둘로 나눴다</h2>
        <p>Guard는 토큰을 검증하고, 결과를 request 객체의 내부 전달용 필드에 넣어 둔다. Controller는 이 필드를 읽지 않는다. 다음 단계로 넘기기 위한 자리일 뿐이다.</p>
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
        <p>스토리지 스코프는 Interceptor가 연다. Interceptor는 감쌀 수 있는 <code>next.handle()</code>을 <em>받기</em> 때문에, 나머지 요청 처리를 통째로 그 안에 넣을 수 있다.</p>
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
        <p>둘은 합성 데코레이터 하나로 늘 같이 붙인다. 그래서 Guard만 있고 Interceptor가 빠진 라우트는 생길 수 없다.</p>
        <pre><code>{`export const Authenticated = (): ReturnType<typeof applyDecorators> => applyDecorators(
  UseGuards(AuthGuard),
  UseInterceptors(UserContextInterceptor)
)`}</code></pre>
        <p>스토리지는 얇은 래퍼다. 문제가 있으면 소리 없이 넘어가지 않고 바로 터지도록 일부러 만들었다.</p>
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
        <div className="article-note"><strong>테스트 통과로 끝내지 않기</strong><p>동시성에 이만큼 민감한 장치는 테스트가 통과했다고 맞다고 볼 수 없었다. 앱을 직접 띄우고 사용자 두 명을 만든 다음, 요청을 차례로도 보내고 동시에 병렬로도 보냈다. 어느 쪽이든 응답 데이터는 늘 그 요청의 bearer 토큰 주인 것이었다. AsyncLocalStorage 방식에서 요청끼리 데이터가 새지 않는다는 걸 직접 확인한 셈이다. unit test만으로는 완전히 배제할 수 없는 부분이다.</p></div>
        <h2>다른 언어는 고치기 전에 먼저 확인했다</h2>
        <p>그러면 같은 설계를 구현한 다른 4개 언어에도 같은 함정이 있었을까. 없었다. 왜 없었는지가 더 쓸모 있는 얘기다. <code>req.user = payload</code>는 잘 알려진 함정이지만 Express나 NestJS 같은 프레임워크에서 주로 생긴다. 이 프레임워크들에는 "이 요청의 인증된 principal"이라는 개념이 자체적으로 없다.</p>
        <p>요청 스코프 인증을 이미 프레임워크가 제공하는 쪽은 손대지 않아도 맞게 돼 있었다. Go는 <code>context.Context</code>와 <code>context.WithValue</code>를 쓴다. Spring Security는 <code>Authentication</code>을 메서드 파라미터로 명시해 받고 <code>HttpServletRequest</code>는 직접 만지지 않는다. FastAPI는 <code>Depends(get_current_user)</code>가 있다. 모든 언어를 똑같이 고쳐야 한다고 생각했다면 필요 없는 수정 4건을 더 했을 것이다. 언어별 코드를 먼저 열어 보니 5개 언어 중 고칠 곳은 하나뿐이었다.</p>
        <div className="article-note"><strong>더 볼 자료</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/authentication.md" target="_blank" rel="noreferrer">docs/architecture/authentication.md</a>(예제 프로젝트의 인증 흐름 전체와 계층 배치 원칙) · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/cross-cutting-concerns.md" target="_blank" rel="noreferrer">docs/architecture/cross-cutting-concerns.md</a>(요청 파이프라인에서 인증이 놓이는 자리와, 이 글이 따라 한 Correlation ID 패턴) · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/implementations/nestjs/examples/src/common/user-context-store.ts" target="_blank" rel="noreferrer">common/user-context-store.ts</a>(NestJS 구현 코드)
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
