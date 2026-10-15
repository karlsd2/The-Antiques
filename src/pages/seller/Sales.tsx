import { Icon } from '../../components/Icon';
import { Badge } from '../../components/Badge';
import { money } from '../../lib/utils';
import type { Product } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useOrders } from '../../hooks/useOrders';

export function Sales({ products }: { products: Product[] }) {
  const { user } = useAuth();
  const { orders, loading } = useOrders(user?.id || null, true);

  // Calculate metrics from actual order data
  const totalOrders = orders.length;
  const totalItemsSold = orders.reduce((sum, order) => {
    return sum + (order.items?.reduce((itemSum, item) => itemSum + item.quantity, 0) || 0);
  }, 0);

  const grossSales = orders.reduce((sum, order) => {
    return sum + (order.items?.reduce((itemSum, item) => itemSum + (item.price * item.quantity), 0) || 0);
  }, 0);

  // Assuming 10% marketplace fee for net earnings
  const marketplaceFee = grossSales * 0.10;
  const netEarnings = grossSales - marketplaceFee;

  const averageOrder = totalOrders > 0 ? grossSales / totalOrders : 0;

  // Conversion rate: (orders / total product views) - since we don't track views,
  // we'll calculate it as orders per active product as a placeholder
  const activeProducts = products.filter(p => p.status === 'active').length;
  const conversionRate = activeProducts > 0 ? (totalOrders / activeProducts) * 100 : 0;

  // Calculate monthly sales data
  const monthlySales = Array(12).fill(0).map((_, monthIndex) => {
    const currentYear = new Date().getFullYear();
    return orders.reduce((sum, order) => {
      const orderDate = new Date(order.created_at);
      if (orderDate.getFullYear() === currentYear && orderDate.getMonth() === monthIndex) {
        return sum + (order.items?.reduce((itemSum, item) => itemSum + (item.price * item.quantity), 0) || 0);
      }
      return sum;
    }, 0);
  });

  // Find max value for scaling
  const maxMonthlySales = Math.max(...monthlySales, 1);
  const chartHeights = monthlySales.map(sales => (sales / maxMonthlySales) * 100);

  // Calculate best-selling products
  const productSales = products.map(product => {
    const totalSold = orders.reduce((sum, order) => {
      return sum + (order.items?.reduce((itemSum, item) => {
        return itemSum + (item.product_id === product.id ? item.quantity : 0);
      }, 0) || 0);
    }, 0);
    return {
      ...product,
      totalSold,
      totalRevenue: totalSold * product.price
    };
  }).filter(p => p.totalSold > 0).sort((a, b) => b.totalSold - a.totalSold);

  return (
    <main className="inner-page">
      <div className="dashboard-title">
        <div>
          <span className="eyebrow">Performance</span>
          <h1>Sales overview</h1>
          <p>Understand how your collection is performing.</p>
        </div>
        <select><option>Last 6 months</option><option>This year</option></select>
      </div>
      <div className="stats-grid">
        <div className="stat-card">
          <small>Gross sales</small>
          <strong>{loading ? '...' : money(grossSales)}</strong>
          <p>{totalItemsSold} items sold</p>
        </div>
        <div className="stat-card">
          <small>Net earnings</small>
          <strong>{loading ? '...' : money(netEarnings)}</strong>
          <p>After 10% marketplace fee</p>
        </div>
        <div className="stat-card">
          <small>Average order</small>
          <strong>{loading ? '...' : money(averageOrder)}</strong>
          <p>Across {totalOrders} sales</p>
        </div>
        <div className="stat-card">
          <small>Conversion</small>
          <strong>{loading ? '...' : conversionRate.toFixed(1)}%</strong>
          <p>Orders per active product</p>
        </div>
      </div>
      <div className="sales-chart table-card">
        <div className="panel-heading">
          <h2>Sales activity</h2>
          <Badge>{loading ? 'Loading...' : grossSales > 0 ? 'Active sales' : 'No sales yet'}</Badge>
        </div>
        <div className="chart-bars">
          {chartHeights.map((height, i) => (
            <div key={i}>
              <i style={{ height: `${height}%` }} />
              <span>{["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"][i]}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="table-card best-sellers">
        <div className="panel-heading"><h2>Best-selling pieces</h2></div>
        {productSales.length === 0 ? (
          <p>No sales yet.</p>
        ) : (
          productSales.slice(0, 4).map((product, index) => (
            <div className="recent-row" key={product.id}>
              <span className="rank">0{index + 1}</span>
              <img src={product.images?.[0] || ''} alt="" />
              <div><strong>{product.name}</strong><span>{product.totalSold} sold</span></div>
              <b>{money(product.totalRevenue)}</b>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
