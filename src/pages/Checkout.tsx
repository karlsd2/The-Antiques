import { useState } from 'react';
import { Icon } from '../components/Icon';
import { money } from '../lib/utils';
import type { Page, Product } from '../types';
import type { CartItem } from '../hooks/useCart';

export function Checkout({ items, cartItems, navigate, onSubmitOrder, isProcessing }: { items: Product[]; cartItems: CartItem[]; navigate: (page: Page) => void; onSubmitOrder: (formData: FormData) => Promise<void>; isProcessing: boolean }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Calculate quantities from cartItems
  const itemsWithQuantities = items.map(item => {
    const cartItem = cartItems.find(ci => ci.product_id === item.id);
    return {
      ...item,
      quantity: cartItem?.quantity || 1
    };
  });

  const subtotal = itemsWithQuantities.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  // Shipping fee: configurable flat rate for Philippine orders (PHP)
  // TODO: Integrate with actual courier API for real-time rates
  const shippingCost = subtotal >= 5000 ? 0 : 150;
  const total = subtotal + shippingCost;

  const validateMobileNumber = (mobile: string): boolean => {
    const cleaned = mobile.replace(/\s/g, '');
    // Accept formats: 09XXXXXXXXX (11 digits) or +639XXXXXXXXX (13 digits)
    return /^09\d{9}$/.test(cleaned) || /^\+639\d{9}$/.test(cleaned);
  };

  const validatePostalCode = (postal: string): boolean => {
    const cleaned = postal.trim();
    // Philippine postal codes are 4 digits
    return /^\d{4}$/.test(cleaned);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFieldErrors({});

    try {
      const formData = new FormData(e.currentTarget);

      // Validate product data before proceeding
      for (const item of itemsWithQuantities) {
        if (!item.name || item.price <= 0) {
          throw new Error(`"${item.name || 'Unknown product'}" has invalid data. Please remove it from your cart.`);
        }
        if (item.stock < item.quantity) {
          throw new Error(`Only ${item.stock} of "${item.name}" available. You requested ${item.quantity}.`);
        }
        if (item.status !== 'active') {
          throw new Error(`"${item.name}" is no longer available`);
        }
      }

      // Trim all values
      const email = (formData.get('email') as string)?.trim();
      const firstName = (formData.get('firstName') as string)?.trim();
      const lastName = (formData.get('lastName') as string)?.trim();
      const mobileNumber = (formData.get('mobileNumber') as string)?.trim();
      const streetAddress = (formData.get('streetAddress') as string)?.trim();
      const barangay = (formData.get('barangay') as string)?.trim();
      const cityMunicipality = (formData.get('cityMunicipality') as string)?.trim();
      const province = (formData.get('province') as string)?.trim();
      const region = (formData.get('region') as string)?.trim();
      const postalCode = (formData.get('postalCode') as string)?.trim();

      const errors: Record<string, string> = {};

      // Validate required fields
      if (!email) errors.email = 'Email address is required';
      if (!firstName) errors.firstName = 'First name is required';
      if (!lastName) errors.lastName = 'Last name is required';
      if (!mobileNumber) {
        errors.mobileNumber = 'Mobile number is required';
      } else if (!validateMobileNumber(mobileNumber)) {
        errors.mobileNumber = 'Please enter a valid Philippine mobile number (e.g., 09123456789 or +639123456789)';
      }
      if (!streetAddress) errors.streetAddress = 'Street address is required';
      if (!barangay) errors.barangay = 'Barangay is required';
      if (!cityMunicipality) errors.cityMunicipality = 'City/Municipality is required';
      if (!province) errors.province = 'Province is required';
      if (!region) errors.region = 'Region is required';
      if (!postalCode) {
        errors.postalCode = 'Postal code is required';
      } else if (!validatePostalCode(postalCode)) {
        errors.postalCode = 'Please enter a valid 4-digit Philippine postal code';
      }

      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        throw new Error('Please fix the errors above');
      }

      // Update formData with trimmed values
      formData.set('email', email);
      formData.set('firstName', firstName);
      formData.set('lastName', lastName);
      formData.set('mobileNumber', mobileNumber);
      formData.set('streetAddress', streetAddress);
      formData.set('barangay', barangay);
      formData.set('cityMunicipality', cityMunicipality);
      formData.set('province', province);
      formData.set('region', region);
      formData.set('postalCode', postalCode);

      // Call the order creation handler passed from App.tsx
      await onSubmitOrder(formData);
    } catch (err: any) {
      setError(err.message || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="checkout-page">
      <div className="checkout-form">
        <button className="back-link" onClick={() => navigate("cart")}>← Return to cart</button>
        <span className="eyebrow">Secure checkout</span>
        <h1>Where should we<br /><em>send your find?</em></h1>
        {error && <div style={{ color: '#dc2626', marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#fef2f2', borderRadius: '4px' }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <h3>Contact</h3>
          <div className="form-grid">
            <label className="wide">
              Email address
              <input name="email" required type="email" placeholder="you@example.com" />
              {fieldErrors.email && <span style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>{fieldErrors.email}</span>}
            </label>
            <label>
              Mobile number
              <input name="mobileNumber" required type="tel" placeholder="09123456789" />
              {fieldErrors.mobileNumber && <span style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>{fieldErrors.mobileNumber}</span>}
            </label>
          </div>
          <h3>Shipping address</h3>
          <div className="form-grid">
            <label>
              First name
              <input name="firstName" required placeholder="Juan" />
              {fieldErrors.firstName && <span style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>{fieldErrors.firstName}</span>}
            </label>
            <label>
              Last name
              <input name="lastName" required placeholder="Dela Cruz" />
              {fieldErrors.lastName && <span style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>{fieldErrors.lastName}</span>}
            </label>
            <label className="wide">
              House Number / Street / Building
              <input name="streetAddress" required placeholder="123 Main Street, Building A, Unit 5B" />
              {fieldErrors.streetAddress && <span style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>{fieldErrors.streetAddress}</span>}
            </label>
            <label>
              Barangay
              <input name="barangay" required placeholder="Barangay name" />
              {fieldErrors.barangay && <span style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>{fieldErrors.barangay}</span>}
            </label>
            <label>
              City / Municipality
              <input name="cityMunicipality" required placeholder="City or municipality" />
              {fieldErrors.cityMunicipality && <span style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>{fieldErrors.cityMunicipality}</span>}
            </label>
            <label>
              Province
              <input name="province" required placeholder="Province" />
              {fieldErrors.province && <span style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>{fieldErrors.province}</span>}
            </label>
            <label>
              Region
              <input name="region" required placeholder="Region (e.g., NCR, CALABARZON)" />
              {fieldErrors.region && <span style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>{fieldErrors.region}</span>}
            </label>
            <label>
              Postal Code
              <input name="postalCode" required type="text" placeholder="1000" maxLength={4} />
              {fieldErrors.postalCode && <span style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>{fieldErrors.postalCode}</span>}
            </label>
          </div>
          <h3>Payment</h3>
          <div className="payment-info" style={{ padding: '1rem', backgroundColor: '#f3f4f6', borderRadius: '4px', marginBottom: '1rem' }}>
            <p style={{ margin: '0', fontSize: '0.9rem', color: '#666' }}>
              <Icon name="info" /> <strong>Demo Mode:</strong> No payment gateway is connected yet. Your order will be created as unpaid for demonstration purposes.
            </p>
          </div>
          <button className="button primary wide-button" type="submit" disabled={loading || isProcessing}>{loading || isProcessing ? 'Processing...' : `Place order · ${money(total)}`} <Icon name="arrow" /></button>
        </form>
      </div>
      <aside className="checkout-summary">
        <h2>Your order</h2>
        {itemsWithQuantities.map((item) => (
          <div className="checkout-item" key={item.id}>
            <img src={item.images?.[0] || ''} alt="" />
            <div>
              <strong>{item.name}</strong>
              <span>{item.condition} · Qty {item.quantity}</span>
            </div>
            <b>{money(item.price * item.quantity)}</b>
          </div>
        ))}
        <hr />
        <div><span>Subtotal</span><strong>{money(subtotal)}</strong></div>
        <div><span>Shipping</span><strong>{shippingCost === 0 ? "Complimentary" : money(shippingCost)}</strong></div>
        <div className="total"><span>Total</span><strong>{money(total)}</strong></div>
        <p><Icon name="shield" /> Every order is protected by our authenticity and condition guarantee.</p>
      </aside>
    </main>
  );
}
