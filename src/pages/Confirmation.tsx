import { Icon } from '../components/Icon';
import type { Page } from '../types';

export function Confirmation({ navigate }: { navigate: (page: Page) => void }) {
  return (
    <main className="confirmation">
      <div className="success-mark"><Icon name="check" size={36} /></div>
      <span className="eyebrow">Order confirmed</span>
      <h1>A new story<br /><em>is on its way.</em></h1>
      <p>Thank you, Maya. We've sent confirmation and tracking details to your email.</p>
      <div className="order-ticket">
        <div><span>Order number</span><strong>#TA-2048</strong></div>
        <div><span>Estimated delivery</span><strong>June 18–21</strong></div>
      </div>
      <div className="hero-actions">
        <button className="button primary" onClick={() => navigate("orders")}>View your order</button>
        <button className="button outline" onClick={() => navigate("shop")}>Keep exploring</button>
      </div>
    </main>
  );
}
