import { useState } from 'react';
import { Icon } from '../components/Icon';
import type { Page } from '../types';
import type { Profile } from '../hooks/useAuth';

export function Profile({ seller = false, navigate, onLogout, profile, updateProfile, user }: { seller?: boolean; navigate: (page: Page) => void; onLogout: () => void; profile: Profile | null; updateProfile: (updates: Partial<Profile>) => Promise<Profile>; user: any }) {
  const [showEdit, setShowEdit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Generate initials from name or store name
  const getInitials = (name: string | null, storeName: string | null) => {
    const source = seller ? storeName : name;
    if (!source) return seller ? 'S' : 'U';
    const parts = source.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  // Format date to readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    const updates: Partial<Profile> = {};

    if (seller) {
      updates.store_name = formData.get('store_name') as string || null;
      updates.store_description = formData.get('store_description') as string || null;
    } else {
      updates.full_name = formData.get('full_name') as string || null;
    }
    updates.phone = formData.get('phone') as string || null;
    updates.location = formData.get('location') as string || null;

    try {
      await updateProfile(updates);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      setShowEdit(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!profile) {
    return (
      <main className="inner-page profile-page">
        <div className="page-intro">
          <span className="eyebrow">Profile</span>
          <h1>Loading profile...</h1>
        </div>
      </main>
    );
  }

  const initials = getInitials(profile.full_name, profile.store_name);
  const displayName = seller ? profile.store_name || profile.full_name : profile.full_name;
  const displayDescription = seller ? profile.store_description : 'Collector of vintage and antique pieces';
  const memberSince = formatDate(profile.created_at);

  return (
    <main className="inner-page profile-page">
      <div className="profile-hero">
        <div className="large-avatar">{initials}</div>
        <div>
          <span className="eyebrow">Member since {memberSince}</span>
          <h1>{displayName || 'User'}</h1>
          <p>{displayDescription || 'No description provided'}</p>
        </div>
        <div className="profile-actions">
          <button className="button outline" onClick={() => setShowEdit(true)}><Icon name="edit" size={17} /> Edit profile</button>
          <button className="button outline" onClick={onLogout}><Icon name="close" size={17} /> Sign out</button>
        </div>
      </div>
      <div className="profile-grid">
        <div className="profile-panel">
          <h2>{seller ? "Store information" : "Profile information"}</h2>
          <dl>
            <div><dt>Email</dt><dd>{profile.email || user?.email || 'Not provided'}</dd></div>
            <div><dt>Phone</dt><dd>{profile.phone || 'Not provided'}</dd></div>
            <div><dt>Location</dt><dd>{profile.location || 'Not provided'}</dd></div>
          </dl>
          <button className="text-link" onClick={() => setShowEdit(true)}>Update information <Icon name="arrow" /></button>
        </div>
        <div className="profile-panel">
          <h2>{seller ? "Store performance" : "Account details"}</h2>
          {seller ? (
            <div className="mini-stats">
              <div><strong>--</strong><span>Listed</span></div>
              <div><strong>--</strong><span>Sold</span></div>
              <div><strong>--</strong><span>Rating</span></div>
            </div>
          ) : (
            <p><strong>Role</strong><br />{profile.role || 'Buyer'}</p>
          )}
        </div>
      </div>
      <div className="quick-links">
        {(seller ? [["Listed products", "products"], ["Sold products", "sales"], ["Seller orders", "seller-orders"]] : [["Order history", "orders"], ["Your wishlist", "wishlist"], ["Account settings", "profile"]]).map(([label, destination]) => (
          <button key={label} onClick={() => navigate(destination as Page)}>{label}<Icon name="arrow" /></button>
        ))}
      </div>

      {showEdit && (
        <div className="modal-backdrop" onClick={() => setShowEdit(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowEdit(false)}><Icon name="close" /></button>
            <span className="eyebrow">Edit profile</span>
            <h2>{seller ? "Update store information" : "Update your profile"}</h2>
            {success && <div style={{ color: 'green', marginBottom: '1rem' }}>Profile updated successfully!</div>}
            {error && <div style={{ color: '#dc2626', marginBottom: '1rem' }}>{error}</div>}
            <form onSubmit={handleUpdate}>
              <div className="form-grid">
                {seller ? (
                  <>
                    <label className="wide">Store name<input name="store_name" defaultValue={profile.store_name || ''} placeholder="Your store name" /></label>
                    <label className="wide">Store description<textarea name="store_description" defaultValue={profile.store_description || ''} placeholder="Describe your store..." rows={3} /></label>
                  </>
                ) : (
                  <label className="wide">Full name<input name="full_name" defaultValue={profile.full_name || ''} placeholder="Your full name" /></label>
                )}
                <label>Phone<input name="phone" defaultValue={profile.phone || ''} placeholder="+1 555 123 4567" /></label>
                <label>Location<input name="location" defaultValue={profile.location || ''} placeholder="City, State" /></label>
              </div>
              <div className="modal-actions">
                <button type="button" className="button outline" onClick={() => setShowEdit(false)}>Cancel</button>
                <button className="button primary" type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
