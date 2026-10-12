import { ProductCard } from '../components/ProductCard';
import type { Page, Product } from '../types';

export function Wishlist({ navigate, favorites, toggleFavorite, products }: { navigate: (page: Page, product?: Product) => void; favorites: string[]; toggleFavorite: (id: string) => void; products: Product[] }) {
  return (
    <main className="inner-page">
      <div className="page-intro compact">
        <span className="eyebrow">Saved for later</span>
        <h1>Your wishlist</h1>
        <p>Pieces that caught your eye.</p>
      </div>
      <div className="product-grid four">
        {products.filter((p) => favorites.includes(p.id)).map((p) => (
          <ProductCard key={p.id} product={p} onOpen={() => navigate("product", p)} favorite onFavorite={() => toggleFavorite(p.id)} />
        ))}
      </div>
    </main>
  );
}
