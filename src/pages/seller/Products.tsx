import { useState } from 'react';
import { Icon } from '../../components/Icon';
import { Badge } from '../../components/Badge';
import { money } from '../../lib/utils';
import type { Page, Product, Category } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useProducts, useCategories, deleteProduct, createProduct, updateProduct } from '../../hooks/useProducts';

export function Products({ navigate, onProductCreated }: { navigate: (page: Page) => void; onProductCreated?: () => void }) {
  const { user, profile } = useAuth();
  const { products, loading, error, refetch } = useProducts({ sellerId: user?.id });
  const { categories } = useCategories();
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState<Product | null>(null);
  const [removed, setRemoved] = useState<string[]>([]);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleDelete = async (productId: string) => {
    try {
      await deleteProduct(productId);
      setRemoved([...removed, productId]);
      refetch();
    } catch (err) {
      console.error('Error deleting product:', err);
      alert('Failed to delete product. Please try again.');
    }
  };

  const handleEdit = (product: Product) => {
    setShowEdit(product);
  };

  const handleUpdateProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    if (!showEdit) {
      setFormLoading(false);
      return;
    }

    const formData = new FormData(e.currentTarget);
    const productName = formData.get('productName') as string;
    const categoryId = formData.get('categoryId') as string;
    const price = parseFloat(formData.get('price') as string);
    const condition = formData.get('condition') as 'Mint' | 'Excellent' | 'Good' | 'Fair';
    const year = formData.get('year') as string;
    const stock = parseInt(formData.get('stock') as string);
    const description = formData.get('description') as string;
    const verified = formData.get('verified') as string;
    const status = formData.get('status') as 'active' | 'draft' | 'sold';

    // Basic validation
    if (!productName || !price || !description) {
      setFormError('Please fill in all required fields');
      setFormLoading(false);
      return;
    }

    try {
      await updateProduct(showEdit.id, {
        name: productName,
        price,
        category_id: categoryId || null,
        condition,
        year: year || null,
        verified: verified || 'Pending',
        stock: stock || 1,
        description,
        status: status || 'active',
      });
      setShowEdit(null);
      refetch();
    } catch (err: any) {
      console.error('Error updating product:', err);
      setFormError(err.message || 'Failed to update product. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    if (!user) {
      setFormError('You must be logged in to add a product');
      setFormLoading(false);
      return;
    }

    const formData = new FormData(e.currentTarget);
    const productName = formData.get('productName') as string;
    const categoryId = formData.get('categoryId') as string;
    const price = parseFloat(formData.get('price') as string);
    const condition = formData.get('condition') as 'Mint' | 'Excellent' | 'Good' | 'Fair';
    const year = formData.get('year') as string;
    const stock = parseInt(formData.get('stock') as string);
    const description = formData.get('description') as string;
    const verified = formData.get('verified') as string;

    // Basic validation
    if (!productName || !price || !description) {
      setFormError('Please fill in all required fields');
      setFormLoading(false);
      return;
    }

    try {
      await createProduct({
        seller_id: user.id,
        name: productName,
        price,
        category_id: categoryId || null,
        condition,
        year: year || null,
        verified: verified || 'Pending',
        stock: stock || 1,
        description,
        images: [], // For now, empty array - image upload would need separate implementation
        status: 'active',
      });
      setShowAdd(false);
      refetch();
      if (onProductCreated) {
        onProductCreated();
      }
    } catch (err: any) {
      console.error('Error creating product:', err);
      setFormError(err.message || 'Failed to create product. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  if (!user || profile?.role !== 'seller') {
    return <main className="inner-page"><div className="page-intro"><span className="eyebrow">Access denied</span><h1>Seller access required</h1></div></main>;
  }

  return (
    <main className="inner-page">
      <div className="dashboard-title">
        <div>
          <span className="eyebrow">Inventory</span>
          <h1>Your products</h1>
          <p>Manage active, draft and sold pieces in your collection.</p>
        </div>
        <button className="button primary" onClick={() => setShowAdd(true)}><Icon name="plus" /> Add a product</button>
      </div>
      <div className="table-card">
        <div className="table-tools">
          <div className="tab-buttons">
            <button className="active">Active {products.filter(p => p.status === 'active').length}</button>
            <button>Drafts {products.filter(p => p.status === 'draft').length}</button>
            <button>Sold {products.filter(p => p.status === 'sold').length}</button>
          </div>
          <label className="search-field"><Icon name="search" size={17} /><input placeholder="Search inventory" /></label>
        </div>
        <div className="inventory-list">
          {loading ? (
            <p>Loading...</p>
          ) : error ? (
            <p>Error: {error.message}</p>
          ) : products.filter((p) => !removed.includes(p.id)).map((product) => (
            <div className="inventory-row" key={product.id}>
              <img src={product.images?.[0] || ''} alt="" />
              <div className="inventory-name">
                <strong>{product.name}</strong>
                <span>{product.category_name || 'Uncategorized'} · {product.year || 'Unknown'}</span>
              </div>
              <strong>{money(product.price)}</strong>
              <span>{product.condition}</span>
              <span><Badge>{product.verified}</Badge></span>
              <span>{product.stock} in stock</span>
              <div className="row-actions">
                <button aria-label="View" onClick={() => navigate("shop")}><Icon name="search" size={16} /></button>
                <button aria-label="Edit" onClick={() => handleEdit(product)}><Icon name="edit" size={16} /></button>
                <button aria-label="Delete" onClick={() => handleDelete(product.id)}><Icon name="trash" size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
      {showAdd && (
        <div className="modal-backdrop" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowAdd(false)}><Icon name="close" /></button>
            <span className="eyebrow">New listing</span>
            <h2>Add a vintage piece</h2>
            {formError && <div style={{ color: '#dc2626', marginBottom: '1rem' }}>{formError}</div>}
            <form onSubmit={handleCreateProduct}>
              <div className="image-upload">
                <Icon name="plus" />
                <strong>Add product images</strong>
                <span>Up to 8 images, JPG or PNG</span>
              </div>
              <div className="form-grid">
                <label className="wide">Product name<input name="productName" required placeholder="e.g. 1960s ceramic table lamp" /></label>
                <label>Category<select name="categoryId"><option value="">Select category</option>{categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}</select></label>
                <label>Price<input name="price" required type="number" step="0.01" placeholder="0.00" /></label>
                <label>Condition<select name="condition"><option value="Mint">Mint</option><option value="Excellent">Excellent</option><option value="Good">Good</option><option value="Fair">Fair</option></select></label>
                <label>Year / era<input name="year" placeholder="e.g. 1960s" /></label>
                <label>Quantity<input name="stock" type="number" defaultValue="1" min="1" /></label>
                <label className="wide">Description<textarea name="description" required placeholder="Tell buyers what makes this piece special..." /></label>
                <label className="wide">Authenticity information<textarea name="verified" placeholder="Provenance, markings, expert inspection..." /></label>
              </div>
              <div className="modal-actions">
                <button type="button" className="button outline" onClick={() => setShowAdd(false)} disabled={formLoading}>Cancel</button>
                <button className="button primary" type="submit" disabled={formLoading}>{formLoading ? 'Creating...' : 'Publish listing'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showEdit && (
        <div className="modal-backdrop" onClick={() => setShowEdit(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowEdit(null)}><Icon name="close" /></button>
            <span className="eyebrow">Edit listing</span>
            <h2>Edit {showEdit.name}</h2>
            {formError && <div style={{ color: '#dc2626', marginBottom: '1rem' }}>{formError}</div>}
            <form onSubmit={handleUpdateProduct}>
              <div className="image-upload">
                <Icon name="plus" />
                <strong>Edit product images</strong>
                <span>Up to 8 images, JPG or PNG</span>
              </div>
              <div className="form-grid">
                <label className="wide">Product name<input name="productName" required defaultValue={showEdit.name} placeholder="e.g. 1960s ceramic table lamp" /></label>
                <label>Category<select name="categoryId" defaultValue={showEdit.category_id || ''}><option value="">Select category</option>{categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}</select></label>
                <label>Price<input name="price" required type="number" step="0.01" defaultValue={showEdit.price} placeholder="0.00" /></label>
                <label>Condition<select name="condition" defaultValue={showEdit.condition}><option value="Mint">Mint</option><option value="Excellent">Excellent</option><option value="Good">Good</option><option value="Fair">Fair</option></select></label>
                <label>Year / era<input name="year" defaultValue={showEdit.year || ''} placeholder="e.g. 1960s" /></label>
                <label>Quantity<input name="stock" type="number" defaultValue={showEdit.stock} min="0" /></label>
                <label className="wide">Description<textarea name="description" required defaultValue={showEdit.description || ''} placeholder="Tell buyers what makes this piece special..." /></label>
                <label className="wide">Authenticity information<textarea name="verified" defaultValue={showEdit.verified || ''} placeholder="Provenance, markings, expert inspection..." /></label>
                <label>Status<select name="status" defaultValue={showEdit.status}><option value="active">Active</option><option value="draft">Draft</option><option value="sold">Sold</option></select></label>
              </div>
              <div className="modal-actions">
                <button type="button" className="button outline" onClick={() => setShowEdit(null)} disabled={formLoading}>Cancel</button>
                <button className="button primary" type="submit" disabled={formLoading}>{formLoading ? 'Updating...' : 'Save changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
