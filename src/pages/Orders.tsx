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
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const handleUpdateClick = (order: Order) => {
    setUpdatingOrder(order);
    setUpdateError(null);
  };

  const handleViewClick = (order: Order) => {
    setViewingOrder(order);
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
                <button onClick={() => seller ? handleUpdateClick(order) : handleViewClick(order)}>{seller ? "Update" : "View"} <Icon name="chevron" size={14} /></button>
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
      {viewingOrder && (
        <div className="modal-backdrop" onClick={() => setViewingOrder(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setViewingOrder(null)}><Icon name="close" /></button>
            <span className="eyebrow">Order details</span>
            <h2>{viewingOrder.order_number}</h2>
            <div style={{ marginBottom: '25px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid var(--line)' }}>
                <span style={{ color: 'var(--ink-soft)', textTransform: 'uppercase', fontSize: '9px', letterSpacing: '.1em' }}>Status</span>
                <i className={`status ${viewingOrder.status.toLowerCase()}`}>{viewingOrder.status}</i>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid var(--line)' }}>
                <span style={{ color: 'var(--ink-soft)', textTransform: 'uppercase', fontSize: '9px', letterSpacing: '.1em' }}>Date</span>
                <span>{new Date(viewingOrder.created_at).toLocaleDateString()}</span>
              </div>
              <div style={{ marginBottom: '25px' }}>
                <span style={{ color: 'var(--ink-soft)', textTransform: 'uppercase', fontSize: '9px', letterSpacing: '.1em', display: 'block', marginBottom: '15px' }}>Items</span>
                {viewingOrder.items?.map((item) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid var(--line)' }}>
                    <div>
                      <strong style={{ display: 'block', fontSize: '12px' }}>{item.product_name}</strong>
                      <span style={{ color: 'var(--ink-soft)', fontSize: '9px' }}>{item.product_condition || 'N/A'} · Qty {item.quantity}</span>
                    </div>
                    <b style={{ fontFamily: '"Playfair Display", serif', fontSize: '13px' }}>{money(item.price * item.quantity)}</b>
                  </div>
                ))}
              </div>
              <div style={{ marginBottom: '15px' }}>
                <span style={{ color: 'var(--ink-soft)', textTransform: 'uppercase', fontSize: '9px', letterSpacing: '.1em', display: 'block', marginBottom: '15px' }}>Shipping address</span>
                <div style={{ fontSize: '11px', lineHeight: '1.6' }}>
                  {viewingOrder.shipping_address && (
                    <>
                      <div style={{ marginBottom: '8px' }}>
                        <strong>{viewingOrder.shipping_address.first_name} {viewingOrder.shipping_address.last_name}</strong>
                      </div>
                      <div style={{ marginBottom: '8px' }}>
                        {viewingOrder.shipping_address.house_number} {viewingOrder.shipping_address.street}
                        {viewingOrder.shipping_address.additional_details && <>, {viewingOrder.shipping_address.additional_details}</>}
                      </div>
                      <div style={{ marginBottom: '8px' }}>
                        {viewingOrder.shipping_address.barangay}
                      </div>
                      <div style={{ marginBottom: '8px' }}>
                        {viewingOrder.shipping_address.city_municipality}, {viewingOrder.shipping_address.province}
                      </div>
                      <div style={{ marginBottom: '8px' }}>
                        {viewingOrder.shipping_address.region}
                      </div>
                      <div>
                        {viewingOrder.shipping_address.postal_code}
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '15px', borderTop: '1px solid var(--line)' }}>
                <span style={{ textTransform: 'uppercase', fontSize: '9px', letterSpacing: '.1em' }}>Subtotal</span>
                <span>{money(viewingOrder.total - viewingOrder.shipping_cost)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                <span style={{ textTransform: 'uppercase', fontSize: '9px', letterSpacing: '.1em' }}>Shipping</span>
                <span>{viewingOrder.shipping_cost === 0 ? "Complimentary" : money(viewingOrder.shipping_cost)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '15px', borderTop: '1px solid var(--line)' }}>
                <span style={{ textTransform: 'uppercase', fontSize: '9px', letterSpacing: '.1em', fontWeight: '600' }}>Total</span>
                <strong style={{ fontFamily: '"Playfair Display", serif', fontSize: '23px' }}>{money(viewingOrder.total)}</strong>
              </div>
            </div>
            <div className="modal-actions">
              <button className="button outline" onClick={() => setViewingOrder(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
