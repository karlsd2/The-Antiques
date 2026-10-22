import { useEffect, useState } from 'react';
import { Icon } from '../components/Icon';
import { Badge } from '../components/Badge';
import { money } from '../lib/utils';
import { supabase } from '../lib/supabase';
import type { Page, Product, Profile } from '../types';

export function ProductDetails({ product, favorite, toggleFavorite, addToCart, navigate }: { product: Product; favorite: boolean; toggleFavorite: () => void; addToCart: () => void; navigate: (page: Page, product?: Product, sellerId?: string) => void }) {
  const [sellerProfile, setSellerProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (product.seller_id) {
      fetchSellerProfile(product.seller_id);
    }
  }, [product.seller_id]);

  async function fetchSellerProfile(sellerId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sellerId)
        .single();

      if (error) throw error;
      setSellerProfile(data);
    } catch (err) {
      console.error('Error fetching seller profile:', err);
    }
  }

  const displayName = sellerProfile?.store_name || sellerProfile?.full_name || product.seller_name || 'Seller';
  const location = sellerProfile?.location || null;

  return (
    <main className="inner-page product-detail">
      <button className="back-link" onClick={() => navigate("shop")}>← Back to collection</button>
      <div className="detail-grid">
        <div className="detail-gallery">
          <div className="main-image">
            <img src={product.images?.[0] || ''} alt={product.name} />
            <span className="image-counter">1 / {product.images?.length || 1}</span>
          </div>
          <div className="thumbnails">
            {(product.images?.slice(1, 4) || []).map((img, idx) => (
              <button key={idx}><img src={img} alt="" /></button>
            ))}
          </div>
        </div>
        <div className="detail-copy">
          <div className="detail-topline">
            <span>{product.category_name || 'Uncategorized'} · {product.year || 'Unknown'}</span>
            <button onClick={toggleFavorite}><Icon name="heart" filled={favorite} /> {favorite ? "Saved" : "Save"}</button>
          </div>
          <h1>{product.name}</h1>
          <div className="detail-price">{money(product.price)}</div>
          <div className="badge-row">
            <Badge>{product.verified}</Badge>
            <Badge>{product.condition} condition</Badge>
          </div>
          <p className="description">{product.description}</p>
          <div className="condition-panel">
            <div><span>Condition</span><strong>{product.condition}</strong></div>
            <div className="condition-scale">
              <i /><i /><i /><i className={product.condition === "Mint" ? "on" : ""} />
            </div>
            <p>Carefully inspected. Light signs of age are visible and consistent with the piece's history.</p>
          </div>
          <dl className="product-specs">
            <div><dt>Era / year</dt><dd>{product.year || 'Unknown'}</dd></div>
            <div><dt>Category</dt><dd>{product.category_name || 'Uncategorized'}</dd></div>
            <div><dt>Ships from</dt><dd>{location || 'Philippines'}</dd></div>
            <div><dt>Availability</dt><dd>Only {product.stock} available</dd></div>
          </dl>
          <div className="purchase-actions">
            <button className="button primary" onClick={addToCart}>Add to cart <Icon name="bag" /></button>
            <button className="button outline" onClick={() => { addToCart(); navigate("checkout"); }}>Buy it now</button>
          </div>
          <div className="seller-card">
            <div className="avatar">{displayName[0].toUpperCase()}</div>
            <div>
              <small>Sold by</small>
              <strong>{displayName}</strong>
              {location && <span><Icon name="location" size={14} /> {location}</span>}
            </div>
            <button onClick={() => navigate("seller-shop", undefined, product.seller_id)}>View shop</button>
          </div>
        </div>
      </div>
      <section className="detail-story">
        <span className="eyebrow">Why it's special</span>
        <h2>A piece made to last.</h2>
        <p>Selected for its enduring design, honest materials and exceptional preservation. This is the kind of object that becomes more personal with every passing year.</p>
      </section>
    </main>
  );
}
