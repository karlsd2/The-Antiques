import { Icon } from '../components/Icon';
import { SectionTitle } from '../components/SectionTitle';
import { ProductCard } from '../components/ProductCard';
import { SkeletonCard, SkeletonCategory } from '../components/Skeleton';
import type { Page, Product, Category } from '../types';

export function Home({ navigate, favorites, toggleFavorite, products, categories, loading, error }: { navigate: (page: Page, product?: Product) => void; favorites: string[]; toggleFavorite: (id: string) => void; products: Product[]; categories: Category[]; loading: boolean; error: Error | null }) {
  if (loading) {
    return (
      <>
        <section className="page-section">
          <SectionTitle eyebrow="Freshly found" title="New arrivals" />
          <div className="product-grid four">
            <SkeletonCard count={4} />
          </div>
        </section>
        <section className="category-section">
          <SectionTitle eyebrow="Browse the archive" title="Shop by collection" />
          <div className="category-grid">
            <SkeletonCategory count={8} />
          </div>
        </section>
      </>
    );
  }

  if (error) {
    return (
      <>
        <section className="page-section">
          <SectionTitle eyebrow="Freshly found" title="New arrivals" />
          <p>Error loading products: {error.message}</p>
        </section>
      </>
    );
  }

  return (
    <>
      <section className="page-section">
        <SectionTitle eyebrow="Freshly found" title="New arrivals" action="View all pieces" onAction={() => navigate("shop")} />
        <div className="product-grid four">
          {products.slice(0, 4).map((product) => (
            <ProductCard key={product.id} product={product} onOpen={() => navigate("product", product)} favorite={favorites.includes(product.id)} onFavorite={() => toggleFavorite(product.id)} />
          ))}
        </div>
      </section>

      <section className="category-section">
        <SectionTitle eyebrow="Browse the archive" title="Shop by collection" />
        <div className="category-grid">
          {categories.map((cat, index) => (
            <button key={cat.id} className={`category-card c${index % 8}`} onClick={() => navigate("shop")}>
              <span>Browse</span><strong>{cat.name}</strong><Icon name="arrow" />
            </button>
          ))}
        </div>
      </section>
    </>
  );
}
