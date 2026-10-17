import { ProductCard } from '../components/ProductCard';
import { Icon } from '../components/Icon';
import { SkeletonCard } from '../components/Skeleton';
import type { Page, Product } from '../types';

export function Wishlist({ navigate, favorites, toggleFavorite, products, loading, error }: { navigate: (page: Page, product?: Product) => void; favorites: string[]; toggleFavorite: (id: string) => void; products: Product[]; loading: boolean; error: Error | null }) {
  const wishlistProducts = products.filter((p) => favorites.includes(p.id));

  if (loading) {
    return (
      <main className="inner-page">
        <div className="page-intro compact">
          <span className="eyebrow">Saved for later</span>
          <h1>Your wishlist</h1>
          <p>Loading your saved pieces...</p>
        </div>
        <div className="product-grid four">
          <SkeletonCard count={4} />
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="inner-page">
        <div className="page-intro compact">
          <span className="eyebrow">Saved for later</span>
          <h1>Your wishlist</h1>
          <p>Error loading wishlist: {error.message}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="inner-page">
      <div className="page-intro compact">
        <span className="eyebrow">Saved for later</span>
        <h1>Your wishlist</h1>
        <p>{wishlistProducts.length} {wishlistProducts.length === 1 ? "piece" : "pieces"} saved for later.</p>
      </div>
      {wishlistProducts.length === 0 ? (
        <div className="empty-state">
          <Icon name="heart" size={36} />
          <h2>Your wishlist is empty</h2>
          <p>Save pieces you love by clicking the heart icon on any product.</p>
          <button className="button primary" onClick={() => navigate("shop")}>Explore the collection</button>
        </div>
      ) : (
        <div className="product-grid four">
          {wishlistProducts.map((p) => (
            <ProductCard key={p.id} product={p} onOpen={() => navigate("product", p)} favorite onFavorite={() => toggleFavorite(p.id)} />
          ))}
        </div>
      )}
    </main>
  );
}
