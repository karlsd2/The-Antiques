import { useState } from 'react';
import { Icon } from '../../components/Icon';
import { Badge } from '../../components/Badge';
import { money } from '../../lib/utils';
import type { Page, Product, Category } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useCategories, deleteProduct, createProduct, updateProduct } from '../../hooks/useProducts';
import { supabase } from '../../lib/supabase';

export function Products({ navigate, products, loading, error, refetch, onProductCreated }: { navigate: (page: Page) => void; products: Product[]; loading: boolean; error: Error | null; refetch: () => void; onProductCreated?: () => void }) {
  const { user, profile } = useAuth();
  const { categories } = useCategories();
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState<Product | null>(null);
  const [removed, setRemoved] = useState<string[]>([]);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);

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
    setImagePreviews(product.images || []);
    setSelectedImages([]);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + selectedImages.length > 8) {
      alert('Maximum 8 images allowed');
      return;
    }

    setSelectedImages([...selectedImages, ...files]);

    // Create previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (): Promise<string[]> => {
    if (selectedImages.length === 0) return imagePreviews;

    const uploadedUrls: string[] = [];
    setUploadProgress(0);

    for (let i = 0; i < selectedImages.length; i++) {
      const file = selectedImages[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
      const filePath = `products/${user?.id}/${fileName}`;

      // Note: You need to create a Supabase storage bucket named 'product-images' with public access
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) {
        throw new Error(`Failed to upload image: ${uploadError.message}`);
      }

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      uploadedUrls.push(publicUrl);
      setUploadProgress(((i + 1) / selectedImages.length) * 100);
    }

    return [...imagePreviews, ...uploadedUrls];
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
      // Upload new images if any
      const imageUrls = selectedImages.length > 0 ? await uploadImages() : imagePreviews;

      await updateProduct(showEdit.id, {
        name: productName,
        price,
        category_id: categoryId || null,
        condition,
        year: year || null,
        verified: verified || 'Pending',
        stock: stock || 1,
        description,
        images: imageUrls,
        status: status || 'active',
      });
      setShowEdit(null);
      setSelectedImages([]);
      setImagePreviews([]);
      setUploadProgress(0);
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
      // Upload images
      const imageUrls = await uploadImages();

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
        images: imageUrls,
        status: 'active',
      });
      setShowAdd(false);
      setSelectedImages([]);
      setImagePreviews([]);
      setUploadProgress(0);
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
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/jpg"
                  multiple
                  onChange={handleImageSelect}
                  style={{ display: 'none' }}
                  id="product-images"
                />
                <label htmlFor="product-images" style={{ cursor: 'pointer', display: 'block', textAlign: 'center' }}>
                  <Icon name="plus" />
                  <div>
                    <strong>Add images</strong>
                  </div>
                </label>
              </div>
              {imagePreviews.length > 0 && (
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '1rem' }}>
                  {imagePreviews.map((preview, index) => (
                    <div key={index} style={{ position: 'relative', width: '80px', height: '80px' }}>
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }}
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        style={{
                          position: 'absolute',
                          top: '-8px',
                          right: '-8px',
                          background: '#dc2626',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '20px',
                          height: '20px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px'
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ background: '#e5e7eb', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                    <div style={{ background: '#3b82f6', height: '100%', width: `${uploadProgress}%`, transition: 'width 0.3s' }} />
                  </div>
                  <small style={{ color: '#6b7280' }}>Uploading images... {Math.round(uploadProgress)}%</small>
                </div>
              )}
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
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/jpg"
                  multiple
                  onChange={handleImageSelect}
                  style={{ display: 'none' }}
                  id="edit-product-images"
                />
                <label htmlFor="edit-product-images" style={{ cursor: 'pointer', display: 'block', textAlign: 'center' }}>
                  <Icon name="plus" />
                  <div>
                    <strong>Edit images</strong>
                  </div>
                </label>
              </div>
              {imagePreviews.length > 0 && (
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '1rem' }}>
                  {imagePreviews.map((preview, index) => (
                    <div key={index} style={{ position: 'relative', width: '80px', height: '80px' }}>
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }}
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        style={{
                          position: 'absolute',
                          top: '-8px',
                          right: '-8px',
                          background: '#dc2626',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '20px',
                          height: '20px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px'
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ background: '#e5e7eb', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                    <div style={{ background: '#3b82f6', height: '100%', width: `${uploadProgress}%`, transition: 'width 0.3s' }} />
                  </div>
                  <small style={{ color: '#6b7280' }}>Uploading images... {Math.round(uploadProgress)}%</small>
                </div>
              )}
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
