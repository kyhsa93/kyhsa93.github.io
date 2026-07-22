import PostLayout from '../../components/PostLayout';

export default function RequestScopedUserContext() {
  return (
    <PostLayout
      slug="request-scoped-user-context"
      kicker="Cross-cutting Concerns · Backend"
      title={<>Request-Scoped Context:<br /><em>Why req.user Is an Anti-Pattern</em></>}
      lede="Reading the authenticated user off the request object looks completely harmless the first time you write it. It's also the single easiest way to quietly wire your business logic to the fact that an HTTP request is currently in flight."
    >
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
    </PostLayout>
  );
}
