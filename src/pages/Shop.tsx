import { useMemo, useState } from 'react';
import { Icon } from '../components/Icon';
import { ProductCard } from '../components/ProductCard';
import { SkeletonCard } from '../components/Skeleton';
import type { Page, Product, Category } from '../types';

export function Shop({ navigate, favorites, toggleFavorite, products, categories, loading, error }: { navigate: (page: Page, product?: Product) => void; favorites: string[]; toggleFavorite: (id: string) => void; products: Product[]; categories: Category[]; loading: boolean; error: Error | null }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All categories");
  const [condition, setCondition] = useState("All conditions");
  const [sort, setSort] = useState("Newest");
  const filtered = useMemo(() => {
    let items = products.filter((product) =>
      product.name.toLowerCase().includes(search.toLowerCase()) &&
      (category === "All categories" || product.category_name === category) &&
      (condition === "All conditions" || product.condition === condition)
    );
    if (sort === "Price: low to high") items = [...items].sort((a, b) => a.price - b.price);
    if (sort === "Price: high to low") items = [...items].sort((a, b) => b.price - a.price);
    return items;
  }, [search, category, condition, sort, products]);

  if (loading) {
    return (
      <main className="inner-page">
        <div className="page-intro">
          <span className="eyebrow">The collection</span>
          <h1>Pieces with a past,<br /><em>ready for what's next.</em></h1>
          <p>Explore verified vintage and collectible objects from trusted sellers.</p>
        </div>
        <div className="shop-tools">
          <label className="search-field"><Icon name="search" /><input placeholder="Search vintage pieces..." disabled /></label>
          <select disabled><option>All categories</option></select>
          <select disabled><option>All conditions</option></select>
          <select disabled><option>Newest</option></select>
        </div>
        <div className="results-line"><span>Loading exceptional pieces</span><span>Every item ships insured</span></div>
        <div className="product-grid four">
          <SkeletonCard count={8} />
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="inner-page">
        <div className="page-intro">
          <span className="eyebrow">The collection</span>
          <h1>Pieces with a past,<br /><em>ready for what's next.</em></h1>
          <p>Error loading products: {error.message}</p>
        </div>
      </main>
    );
  }
  return (
    <main className="inner-page">
      <div className="page-intro">
        <span className="eyebrow">The collection</span>
        <h1>Pieces with a past,<br /><em>ready for what's next.</em></h1>
        <p>Explore verified vintage and collectible objects from trusted sellers.</p>
      </div>
      <div className="shop-tools">
        <label className="search-field"><Icon name="search" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search vintage pieces..." /></label>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option>All categories</option>{categories.map((cat) => <option key={cat.id}>{cat.name}</option>)}
        </select>
        <select value={condition} onChange={(e) => setCondition(e.target.value)}>
          <option>All conditions</option><option>Mint</option><option>Excellent</option><option>Good</option><option>Fair</option>
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option>Newest</option><option>Price: low to high</option><option>Price: high to low</option><option>Most popular</option>
        </select>
      </div>
      <div className="results-line"><span>{filtered.length} exceptional pieces</span><span>Every item ships insured</span></div>
      <div className="product-grid four">
        {filtered.map((product) => <ProductCard key={product.id} product={product} onOpen={() => navigate("product", product)} favorite={favorites.includes(product.id)} onFavorite={() => toggleFavorite(product.id)} />)}
      </div>
    </main>
  );
}
