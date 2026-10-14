import { Icon } from '../components/Icon';
import { Badge } from '../components/Badge';
import { money } from '../lib/utils';
import type { Page, Product } from '../types';
import type { CartItem } from '../hooks/useCart';

export function Cart({ items, cartItems, remove, updateQuantity, navigate, loading, error, totalCount }: { items: Product[]; cartItems: CartItem[]; remove: (id: string) => void; updateQuantity: (id: string, quantity: number) => void; navigate: (page: Page) => void; loading: boolean; error: Error | null; totalCount?: number }) {
  // Diagnostic logging for received items
  console.log(`[Cart Page] Received ${items.length} items`);
  console.log(`[Cart Page] Items data:`, items);
  console.log(`[Cart Page] CartItems data:`, cartItems);

  // Filter out items with missing or invalid product data with diagnostic logging
  const validItems = items.filter(item => {
    const isValid = item.name && item.price > 0 && item.stock > 0;
    if (!isValid) {
      const reasons = [];
      if (!item.name) reasons.push('missing name');
      if (!item.price || item.price <= 0) reasons.push(`invalid price: ${item.price}`);
      if (!item.stock || item.stock <= 0) reasons.push(`invalid stock: ${item.stock}`);
      console.warn(`[Cart Page] Product ${item.id} is invalid: ${reasons.join(', ')}`);
    }
    return isValid;
  });

  const invalidItems = items.filter(item => !item.name || item.price <= 0 || item.stock <= 0);

  // Generate diagnostic details for invalid items
  const invalidItemDetails = invalidItems.map(item => {
    const reasons = [];
    if (!item.name) reasons.push('missing name');
    if (!item.price || item.price <= 0) reasons.push(`price: ${item.price}`);
    if (!item.stock || item.stock <= 0) reasons.push(`stock: ${item.stock}`);
    return {
      id: item.id,
      name: item.name || '(no name)',
      reasons: reasons.join(', ')
    };
  });

  const subtotal = validItems.reduce((sum, item) => {
    const cartItem = cartItems.find(ci => ci.product_id === item.id);
    return sum + item.price * (cartItem?.quantity || 1);
  }, 0);

  const handleCheckout = () => {
    if (invalidItems.length > 0) {
      alert('Some items in your cart have missing or invalid data. Please remove them before checkout.');
      return;
    }
    navigate("checkout");
  };

  const handleRemoveInvalid = async () => {
    const confirmed = window.confirm(`Are you sure you want to remove ${invalidItems.length} invalid item(s) from your cart? This action cannot be undone.`);
    if (!confirmed) return;

    for (const item of invalidItems) {
      try {
        await remove(item.id);
        console.log(`[Cart] Removed invalid item: ${item.id}`);
      } catch (err) {
        console.error('Error removing invalid item:', err);
      }
    }
  };

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
        <p>{validItems.length} one-of-a-kind {validItems.length === 1 ? "piece" : "pieces"} reserved for you.{totalCount && totalCount > validItems.length ? ` (${totalCount - validItems.length} item(s) unavailable)` : ''}</p>
      </div>
      {invalidItems.length > 0 && (
        <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#fef3c7', borderRadius: '4px', border: '1px solid #f59e0b' }}>
          <p style={{ margin: '0 0 0.5rem 0', color: '#92400e', fontSize: '0.9rem' }}>
            <Icon name="info" size={16} /> <strong>{invalidItems.length} item(s) in your cart have missing or invalid data and cannot be purchased.</strong> These items have been removed from your display.
          </p>
          <ul style={{ margin: '0', paddingLeft: '1.5rem', color: '#92400e', fontSize: '0.85rem' }}>
            {invalidItemDetails.map((detail, index) => (
              <li key={index}><strong>{detail.name}</strong> – {detail.reasons}</li>
            ))}
          </ul>
          <p style={{ margin: '0.5rem 0 0 0', color: '#92400e', fontSize: '0.85rem' }}>
            Please check your browser console for detailed diagnostic information. Contact support if you believe this is an error.
          </p>
        </div>
      )}
      {validItems.length === 0 ? (
        <div className="empty-state">
          <Icon name="bag" size={36} />
          <h2>Your cart is waiting</h2>
          <p>Explore the collection and find a piece worth keeping.</p>
          <button className="button primary" onClick={() => navigate("shop")}>Browse collection</button>
          {invalidItems.length > 0 && (
            <button className="button outline" onClick={handleRemoveInvalid} style={{ marginTop: '0.5rem' }}>
              Remove {invalidItems.length} invalid item(s)
            </button>
          )}
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-list">
            {validItems.map((item) => {
              const cartItem = cartItems.find(ci => ci.product_id === item.id);
              const quantity = cartItem?.quantity || 1;
              const maxStock = item.stock;
              const imageUrl = item.images?.[0];

              return (
                <div className="cart-item" key={item.id}>
                  {imageUrl ? (
                    <img src={imageUrl} alt={item.name} />
                  ) : (
                    <div style={{ width: '80px', height: '80px', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px' }}>
                      <Icon name="bag" size={32} style={{ color: '#9ca3af' }} />
                    </div>
                  )}
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
                        −
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
                        +
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
            <button className="button primary" onClick={handleCheckout}>Proceed to checkout <Icon name="arrow" /></button>
            <small><Icon name="shield" size={14} /> Protected purchase guarantee</small>
          </aside>
        </div>
      )}
    </main>
  );
}
