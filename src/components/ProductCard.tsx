import { Icon } from './Icon';
import type { Product } from '../types';
import { money } from '../lib/utils';

export function ProductCard({
  product,
  onOpen,
  favorite,
  onFavorite,
}: {
  product: Product;
  onOpen: () => void;
  favorite: boolean;
  onFavorite: () => void;
}) {
  return (
    <article className="product-card">
      <div className="product-image" onClick={onOpen}>
        <img src={product.images?.[0] || ''} alt={product.name} />
        <button
          className={`favorite-button ${favorite ? "active" : ""}`}
          onClick={(event) => {
            event.stopPropagation();
            onFavorite();
          }}
          aria-label={favorite ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Icon name="heart" size={18} filled={favorite} />
        </button>
        <span className="condition-chip">{product.condition}</span>
      </div>
      <button className="product-copy" onClick={onOpen}>
        <div className="product-meta">{product.category_name || 'Uncategorized'} · {product.year || 'Unknown'}</div>
        <h3>{product.name}</h3>
        <div className="product-bottom">
          <strong>{money(product.price)}</strong>
          <span className="mini-verified"><Icon name="check" size={12} /> Verified</span>
        </div>
      </button>
    </article>
  );
}
