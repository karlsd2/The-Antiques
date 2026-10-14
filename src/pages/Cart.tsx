import { Icon } from '../components/Icon';
import { Badge } from '../components/Badge';
import { money } from '../lib/utils';
import type { Page, Product } from '../types';
import type { CartItem } from '../hooks/useCart';

export function Cart({ items, cartItems, remove, updateQuantity, navigate, loading, error }: { items: Product[]; cartItems: CartItem[]; remove: (id: string) => void; updateQuantity: (id: string, quantity: number) => void; navigate: (page: Page) => void; loading: boolean; error: Error | null }) {
  const subtotal = items.reduce((sum, item) => {
    const cartItem = cartItems.find(ci => ci.product_id === item.id);
    return sum + item.price * (cartItem?.quantity || 1);
  }, 0);

  if (loading) {
    return (
      <main className="inner-page narrow">
        <div className="page-intro compact">
          <span className="eyebrow">Your selection</span>
          <h1>Shopping cart</h1>
          <p>Loading your cart...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="inner-page narrow">
        <div className="page-intro compact">
          <span className="eyebrow">Your selection</span>
          <h1>Shopping cart</h1>
          <p>Error loading cart: {error.message}</p>
        </div>
      </main>
    );
  }

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
            {items.map((item) => {
              const cartItem = cartItems.find(ci => ci.product_id === item.id);
              const quantity = cartItem?.quantity || 1;
              const maxStock = item.stock;

              return (
                <div className="cart-item" key={item.id}>
                  <img src={item.images?.[0] || ''} alt={item.name} />
                  <div>
                    <span>{item.category_name || 'Uncategorized'}</span>
                    <h3>{item.name}</h3>
                    <Badge>{item.condition}</Badge>
                    <div className="quantity-controls">
                      <button
                        onClick={() => {
                          const newQty = Math.max(1, quantity - 1);
                          updateQuantity(item.id, newQty).catch(err => console.error(err));
                        }}
                        disabled={quantity <= 1}
                        aria-label="Decrease quantity"
                      >
                        <Icon name="close" size={16} />
                      </button>
                      <span>{quantity}</span>
                      <button
                        onClick={() => {
                          const newQty = Math.min(maxStock, quantity + 1);
                          updateQuantity(item.id, newQty).catch(err => console.error(err));
                        }}
                        disabled={quantity >= maxStock}
                        aria-label="Increase quantity"
                      >
                        <Icon name="plus" size={16} />
                      </button>
                    </div>
                    <button onClick={() => remove(item.id)}><Icon name="trash" size={16} /> Remove</button>
                  </div>
                  <strong>{money(item.price * quantity)}</strong>
                </div>
              );
            })}
          </div>
          <aside className="summary-card">
            <h2>Order summary</h2>
            <div><span>Subtotal</span><strong>{money(subtotal)}</strong></div>
            <div><span>Insured shipping</span><strong>{subtotal >= 5000 ? "Complimentary" : money(150)}</strong></div>
            <div><span>Estimated tax</span><span>Calculated at checkout</span></div>
            <hr />
            <div className="total"><span>Total</span><strong>{money(subtotal + (subtotal >= 5000 ? 0 : 150))}</strong></div>
            <button className="button primary" onClick={() => navigate("checkout")}>Proceed to checkout <Icon name="arrow" /></button>
            <small><Icon name="shield" size={14} /> Protected purchase guarantee</small>
          </aside>
        </div>
      )}
    </main>
  );
}
