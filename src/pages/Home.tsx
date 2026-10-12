import { Icon } from '../components/Icon';
import { SectionTitle } from '../components/SectionTitle';
import { ProductCard } from '../components/ProductCard';
import type { Page, Product, Category } from '../types';

export function Home({ navigate, favorites, toggleFavorite, products, categories, loading, error }: { navigate: (page: Page, product?: Product) => void; favorites: string[]; toggleFavorite: (id: string) => void; products: Product[]; categories: Category[]; loading: boolean; error: Error | null }) {
  if (loading) {
    return (
      <>
        <section className="hero">
          <div className="hero-content">
            <span className="eyebrow">Objects worth keeping</span>
            <h1>Find something<br /><em>with a story.</em></h1>
            <p>Discover authenticated vintage pieces from trusted independent sellers, each chosen for its craftsmanship, character and history.</p>
            <div className="hero-actions">
              <button className="button primary" onClick={() => navigate("shop")}>Explore the collection <Icon name="arrow" /></button>
            </div>
            <div className="hero-trust" />
          </div>
          <div className="hero-visual">
            <img src="https://images.unsplash.com/photo-1769647097480-84d4d8c1d501?auto=format&fit=crop&w=1200&q=88" alt="Curated vintage objects" />
            <div className="hero-note" />
            <div className="round-stamp">AUTHENTIC • TIMELESS • FOUND •</div>
          </div>
        </section>
        <section className="page-section">
          <SectionTitle eyebrow="Freshly found" title="New arrivals" />
          <p>Loading products...</p>
        </section>
      </>
    );
  }

  if (error) {
    return (
      <>
        <section className="hero">
          <div className="hero-content">
            <span className="eyebrow">Objects worth keeping</span>
            <h1>Find something<br /><em>with a story.</em></h1>
            <p>Discover authenticated vintage pieces from trusted independent sellers, each chosen for its craftsmanship, character and history.</p>
            <div className="hero-actions">
              <button className="button primary" onClick={() => navigate("shop")}>Explore the collection <Icon name="arrow" /></button>
            </div>
            <div className="hero-trust" />
          </div>
          <div className="hero-visual">
            <img src="https://images.unsplash.com/photo-1769647097480-84d4d8c1d501?auto=format&fit=crop&w=1200&q=88" alt="Curated vintage objects" />
            <div className="hero-note" />
            <div className="round-stamp">AUTHENTIC • TIMELESS • FOUND •</div>
          </div>
        </section>
        <section className="page-section">
          <SectionTitle eyebrow="Freshly found" title="New arrivals" />
          <p>Error loading products: {error.message}</p>
        </section>
      </>
    );
  }

  return (
    <>
      <section className="hero">
        <div className="hero-content">
          <span className="eyebrow">Objects worth keeping</span>
          <h1>Find something<br /><em>with a story.</em></h1>
          <p>Discover authenticated vintage pieces from trusted independent sellers, each chosen for its craftsmanship, character and history.</p>
          <div className="hero-actions">
            <button className="button primary" onClick={() => navigate("shop")}>Explore the collection <Icon name="arrow" /></button>
          </div>
          <div className="hero-trust" />
        </div>
        <div className="hero-visual">
          <img src="https://images.unsplash.com/photo-1769647097480-84d4d8c1d501?auto=format&fit=crop&w=1200&q=88" alt="Curated vintage objects" />
          <div className="hero-note" />
          <div className="round-stamp">AUTHENTIC • TIMELESS • FOUND •</div>
        </div>
      </section>

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

      <section className="story-section">
        <div className="story-image"><img src="https://images.unsplash.com/photo-1790242693612-324b129d7f93?auto=format&fit=crop&w=1200&q=85" alt="Vintage typewriter and collected objects" /></div>
        <div className="story-copy">
          <span className="eyebrow">The Antiques standard</span>
          <h2>Old things,<br /><em>honestly told.</em></h2>
          <p>Every verified piece is reviewed for authenticity and condition before it reaches our collection. We believe the marks of time are part of the beauty—so you always know exactly what you are bringing home.</p>
          <div className="trust-list">
            <div><Icon name="shield" /><span><strong>Verified provenance</strong><small>Seller history and item details reviewed</small></span></div>
            <div><Icon name="check" /><span><strong>Condition you can trust</strong><small>Clear grading and honest photography</small></span></div>
            <div><Icon name="truck" /><span><strong>Protected from seller to you</strong><small>Tracked, insured and carefully packed</small></span></div>
          </div>
        </div>
      </section>
    </>
  );
}
