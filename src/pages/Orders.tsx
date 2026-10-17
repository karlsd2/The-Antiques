import { useState } from 'react';
import { Icon } from '../components/Icon';
import { SkeletonRow } from '../components/Skeleton';
import { money } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';
import { useOrders } from '../hooks/useOrders';
import type { Order } from '../hooks/useOrders';

export function Orders({ seller = false }: { seller?: boolean }) {
  const { user } = useAuth();
  const { orders, loading, error, updateOrderStatus } = useOrders(user?.id || null, seller);
  const [updatingOrder, setUpdatingOrder] = useState<Order | null>(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const handleUpdateClick = (order: Order) => {
    setUpdatingOrder(order);
    setUpdateError(null);
  };

  const handleStatusChange = async (newStatus: Order['status']) => {
    if (!updatingOrder) return;

    setUpdateLoading(true);
    setUpdateError(null);

    try {
      await updateOrderStatus(updatingOrder.id, newStatus);
      setUpdatingOrder(null);
    } catch (err: any) {
      setUpdateError(err.message || 'Failed to update order status');
    } finally {
      setUpdateLoading(false);
    }
  };

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
            <SkeletonRow count={5} />
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
                <button onClick={() => seller && handleUpdateClick(order)}>{seller ? "Update" : "View"} <Icon name="chevron" size={14} /></button>
              </div>
            ))
          )}
        </div>
      </div>
      {updatingOrder && (
        <div className="modal-backdrop" onClick={() => setUpdatingOrder(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setUpdatingOrder(null)}><Icon name="close" /></button>
            <span className="eyebrow">Update order status</span>
            <h2>{updatingOrder.order_number}</h2>
            {updateError && <div style={{ color: '#dc2626', marginBottom: '1rem' }}>{updateError}</div>}
            <div className="form-grid">
              <label>
                Current status
                <input value={updatingOrder.status} disabled />
              </label>
              <label>
                New status
                <select
                  value=""
                  onChange={(e) => handleStatusChange(e.target.value as Order['status'])}
                  disabled={updateLoading}
                >
                  <option value="">Select new status</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Processing">Processing</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </label>
            </div>
            <div className="modal-actions">
              <button className="button outline" onClick={() => setUpdatingOrder(null)} disabled={updateLoading}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
