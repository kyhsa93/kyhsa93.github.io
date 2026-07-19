import { Link } from 'react-router-dom';

export default function FindingDomainBoundaries() {
  return (
    <main className="post-page">
      <nav className="post-nav" aria-label="Post navigation">
        <Link to="/" className="brand"><span className="brand-mark">Y</span><span>younghoon</span></Link>
        <Link to="/" className="back-link">← Home</Link>
      </nav>
      <article className="post-content">
        <header className="post-header">
          <p className="section-kicker">DDD · Architecture</p>
          <h1>도메인 경계를<br /><em>찾는 방법</em></h1>
          <p className="post-lede">도메인을 잘 나누는 일은 명사를 분류하는 일이 아니라, 변화와 책임의 경계를 찾는 일입니다. 기능이 커져도 함께 바뀌어야 하는 것들을 먼저 관찰해 보세요.</p>
          <time>2026.07.19 · 14 min read</time>
        </header>
        <div className="article-body">
          <p>서비스 초기에 하나의 모델로 시작하는 것은 자연스럽습니다. 하지만 주문, 결제, 배송처럼 서로 다른 이유로 바뀌는 기능이 한 모델에 섞이기 시작하면, 작은 수정도 예상보다 넓은 영향을 만듭니다. 이때 필요한 것은 더 많은 추상화가 아니라 경계를 다시 살피는 일입니다.</p>
          <p>여기서 말하는 경계는 단순히 테이블이나 마이크로서비스를 나누는 기준이 아닙니다. 어떤 규칙을 한 번에 지켜야 하는지, 어떤 변경을 같은 팀이 책임지는지, 그리고 어느 시점부터 비동기적인 협업을 허용할 수 있는지를 정하는 일입니다. 잘못 나눈 경계는 매 요청마다 여러 모델을 잠그게 만들고, 잘 나눈 경계는 기능이 늘어도 변경을 한곳에 머물게 합니다.</p>
          <h2>시작하기 전에: 도메인과 경계는 다르다</h2>
          <p>‘주문 도메인’이라는 표현은 너무 넓습니다. 고객에게는 구매의 완료를 의미하지만, 판매자에게는 접수와 정산의 시작이고, 물류 팀에게는 출고해야 할 작업 목록입니다. 같은 주문 번호를 공유하더라도 각자가 관심을 두는 상태와 규칙은 다릅니다. 이처럼 모델이 사용하는 언어와 규칙이 달라지는 지점을 Bounded Context 후보로 볼 수 있습니다.</p>
          <p>반대로 처음부터 서비스를 물리적으로 쪼갤 필요는 없습니다. 모듈 하나 안에서도 경계를 분명히 할 수 있고, 오히려 그 편이 빠른 피드백에 유리합니다. 중요한 것은 경계 너머의 내부 상태를 직접 읽거나 수정하지 않고, 명확한 명령·조회·이벤트 계약으로 대화하게 만드는 것입니다.</p>
          <h2>1. 함께 바뀌는 것을 찾는다</h2>
          <p>경계는 데이터의 종류보다 변경의 이유에서 드러납니다. 할인 정책이 바뀔 때 주문의 상태 전이까지 함께 수정된다면 둘은 아직 같은 모델 안에 있을 수 있습니다. 반대로 배송 업체의 정책 변화가 주문 생성 규칙과 무관하다면, 배송은 독립된 책임을 가질 가능성이 큽니다.</p>
          <blockquote>“같은 시점에, 같은 이유로, 같은 사람이 수정하는가?”를 반복해서 묻습니다.</blockquote>
          <p>이 질문은 회의에서 나온 요구사항을 분류할 때 특히 유용합니다. ‘쿠폰은 한 주문에 하나만 적용한다’와 ‘주문 금액은 항목 금액의 합과 같아야 한다’는 주문 생성 시점에 함께 검증되어야 합니다. 반면 ‘출고 전 주소를 검증한다’는 규칙은 주문 생성보다 물류 처리에서 변경될 가능성이 높습니다. 전자는 주문 모델에, 후자는 배송 모델에 가까운 규칙입니다.</p>
          <p>변경 이력을 살펴보는 것도 도움이 됩니다. 특정 파일이나 테이블이 늘 함께 변경되고 같은 리뷰어가 검토한다면, 아직 하나의 책임일 수 있습니다. 반대로 서로 다른 배포 일정과 담당자가 생겼다면 분리를 검토할 신호입니다. 다만 팀 구조만으로 경계를 정하면 모델이 조직도에 종속될 수 있으므로, 반드시 비즈니스 규칙과 함께 판단해야 합니다.</p>
          <h2>2. 불변 조건의 주인을 정한다</h2>
          <p>Aggregate는 모든 데이터를 모으는 상자가 아닙니다. 한 트랜잭션 안에서 반드시 지켜야 하는 규칙을 보호하는 단위입니다. 예를 들어 주문 항목 수와 총액의 일관성은 주문 Aggregate가 책임질 수 있지만, 재고 차감까지 주문 내부에서 보장하려 하면 경계가 과도하게 커질 수 있습니다.</p>
          <div className="article-note"><strong>실무 기준</strong><p>강한 일관성이 필요한 규칙만 Aggregate 안에 둡니다. 나머지는 도메인 이벤트와 후속 처리로 연결해, 각 모델이 자신의 규칙에 집중하도록 만듭니다.</p></div>
          <p>장바구니의 상품을 주문으로 확정하는 순간에는 수량, 단가, 쿠폰, 총액이 서로 모순되지 않아야 합니다. 이 규칙은 하나의 주문 Aggregate 안에서 즉시 검증할 수 있습니다. 하지만 ‘결제가 성공해야 주문을 확정한다’와 ‘재고를 확보해야 한다’는 규칙은 외부 결제 수단과 재고 시스템을 포함합니다. 이 모두를 한 트랜잭션으로 묶으면 장애 전파와 잠금 시간이 커집니다.</p>
          <p>따라서 주문 Aggregate는 결제 완료 여부를 직접 바꾸기보다 <code>OrderPlaced</code> 같은 사실을 발행합니다. 결제와 재고는 각자 그 사실을 받아 자신의 규칙을 수행합니다. 실패가 가능하다는 점을 모델에 드러내고, 보상이나 재시도를 별도의 흐름으로 다루는 편이 현실적인 일관성 모델입니다.</p>
          <h3>예제: 주문 안에서 보장할 규칙</h3>
          <p>아래 코드는 주문이 스스로 보호해야 할 최소 규칙만 담은 예입니다. 재고 수량이나 결제 승인 결과는 여기서 변경하지 않습니다. 주문을 생성했다는 사실만 이벤트로 남겨 다음 모델이 처리할 수 있게 합니다.</p>
          <pre><code>{`type OrderLine = {
  productId: string;
  quantity: number;
  unitPrice: number;
};

class Order {
  private events: unknown[] = [];
  private constructor(
    private readonly id: string,
    private readonly customerId: string,
    private readonly lines: OrderLine[],
  ) {}

  static place(id: string, customerId: string, lines: OrderLine[]) {
    if (lines.length === 0) throw new Error('주문 항목이 필요합니다.');
    if (lines.some((line) => line.quantity <= 0)) {
      throw new Error('수량은 1개 이상이어야 합니다.');
    }
    const order = new Order(id, customerId, lines);
    order.events.push({ type: 'OrderPlaced', orderId: id });
    return order;
  }

  get totalAmount() {
    return this.lines.reduce(
      (total, line) => total + line.quantity * line.unitPrice, 0,
    );
  }
}`}</code></pre>
          <p>이 코드의 핵심은 <code>Order</code>가 자신의 불변 조건만 알고 있다는 점입니다. <code>InventoryRepository</code>나 결제 SDK를 주입하면 편해 보일 수 있지만, 주문 모델은 곧 외부 정책과 장애를 모두 알아야 합니다. 그 순간 경계는 흐려지고 테스트도 어려워집니다.</p>
          <h2>3. 언어가 달라지는 지점을 기록한다</h2>
          <p>같은 단어가 팀마다 다른 뜻으로 쓰이기 시작하면 Bounded Context의 신호일 수 있습니다. 고객 지원의 ‘주문’은 환불과 문의의 대상일 수 있지만, 물류의 ‘주문’은 포장과 출고의 단위입니다. 하나의 모델로 두 의미를 모두 표현하려 하면 필드는 늘어나고 규칙은 흐려집니다.</p>
          <p>이벤트 스토밍이나 요구사항 워크숍에서 사람들이 사용하는 동사를 적어 보면 이 차이가 더 잘 보입니다. 주문 컨텍스트에서는 ‘생성한다’, ‘취소한다’, ‘할인한다’가 중요하지만, 배송 컨텍스트에서는 ‘배차한다’, ‘출고한다’, ‘추적한다’가 중심이 됩니다. 동일한 <code>Order</code> 클래스를 공유하기보다, 각 컨텍스트가 필요한 정보만 자신의 언어로 표현하도록 두는 편이 모델을 단순하게 만듭니다.</p>
          <p>경계 사이의 번역 비용은 피할 대상이 아니라 의도를 보존하는 장치입니다. 배송 서비스가 주문 테이블을 조인하는 대신 <code>ShippingRequested</code> 이벤트를 받는다면, 주문의 내부 구조가 바뀌어도 배송이 영향을 덜 받습니다. 이벤트에는 상대 모델이 필요로 하는 안정된 정보만 담고, 내부 객체를 그대로 직렬화하지 않는 것이 좋습니다.</p>
          <h3>예제: 이벤트로 경계를 연결한다</h3>
          <pre><code>{`type OrderPlaced = {
  type: 'OrderPlaced';
  orderId: string;
  customerId: string;
  items: Array<{ productId: string; quantity: number }>;
};

// 재고 컨텍스트가 주문 이벤트를 소비한다.
async function reserveStock(event: OrderPlaced) {
  const result = await inventory.reserve(event.items);

  if (!result.success) {
    await eventBus.publish({
      type: 'StockReservationFailed',
      orderId: event.orderId,
      reason: result.reason,
    });
  }
}`}</code></pre>
          <p>이 흐름에서는 주문이 재고 확보를 기다리지 않습니다. 대신 재고 확보 실패라는 상태를 받아 주문 취소, 고객 알림, 재시도 같은 후속 정책을 수행합니다. 즉시 성공만 가정하던 모델보다 조금 더 많은 상태를 다뤄야 하지만, 각 시스템의 가용성과 책임을 지킬 수 있습니다. 소비자는 반드시 멱등하게 구현하고, 같은 이벤트가 두 번 도착해도 결과가 달라지지 않게 해야 합니다.</p>
          <h2>4. 읽기 모델은 경계를 가로질러도 된다</h2>
          <p>명령 모델의 경계를 엄격히 나눈다고 해서 화면도 같은 방식으로 조립해야 하는 것은 아닙니다. ‘내 주문 목록’ 화면은 주문 상태, 결제 상태, 배송 추적 정보를 한 번에 보여줘야 합니다. 이런 조회 요구를 맞추기 위해 여러 Aggregate를 한 트랜잭션으로 묶기보다, 이벤트를 받아 화면 전용 읽기 모델을 만드는 편이 낫습니다.</p>
          <p>이때 사용자에게 허용할 수 있는 지연 시간을 명시해야 합니다. 결제 직후 몇 초 동안 배송 상태가 비어 있어도 괜찮은가, 운영자가 보는 화면은 즉시 반영되어야 하는가에 따라 동기 조회와 비동기 프로젝션을 선택합니다. 경계 설계는 기술 문제가 아니라 제품의 일관성 기대치를 함께 결정하는 일입니다.</p>
          <h2>5. 경계는 가설로 시작한다</h2>
          <p>처음부터 완벽한 경계를 찾을 필요는 없습니다. 현재의 변경 패턴, 팀의 책임, 데이터 일관성 요구를 바탕으로 작은 가설을 세우고 검증하면 됩니다. 경계 사이에는 명확한 API나 이벤트 계약을 두어, 나중에 분리하거나 합칠 때의 비용을 낮추는 것이 중요합니다.</p>
          <p>처음에는 한 애플리케이션 안에서 모듈로 분리해도 충분합니다. 모듈 간에는 공개된 인터페이스만 사용하고, 다른 모듈의 Repository나 엔티티를 직접 참조하지 않습니다. 이후 배포 주기, 성능 요구, 팀 소유권이 달라질 때 그 모듈을 독립 서비스로 꺼낼 수 있습니다. 물리적 분리는 마지막 결정이지, 경계를 만드는 첫 번째 단계가 아닙니다.</p>
          <h2>경계를 점검하는 질문</h2>
          <ul>
            <li>이 규칙은 한 번의 트랜잭션에서 반드시 지켜져야 하는가?</li>
            <li>두 기능은 같은 이유와 같은 주기로 변경되는가?</li>
            <li>같은 단어가 팀이나 화면에 따라 다른 의미로 쓰이는가?</li>
            <li>다른 모델의 내부 데이터를 직접 알아야만 기능을 구현할 수 있는가?</li>
            <li>실패했을 때 동기적 롤백이 필요한가, 보상 흐름으로 해결할 수 있는가?</li>
          </ul>
          <p>좋은 경계는 다이어그램에서 아름답기보다, 변경을 국소화하고 팀의 대화를 명확하게 만듭니다. 모델을 나누기 전 “무엇이 왜 함께 바뀌는가”를 묻는 습관이 그 출발점입니다.</p>
        </div>
        <footer className="post-footer">
          <Link to="/">← 메인으로 돌아가기</Link>
          <a href="https://github.com/kyhsa93/backend-service-playbook" target="_blank" rel="noreferrer">Backend Service Playbook ↗</a>
        </footer>
      </article>
    </main>
  );
}
