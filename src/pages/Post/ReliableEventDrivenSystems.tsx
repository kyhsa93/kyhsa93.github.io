import { Link } from 'react-router-dom';

export default function ReliableEventDrivenSystems() {
  return (
    <main className="post-page">
      <nav className="post-nav" aria-label="Post navigation">
        <Link to="/" className="brand"><span className="brand-mark">Y</span><span>younghoon</span></Link>
        <Link to="/" className="back-link">← Home</Link>
      </nav>
      <article className="post-content">
        <header className="post-header">
          <p className="section-kicker">Event-driven · Backend</p>
          <h1>이벤트 기반 시스템의<br /><em>신뢰성</em></h1>
          <p className="post-lede">메시지 브로커가 있다고 해서 이벤트가 안전하게 전달되는 것은 아닙니다. 유실, 중복, 순서 변경을 전제로 설계할 때 시스템은 장애 후에도 일관된 상태로 회복할 수 있습니다.</p>
          <time>2026.07.19 · 12 min read</time>
        </header>
        <div className="article-body">
          <p>이벤트 기반 아키텍처는 서비스 사이의 결합도를 낮추고 독립적인 확장을 돕습니다. 하지만 요청과 응답이 바로 이어지는 동기 호출과 달리, 이벤트는 발행된 뒤 어디까지 도달했는지 한눈에 알기 어렵습니다. 데이터베이스 저장은 성공했지만 이벤트 발행은 실패할 수 있고, 소비자는 같은 메시지를 두 번 받을 수 있으며, 잠시 멈춘 소비자가 오래된 이벤트를 나중에 처리할 수도 있습니다.</p>
          <p>신뢰성은 ‘정확히 한 번 전달’이라는 약속 하나로 얻어지지 않습니다. 저장, 전달, 소비, 관측 각 단계에서 실패를 예상하고, 같은 작업을 다시 해도 안전하도록 만드는 여러 장치의 조합입니다. 이 글에서는 실무에서 가장 자주 만나는 문제를 순서대로 살펴봅니다.</p>
          <h2>먼저 합의할 것: 전달 보장과 처리 보장은 다르다</h2>
          <p>메시지 브로커의 at-least-once 전달은 메시지가 최소 한 번은 소비자에게 전달되도록 재시도한다는 뜻입니다. 그러나 소비자가 처리 결과를 저장한 직후 응답을 보내기 전에 죽으면, 브로커는 같은 메시지를 다시 보냅니다. 즉, 전달이 보장되어도 비즈니스 작업이 한 번만 실행된다는 보장은 없습니다.</p>
          <p>실무에서는 at-least-once 전달을 받아들이고, 소비자를 멱등하게 만들어 effectively-once 처리를 목표로 삼는 편이 현실적입니다. 멱등성이란 같은 입력을 여러 번 처리해도 관측 가능한 결과가 한 번 처리했을 때와 같다는 성질입니다. 결제 승인, 포인트 적립, 이메일 발송처럼 외부 효과가 있는 작업일수록 이 경계가 중요합니다.</p>
          <h2>1. DB 저장과 이벤트 발행을 함께 다룬다</h2>
          <p>주문을 저장한 다음 이벤트를 발행하는 가장 단순한 코드에는 실패 창이 두 번 있습니다. DB 저장 후 프로세스가 죽으면 이벤트가 유실되고, 이벤트를 먼저 보낸 뒤 DB 저장이 실패하면 존재하지 않는 주문의 이벤트가 전달됩니다. 분산 트랜잭션으로 두 시스템을 묶을 수도 있지만, 운영 복잡도와 가용성 비용이 큽니다.</p>
          <p>Outbox 패턴은 도메인 데이터와 발행할 이벤트를 같은 로컬 트랜잭션에 저장합니다. 별도 워커가 아직 발행되지 않은 Outbox 레코드를 읽어 브로커로 전송하고, 성공하면 발행 완료 상태로 바꿉니다. 이 방식은 이벤트가 늦게 도착할 수는 있어도 유실되는 창을 제거합니다.</p>
          <h3>예제: Transactional Outbox</h3>
          <pre><code>{`async function placeOrder(command: PlaceOrder) {
  await db.transaction(async (tx) => {
    const order = Order.place(command);
    await orderRepository.save(tx, order);

    await outboxRepository.append(tx, {
      id: crypto.randomUUID(),
      topic: 'orders.placed',
      key: order.id,
      payload: { orderId: order.id, customerId: order.customerId },
      occurredAt: new Date(),
    });
  });
}

async function publishOutbox() {
  for (const event of await outboxRepository.findUnpublished()) {
    await broker.publish(event.topic, event.key, event.payload);
    await outboxRepository.markPublished(event.id);
  }
}`}</code></pre>
          <p>워커가 브로커 전송 후 완료 표시 전에 죽으면 같은 이벤트가 다시 발행될 수 있습니다. 그래서 Outbox만으로는 중복을 없애지 못합니다. 대신 발행 측은 안정적인 이벤트 ID와 키를 제공하고, 소비 측은 중복을 안전하게 처리해야 합니다.</p>
          <h2>2. 소비자는 멱등성 키를 저장한다</h2>
          <p>이벤트 ID를 처리 이력으로 기록하는 방법이 가장 단순합니다. 소비자는 작업 전에 해당 ID가 이미 처리됐는지 확인하고, 처리 결과와 ID를 같은 트랜잭션으로 저장합니다. 데이터베이스의 유니크 제약 조건을 사용하면 여러 소비자 인스턴스가 동시에 같은 메시지를 받아도 한 번만 성공시킬 수 있습니다.</p>
          <h3>예제: 중복 이벤트를 무시하는 소비자</h3>
          <pre><code>{`async function handlePaymentApproved(event: PaymentApproved) {
  await db.transaction(async (tx) => {
    const alreadyProcessed = await inboxRepository.exists(tx, event.id);
    if (alreadyProcessed) return;

    const order = await orderRepository.findById(tx, event.orderId);
    order.markPaid(event.approvedAt);
    await orderRepository.save(tx, order);

    // event_id에 unique index를 둔다.
    await inboxRepository.record(tx, event.id, 'payment-service');
  });
}`}</code></pre>
          <p>여기서 Inbox 레코드와 주문 상태 변경은 반드시 같은 트랜잭션이어야 합니다. 하나만 성공하면 다음 재시도에서 불일치가 생깁니다. 외부 API 호출처럼 같은 트랜잭션에 넣을 수 없는 작업에는 제공자가 지원하는 idempotency key를 전달하거나, 호출 의도 자체를 Outbox로 기록해 재시도 가능한 작업으로 바꿔야 합니다.</p>
          <h2>3. 재시도는 무한 반복이 아니라 정책이다</h2>
          <p>네트워크 오류나 일시적인 데이터베이스 과부하는 재시도로 회복할 수 있습니다. 하지만 스키마가 맞지 않거나 삭제된 상품을 참조하는 이벤트처럼 영구적인 실패도 존재합니다. 모든 실패를 즉시 재시도하면 소비자는 같은 메시지에 붙잡히고, 뒤의 정상 메시지도 처리하지 못합니다.</p>
          <p>일시적 오류에는 지수 백오프와 지터를 적용하고, 일정 횟수를 넘으면 Dead Letter Queue로 이동시키는 정책이 필요합니다. DLQ는 실패를 숨기는 쓰레기통이 아니라 운영자가 원인을 확인하고 수정 후 재처리하는 대기열입니다. 원본 이벤트, 실패 횟수, 예외 메시지, 최초 수신 시각을 함께 보관해야 진단할 수 있습니다.</p>
          <div className="article-note"><strong>재시도 설계 팁</strong><p>재시도 횟수만 정하지 말고, 어떤 오류가 재시도 가능한지와 최대 지연 시간, DLQ 재처리의 책임자를 함께 정의하세요. 알람 없는 DLQ는 결국 유실된 이벤트와 같습니다.</p></div>
          <h2>4. 순서가 필요하다면 범위를 제한한다</h2>
          <p>분산 환경에서 전체 이벤트의 순서를 보장하는 것은 비싸고 불필요한 경우가 많습니다. 보통 필요한 것은 ‘같은 주문에 대한 이벤트는 순서대로 처리된다’ 정도입니다. 이때 주문 ID를 파티션 키로 사용하면 같은 주문의 이벤트가 같은 파티션으로 향하고, 소비자는 그 범위 안에서 순서를 유지할 수 있습니다.</p>
          <p>그래도 지연된 이벤트는 도착할 수 있습니다. 상태 전이를 검증하고 버전을 포함하는 방식으로 방어할 수 있습니다. 예를 들어 이미 취소된 주문이 늦게 도착한 결제 완료 이벤트를 받았다면, 무조건 상태를 바꾸는 대신 현재 상태와 이벤트의 버전을 비교해야 합니다. ‘오래된 메시지는 무시한다’는 정책도 명시적인 비즈니스 결정이어야 합니다.</p>
          <h2>5. 관측 가능성이 복구 시간을 줄인다</h2>
          <p>이벤트 시스템의 장애는 종종 조용히 시작됩니다. 발행 지연이 쌓이고, 한 소비자의 재시도가 늘고, 결국 DLQ가 증가합니다. 이벤트 ID와 correlation ID를 로그·트레이스·메트릭에 모두 남기면 한 요청이 어떤 이벤트를 만들고 어디서 멈췄는지 추적할 수 있습니다.</p>
          <p>최소한 발행 대기 Outbox 수, 발행 지연 시간, 소비 지연, 재시도 횟수, DLQ 적재량은 대시보드로 관찰해야 합니다. 운영 지표는 성능 지표이기도 하지만, 비즈니스 사실이 언제 반영되는지를 보여주는 일관성 지표이기도 합니다.</p>
          <h2>신뢰성 체크리스트</h2>
          <ul>
            <li>도메인 변경과 이벤트 기록이 하나의 로컬 트랜잭션으로 저장되는가?</li>
            <li>모든 이벤트에 고유 ID, 발생 시각, 추적 가능한 correlation ID가 있는가?</li>
            <li>소비자는 중복을 안전하게 무시하거나 같은 결과를 재현하는가?</li>
            <li>일시적 실패와 영구적 실패를 구분하고 DLQ를 관측하는가?</li>
            <li>순서가 필요한 범위와 지연된 이벤트의 처리 정책이 명확한가?</li>
          </ul>
          <p>신뢰할 수 있는 이벤트 시스템은 실패하지 않는 시스템이 아니라, 실패를 예상하고 안전하게 다시 시도할 수 있는 시스템입니다. 전달 보장, 멱등성, 재시도 정책, 관측 가능성을 함께 설계하면 서비스가 늘어나도 데이터 흐름을 잃지 않을 수 있습니다.</p>
        </div>
        <footer className="post-footer">
          <Link to="/">← 메인으로 돌아가기</Link>
          <a href="https://github.com/kyhsa93/backend-service-playbook" target="_blank" rel="noreferrer">Backend Service Playbook </a>
        </footer>
      </article>
    </main>
  );
}
