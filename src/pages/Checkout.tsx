import { useState } from 'react';
import { Icon } from '../components/Icon';
import { money } from '../lib/utils';
import type { Page, Product } from '../types';
import type { CartItem } from '../hooks/useCart';

export function Checkout({ items, cartItems, navigate, onSubmitOrder, isProcessing }: { items: Product[]; cartItems: CartItem[]; navigate: (page: Page) => void; onSubmitOrder: (formData: FormData) => Promise<void>; isProcessing: boolean }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate quantities from cartItems
  const itemsWithQuantities = items.map(item => {
    const cartItem = cartItems.find(ci => ci.product_id === item.id);
    return {
      ...item,
      quantity: cartItem?.quantity || 1
    };
  });

  const subtotal = itemsWithQuantities.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shippingCost = subtotal >= 500 ? 0 : 24;
  const total = subtotal + shippingCost;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData(e.currentTarget);

      // Validate required fields
      const firstName = formData.get('firstName') as string;
      const lastName = formData.get('lastName') as string;
      const streetAddress = formData.get('streetAddress') as string;
      const city = formData.get('city') as string;
      const state = formData.get('state') as string;
      const zipCode = formData.get('zipCode') as string;
      const country = formData.get('country') as string;
      const email = formData.get('email') as string;

      if (!firstName || !lastName || !streetAddress || !city || !state || !zipCode || !country || !email) {
        throw new Error('Please fill in all required fields');
      }

      // Validate product availability and stock
      for (const item of itemsWithQuantities) {
        if (item.stock < item.quantity) {
          throw new Error(`Only ${item.stock} of "${item.name}" available. You requested ${item.quantity}.`);
        }
        if (item.status !== 'active') {
          throw new Error(`"${item.name}" is no longer available`);
        }
      }

      // Call the order creation handler passed from App.tsx
      await onSubmitOrder(formData);
    } catch (err: any) {
      setError(err.message || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="checkout-page">
      <div className="checkout-form">
        <button className="back-link" onClick={() => navigate("cart")}>← Return to cart</button>
        <span className="eyebrow">Secure checkout</span>
        <h1>Where should we<br /><em>send your find?</em></h1>
        {error && <div style={{ color: '#dc2626', marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#fef2f2', borderRadius: '4px' }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <h3>Contact</h3>
          <div className="form-grid"><label className="wide">Email address<input name="email" required type="email" placeholder="you@example.com" /></label></div>
          <h3>Shipping address</h3>
          <div className="form-grid">
            <label>First name<input name="firstName" required placeholder="Maya" /></label>
            <label>Last name<input name="lastName" required placeholder="Rivera" /></label>
            <label className="wide">Street address<input name="streetAddress" required placeholder="123 Bedford Avenue" /></label>
            <label>City<input name="city" required placeholder="Brooklyn" /></label>
            <label>State<select name="state"><option>New York</option><option>California</option></select></label>
            <label>ZIP code<input name="zipCode" required placeholder="11211" /></label>
            <label>Country<select name="country"><option>United States</option><option>Canada</option></select></label>
          </div>
          <h3>Payment</h3>
          <div className="payment-box"><label>Card number<input required placeholder="4242 4242 4242 4242" /></label><div><label>Expiration<input required placeholder="MM / YY" /></label><label>Security code<input required placeholder="CVC" /></label></div></div>
          <button className="button primary wide-button" type="submit" disabled={loading || isProcessing}>{loading || isProcessing ? 'Processing...' : `Place order · ${money(total)}`} <Icon name="arrow" /></button>
        </form>
      </div>
      <aside className="checkout-summary">
        <h2>Your order</h2>
        {itemsWithQuantities.map((item) => (
          <div className="checkout-item" key={item.id}>
            <img src={item.images?.[0] || ''} alt="" />
            <div>
              <strong>{item.name}</strong>
              <span>{item.condition} · Qty {item.quantity}</span>
            </div>
            <b>{money(item.price * item.quantity)}</b>
          </div>
        ))}
        <hr />
        <div><span>Subtotal</span><strong>{money(subtotal)}</strong></div>
        <div><span>Shipping</span><strong>{shippingCost === 0 ? "Complimentary" : money(shippingCost)}</strong></div>
        <div className="total"><span>Total</span><strong>{money(total)}</strong></div>
        <p><Icon name="shield" /> Every order is protected by our authenticity and condition guarantee.</p>
      </aside>
    </main>
  );
}
