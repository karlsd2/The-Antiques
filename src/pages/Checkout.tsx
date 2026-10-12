import { Icon } from '../components/Icon';
import { money } from '../lib/utils';
import type { Page, Product } from '../types';

export function Checkout({ items, navigate }: { items: Product[]; navigate: (page: Page) => void }) {
  const total = items.reduce((sum, item) => sum + item.price, 0) + (items.reduce((sum, item) => sum + item.price, 0) >= 500 ? 0 : 24);
  return (
    <main className="checkout-page">
      <div className="checkout-form">
        <button className="back-link" onClick={() => navigate("cart")}>← Return to cart</button>
        <span className="eyebrow">Secure checkout</span>
        <h1>Where should we<br /><em>send your find?</em></h1>
        <form onSubmit={(e) => { e.preventDefault(); navigate("confirmation"); }}>
          <h3>Contact</h3>
          <div className="form-grid"><label className="wide">Email address<input required type="email" placeholder="you@example.com" /></label></div>
          <h3>Shipping address</h3>
          <div className="form-grid">
            <label>First name<input required placeholder="Maya" /></label><label>Last name<input required placeholder="Rivera" /></label>
            <label className="wide">Street address<input required placeholder="123 Bedford Avenue" /></label>
            <label>City<input required placeholder="Brooklyn" /></label><label>State<select><option>New York</option><option>California</option></select></label>
            <label>ZIP code<input required placeholder="11211" /></label><label>Country<select><option>United States</option><option>Canada</option></select></label>
          </div>
          <h3>Payment</h3>
          <div className="payment-box"><label>Card number<input required placeholder="4242 4242 4242 4242" /></label><div><label>Expiration<input required placeholder="MM / YY" /></label><label>Security code<input required placeholder="CVC" /></label></div></div>
          <button className="button primary wide-button" type="submit">Place order · {money(total)} <Icon name="arrow" /></button>
        </form>
      </div>
      <aside className="checkout-summary">
        <h2>Your order</h2>
        {items.map((item) => <div className="checkout-item" key={item.id}><img src={item.images?.[0] || ''} alt="" /><div><strong>{item.name}</strong><span>{item.condition} · Qty 1</span></div><b>{money(item.price)}</b></div>)}
        <hr /><div><span>Subtotal</span><strong>{money(items.reduce((sum, item) => sum + item.price, 0))}</strong></div><div><span>Shipping</span><strong>{total > 500 ? "Complimentary" : "$24"}</strong></div><div className="total"><span>Total</span><strong>{money(total)}</strong></div>
        <p><Icon name="shield" /> Every order is protected by our authenticity and condition guarantee.</p>
      </aside>
    </main>
  );
}
