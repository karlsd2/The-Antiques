export function SkeletonCard({ count = 1 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <article className="product-card skeleton-card" key={i}>
          <div className="product-image skeleton-image">
            <div className="skeleton-shimmer" />
          </div>
          <div className="product-copy">
            <div className="skeleton-text skeleton-meta" />
            <div className="skeleton-text skeleton-title" />
            <div className="product-bottom">
              <div className="skeleton-text skeleton-price" />
              <div className="skeleton-text skeleton-verified" />
            </div>
          </div>
        </article>
      ))}
    </>
  );
}

export function SkeletonRow({ count = 1 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div className="table-row skeleton-row" key={i}>
          <div className="skeleton-text skeleton-cell" />
          <div className="skeleton-text skeleton-cell" />
          <div className="skeleton-text skeleton-cell" />
          <div className="skeleton-text skeleton-cell" />
          <div className="skeleton-text skeleton-cell" />
          <div className="skeleton-text skeleton-cell" />
        </div>
      ))}
    </>
  );
}

export function SkeletonRecentRow({ count = 1 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div className="recent-row skeleton-row" key={i}>
          <div className="avatar small skeleton-avatar" />
          <div className="skeleton-text skeleton-info" />
          <div className="skeleton-text skeleton-price" />
          <div className="skeleton-text skeleton-status" />
        </div>
      ))}
    </>
  );
}

export function SkeletonStat({ count = 1 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div className="stat-card skeleton-stat" key={i}>
          <div className="skeleton-text skeleton-icon" />
          <div className="skeleton-text skeleton-label" />
          <div className="skeleton-text skeleton-value" />
          <div className="skeleton-text skeleton-note" />
        </div>
      ))}
    </>
  );
}

export function SkeletonText({ lines = 1, width = "100%" }: { lines?: number; width?: string }) {
  return (
    <>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          className="skeleton-text"
          key={i}
          style={{ width: i === lines - 1 ? "60%" : width }}
        />
      ))}
    </>
  );
}

export function SkeletonCategory({ count = 1 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <button className="category-card skeleton-category" key={i}>
          <div className="skeleton-text skeleton-cat-label" />
          <div className="skeleton-text skeleton-cat-name" />
        </button>
      ))}
    </>
  );
}

export function SkeletonCartItem({ count = 1 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div className="cart-item skeleton-cart-item" key={i}>
          <div style={{ width: '145px', height: '155px', borderRadius: '4px', background: 'linear-gradient(90deg, var(--line) 25%, var(--cream) 50%, var(--line) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
          <div>
            <div className="skeleton-text" style={{ height: '10px', width: '60%', marginBottom: '8px' }} />
            <div className="skeleton-text" style={{ height: '20px', width: '80%', marginBottom: '12px' }} />
            <div className="skeleton-text" style={{ height: '30px', width: '40%', marginBottom: '12px' }} />
            <div className="skeleton-text" style={{ height: '12px', width: '30%' }} />
          </div>
          <div className="skeleton-text" style={{ height: '18px', width: '60px' }} />
        </div>
      ))}
    </>
  );
}
