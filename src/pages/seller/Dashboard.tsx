import { Icon } from '../../components/Icon';
import { money } from '../../lib/utils';
import type { Page, Product } from '../../types';
import type { Profile } from '../../hooks/useAuth';
import { useAuth } from '../../hooks/useAuth';
import { useOrders } from '../../hooks/useOrders';

export function Dashboard({ navigate, products, loading, profile, user, refetch }: { navigate: (page: Page) => void; products: Product[]; loading: boolean; profile: Profile | null; user: any; refetch: () => void }) {
  const { orders, loading: ordersLoading } = useOrders(user?.id || null, true);
  const storeName = profile?.store_name || profile?.full_name || 'Seller';

  // Calculate real metrics
  const totalProducts = products.length;
  const activeListings = products.filter(p => p.status === 'active').length;
  const activePercentage = totalProducts > 0 ? Math.round((activeListings / totalProducts) * 100) : 0;

  // Calculate items sold and total sales from order_items
  const itemsSold = orders.reduce((sum, order) => {
    return sum + (order.items?.reduce((itemSum, item) => {
      return itemSum + item.quantity;
    }, 0) || 0);
  }, 0);

  const totalSales = orders.reduce((sum, order) => {
    return sum + (order.items?.reduce((itemSum, item) => {
      return itemSum + (item.price * item.quantity);
    }, 0) || 0);
  }, 0);

  const stats = [
    ["Total products", totalProducts.toString(), "All time", "box"],
    ["Active listings", activeListings.toString(), `${activePercentage}% of inventory`, "bag"],
    ["Items sold", itemsSold.toString(), "All time", "check"],
    ["Total sales", money(totalSales), "All time", "chart"]
  ];
  return (
    <main className="inner-page">
      <div className="dashboard-title">
        <div>
          <span className="eyebrow">Seller workspace</span>
          <h1>Good morning, {storeName}.</h1>
          <p>Here's what's happening with your collection today.</p>
        </div>
        <button className="button primary" onClick={() => navigate("products")}><Icon name="plus" /> Add a product</button>
      </div>
      <div className="stats-grid">
        {stats.map(([label, value, note, icon]) => (
          <div className="stat-card" key={label}>
            <span><Icon name={icon} /></span>
            <small>{label}</small>
            <strong>{value}</strong>
            <p>{note}</p>
          </div>
        ))}
      </div>
      <div className="dashboard-grid">
        <div className="table-card">
          <div className="panel-heading">
            <h2>Recent orders</h2>
            <button className="text-link" onClick={() => navigate("seller-orders")}>View all <Icon name="arrow" /></button>
          </div>
          {ordersLoading ? (
            <p>Loading...</p>
          ) : orders.length === 0 ? (
            <p>No orders yet.</p>
          ) : (
            orders.slice(0, 3).map((order) => (
              <div className="recent-row" key={order.id}>
                <div className="avatar small">{order.buyer_name?.[0] || 'B'}</div>
                <div>
                  <strong>{order.buyer_name || 'Buyer'}</strong>
                  <span>{order.order_number} · {new Date(order.created_at).toLocaleDateString()}</span>
                </div>
                <b>{money(order.total)}</b>
                <i className={`status ${order.status.toLowerCase()}`}>{order.status}</i>
              </div>
            ))
          )}
        </div>
        <div className="table-card">
          <div className="panel-heading">
            <h2>Recent listings</h2>
            <button className="text-link" onClick={() => navigate("products")}>Manage <Icon name="arrow" /></button>
          </div>
          {loading ? (
            <p>Loading...</p>
          ) : products.length === 0 ? (
            <p>No listings yet. Add your first product to get started.</p>
          ) : (
            products.slice(0, 3).map((product) => (
              <div className="recent-row" key={product.id}>
                <img src={product.images?.[0] || ''} alt="" />
                <div>
                  <strong>{product.name}</strong>
                  <span>{product.condition} · Stock {product.stock}</span>
                </div>
                <b>{money(product.price)}</b>
              </div>
            ))
          )}
        </div>
      </div>
      <div className="seller-tip">
        <Icon name="shield" size={30} />
        <div>
          <strong>Trust makes a difference.</strong>
          <p>Listings with detailed condition notes and authenticity information sell 32% faster.</p>
        </div>
        <button onClick={() => navigate("products")}>Improve listings</button>
      </div>
    </main>
  );
}
