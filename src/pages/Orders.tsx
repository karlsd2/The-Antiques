import { Icon } from '../components/Icon';
import { money } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';
import { useOrders } from '../hooks/useOrders';

export function Orders({ seller = false }: { seller?: boolean }) {
  const { user } = useAuth();
  const { orders, loading, error } = useOrders(user?.id || null, seller);
  return (
    <main className="inner-page">
      <div className="dashboard-title">
        <div>
          <span className="eyebrow">{seller ? "Seller workspace" : "Your collection"}</span>
          <h1>{seller ? "Manage orders" : "Your orders"}</h1>
          <p>{seller ? "Keep buyers updated from purchase to delivery." : "Follow every piece from the seller's hands to yours."}</p>
        </div>
      </div>
      <div className="table-card">
        <div className="table-tools">
          <strong>{orders.length} orders</strong>
          <label className="search-field"><Icon name="search" size={17} /><input placeholder="Search orders" /></label>
        </div>
        <div className="data-table">
          <div className="table-row header">
            <span>Order</span>
            <span>{seller ? "Buyer / Product" : "Product"}</span>
            <span>Date</span>
            <span>Total</span>
            <span>Status</span>
            <span></span>
          </div>
          {loading ? (
            <div className="table-row"><span>Loading...</span></div>
          ) : error ? (
            <div className="table-row"><span>Error: {error.message}</span></div>
          ) : orders.length === 0 ? (
            <div className="table-row"><span>No orders yet.</span></div>
          ) : (
            orders.map((order) => (
              <div className="table-row" key={order.id}>
                <strong>{order.order_number}</strong>
                <span>{seller && order.buyer_name ? <small>{order.buyer_name} · </small> : ''}{order.items?.[0]?.product_name || 'Order'}</span>
                <span>{new Date(order.created_at).toLocaleDateString()}</span>
                <span>{money(order.total)}</span>
                <span><i className={`status ${order.status.toLowerCase()}`}>{order.status}</i></span>
                <button>{seller ? "Update" : "View"} <Icon name="chevron" size={14} /></button>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
