import { useEffect, useState } from 'react';
import { Icon } from '../components/Icon';
import { ProductCard } from '../components/ProductCard';
import { SkeletonCard } from '../components/Skeleton';
import { supabase } from '../lib/supabase';
import type { Page, Product, Profile } from '../types';

export function SellerShop({ navigate, sellerId, favorites, toggleFavorite }: { navigate: (page: Page) => void; sellerId: string; favorites: string[]; toggleFavorite: (id: string) => void }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [sellerProfile, setSellerProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchSellerData();
  }, [sellerId]);

  async function fetchSellerData() {
    try {
      setLoading(true);
      setError(null);

      // Fetch seller profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sellerId)
        .single();

      if (profileError) throw profileError;
      setSellerProfile(profile);

      // Fetch seller's active products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          categories (name)
        `)
        .eq('seller_id', sellerId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;

      const transformedProducts: Product[] = (productsData || []).map((item: any) => ({
        id: item.id,
        seller_id: item.seller_id,
        name: item.name,
        price: item.price,
        category_id: item.category_id,
        category_name: item.categories?.name,
        condition: item.condition,
        year: item.year,
        verified: item.verified,
        stock: item.stock,
        description: item.description,
        images: item.images || [],
        status: item.status,
        seller_name: profile?.full_name,
        created_at: item.created_at,
        updated_at: item.updated_at,
      }));

      setProducts(transformedProducts);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching seller data:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="inner-page">
        <div className="page-intro">
          <span className="eyebrow">Seller shop</span>
          <h1>Loading shop...</h1>
        </div>
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
          <span className="eyebrow">Seller shop</span>
          <h1>Error loading shop</h1>
          <p>{error.message}</p>
        </div>
      </main>
    );
  }

  if (!sellerProfile) {
    return (
      <main className="inner-page">
        <div className="page-intro">
          <span className="eyebrow">Seller shop</span>
          <h1>Seller not found</h1>
          <button className="button primary" onClick={() => navigate("shop")}>Back to collection</button>
        </div>
      </main>
    );
  }

  const displayName = sellerProfile.store_name || sellerProfile.full_name || 'Seller';

  return (
    <main className="inner-page">
      <button className="back-link" onClick={() => navigate("shop")}>← Back to collection</button>
      <div className="profile-hero">
        <div className="large-avatar">{displayName[0].toUpperCase()}</div>
        <div>
          <span className="eyebrow">Seller shop</span>
          <h1>{displayName}</h1>
          {sellerProfile.store_description && <p>{sellerProfile.store_description}</p>}
          {sellerProfile.location && <p style={{ marginTop: '8px', color: 'var(--ink-soft)' }}><Icon name="location" size={14} /> {sellerProfile.location}</p>}
        </div>
      </div>
      <div className="page-intro compact">
        <h2>{products.length} {products.length === 1 ? 'piece' : 'pieces'} available</h2>
      </div>
      {products.length === 0 ? (
        <div className="empty-state">
          <Icon name="bag" size={36} />
          <h2>No products available</h2>
          <p>This seller hasn't listed any items yet.</p>
        </div>
      ) : (
        <div className="product-grid four">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onOpen={() => navigate("product")}
              favorite={favorites.includes(product.id)}
              onFavorite={() => toggleFavorite(product.id)}
            />
          ))}
        </div>
      )}
    </main>
  );
}
