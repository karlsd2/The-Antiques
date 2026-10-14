import { Icon } from '../../components/Icon';
import { Badge } from '../../components/Badge';
import { money } from '../../lib/utils';
import type { Product } from '../../types';

export function Sales({ products }: { products: Product[] }) {
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
        <div className="stat-card"><small>Gross sales</small><strong>₱1,034,000</strong><p>+18.2% from last period</p></div>
        <div className="stat-card"><small>Net earnings</small><strong>₱928,000</strong><p>After marketplace fees</p></div>
        <div className="stat-card"><small>Average order</small><strong>₱8,200</strong><p>Across 126 sales</p></div>
        <div className="stat-card"><small>Conversion</small><strong>4.8%</strong><p>+0.6% improvement</p></div>
      </div>
      <div className="sales-chart table-card">
        <div className="panel-heading">
          <h2>Sales activity</h2>
          <Badge>Healthy growth</Badge>
        </div>
        <div className="chart-bars">
          {[34, 48, 42, 65, 58, 82, 76, 92, 68, 88, 79, 100].map((height, i) => (
            <div key={i}>
              <i style={{ height: `${height}%` }} />
              <span>{["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"][i]}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="table-card best-sellers">
        <div className="panel-heading"><h2>Best-selling pieces</h2></div>
        {products.slice(0, 4).map((product, index) => (
          <div className="recent-row" key={product.id}>
            <span className="rank">0{index + 1}</span>
            <img src={product.images?.[0] || ''} alt="" />
            <div><strong>{product.name}</strong><span>{index * 4 + 7} sold</span></div>
            <b>{money(product.price * (index * 4 + 7))}</b>
          </div>
        ))}
      </div>
    </main>
  );
}
