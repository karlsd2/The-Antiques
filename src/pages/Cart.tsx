import { Icon } from '../components/Icon';
import { Badge } from '../components/Badge';
import { money } from '../lib/utils';
import type { Page, Product } from '../types';

export function Cart({ items, remove, navigate }: { items: Product[]; remove: (id: string) => void; navigate: (page: Page) => void }) {
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  return (
    <main className="inner-page narrow">
      <div className="page-intro compact">
        <span className="eyebrow">Your selection</span>
        <h1>Shopping cart</h1>
        <p>{items.length} one-of-a-kind {items.length === 1 ? "piece" : "pieces"} reserved for you.</p>
      </div>
      {items.length === 0 ? (
        <div className="empty-state">
          <Icon name="bag" size={36} />
          <h2>Your cart is waiting</h2>
          <p>Explore the collection and find a piece worth keeping.</p>
          <button className="button primary" onClick={() => navigate("shop")}>Browse collection</button>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-list">
            {items.map((item) => (
              <div className="cart-item" key={item.id}>
                <img src={item.images?.[0] || ''} alt={item.name} />
                <div>
                  <span>{item.category_name || 'Uncategorized'}</span>
                  <h3>{item.name}</h3>
                  <Badge>{item.condition}</Badge>
                  <button onClick={() => remove(item.id)}><Icon name="trash" size={16} /> Remove</button>
                </div>
                <strong>{money(item.price)}</strong>
              </div>
            ))}
          </div>
          <aside className="summary-card">
            <h2>Order summary</h2>
            <div><span>Subtotal</span><strong>{money(subtotal)}</strong></div>
            <div><span>Insured shipping</span><strong>{subtotal >= 500 ? "Complimentary" : "$24"}</strong></div>
            <div><span>Estimated tax</span><span>Calculated at checkout</span></div>
            <hr />
            <div className="total"><span>Total</span><strong>{money(subtotal + (subtotal >= 500 ? 0 : 24))}</strong></div>
            <button className="button primary" onClick={() => navigate("checkout")}>Proceed to checkout <Icon name="arrow" /></button>
            <small><Icon name="shield" size={14} /> Protected purchase guarantee</small>
          </aside>
        </div>
      )}
    </main>
  );
}
