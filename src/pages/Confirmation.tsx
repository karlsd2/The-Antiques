import { Icon } from '../components/Icon';
import type { Page } from '../types';

export function Confirmation({ navigate, orderNumber }: { navigate: (page: Page) => void; orderNumber?: string }) {
  // Calculate estimated delivery (5-7 business days from now)
  const deliveryStart = new Date();
  deliveryStart.setDate(deliveryStart.getDate() + 5);
  const deliveryEnd = new Date();
  deliveryEnd.setDate(deliveryEnd.getDate() + 7);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <main className="confirmation">
      <div className="success-mark"><Icon name="check" size={36} /></div>
      <span className="eyebrow">Order confirmed</span>
      <h1>A new story<br /><em>is on its way.</em></h1>
      <p>Thank you. We've sent confirmation and tracking details to your email.</p>
      <div className="order-ticket">
        <div><span>Order number</span><strong>#{orderNumber || 'Loading...'}</strong></div>
        <div><span>Estimated delivery</span><strong>{formatDate(deliveryStart)}–{formatDate(deliveryEnd)}</strong></div>
      </div>
      <div className="hero-actions">
        <button className="button primary" onClick={() => navigate("orders")}>View your order</button>
        <button className="button outline" onClick={() => navigate("shop")}>Keep exploring</button>
      </div>
    </main>
  );
}
