import { Icon } from '../components/Icon';
import { SectionTitle } from '../components/SectionTitle';
import { ProductCard } from '../components/ProductCard';
import { SkeletonCard } from '../components/Skeleton';
import type { Page, Product } from '../types';

export function Home({ navigate, favorites, toggleFavorite, products, loading, error }: { navigate: (page: Page, product?: Product, sellerId?: string) => void; favorites: string[]; toggleFavorite: (id: string) => void; products: Product[]; loading: boolean; error: Error | null }) {
  if (loading) {
    return (
      <section className="page-section">
        <SectionTitle eyebrow="Freshly found" title="New arrivals" />
        <div className="product-grid four">
          <SkeletonCard count={4} />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="page-section">
        <SectionTitle eyebrow="Freshly found" title="New arrivals" />
        <p>Error loading products: {error.message}</p>
      </section>
    );
  }

  return (
    <section className="page-section">
      <SectionTitle eyebrow="Freshly found" title="New arrivals" action="View all pieces" onAction={() => navigate("shop")} />
      <div className="product-grid four">
        {products.slice(0, 4).map((product) => (
          <ProductCard key={product.id} product={product} onOpen={() => navigate("product", product)} favorite={favorites.includes(product.id)} onFavorite={() => toggleFavorite(product.id)} />
        ))}
      </div>
    </section>
  );
}
