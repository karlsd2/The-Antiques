# Migration Guide: Replace Hardcoded Data with Supabase

This guide explains how to replace the hardcoded data in `src/App.tsx` with Supabase queries using the custom hooks.

## Overview

The following data needs to be migrated:
1. **Products array** → `useProducts` hook
2. **Categories array** → `useCategories` hook
3. **Order data** → `useOrders` hook
4. **Cart state** → `useCart` hook
5. **Wishlist state** → `useWishlist` hook
6. **Authentication** → `useAuth` hook
7. **Seller stats** → Supabase queries

## Step 1: Update Imports

Add these imports at the top of `src/App.tsx`:

```typescript
import { useAuth, type UserRole } from './hooks/useAuth'
import { useProducts, useCategories } from './hooks/useProducts'
import { useWishlist } from './hooks/useWishlist'
import { useCart } from './hooks/useCart'
import { useOrders } from './hooks/useOrders'
```

## Step 2: Remove Hardcoded Data

Delete these lines from `src/App.tsx`:

```typescript
// DELETE THESE LINES
const products: Product[] = [...] // Entire products array
const categories = [...] // Entire categories array
const orderData = [...] // Entire orderData array
const stats = [...] // Stats in Dashboard component
```

## Step 3: Update Type Definitions

Replace the `Product` type with the Supabase version:

```typescript
// BEFORE
type Product = {
  id: number;
  name: string;
  price: number;
  category: string;
  condition: "Mint" | "Excellent" | "Good" | "Fair";
  year: string;
  seller: string;
  verified: string;
  stock: number;
  image: string;
  description: string;
};

// AFTER
type Product = {
  id: string; // Changed from number to string (UUID)
  seller_id: string;
  name: string;
  price: number;
  category_id: string | null;
  category_name?: string;
  condition: "Mint" | "Excellent" | "Good" | "Fair";
  year: string | null;
  verified: string;
  stock: number;
  description: string | null;
  images: string[]; // Changed from single image to array
  status: "active" | "draft" | "sold";
  seller_name?: string;
  created_at: string;
  updated_at: string;
};
```

## Step 4: Update App Component

Replace the main App component state with hooks:

```typescript
// BEFORE
export default function App() {
  const [role, setRole] = useState<Role>("buyer");
  const [page, setPage] = useState<Page>("login");
  const [selectedProduct, setSelectedProduct] = useState(products[0]);
  const [cart, setCart] = useState<Product[]>([]);
  const [favorites, setFavorites] = useState<number[]>([2, 5]);
  // ...
}

// AFTER
export default function App() {
  const { user, profile, loading: authLoading, signUp, signIn, signOut } = useAuth()
  const { products, loading: productsLoading } = useProducts()
  const { categories } = useCategories()
  const { wishlist, toggleWishlist } = useWishlist(user?.id || null)
  const { cart, addToCart, removeFromCart, cartTotal, cartCount } = useCart(user?.id || null)
  const { orders, createOrder } = useOrders(user?.id || null, profile?.role === 'seller')

  const [page, setPage] = useState<Page>("login");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const role = profile?.role || 'buyer'
  // ...
}
```

## Step 5: Update Auth Component

Replace the Auth component to use real authentication:

```typescript
function Auth({ mode, navigate, onLogin }: { mode: "login" | "register" | "forgot"; navigate: (page: Page) => void; onLogin: () => void }) {
  const [selectedRole, setSelectedRole] = useState<UserRole>("buyer");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signUp, signIn } = useAuth()

  const copy = mode === "login" ? ["Welcome back.", "Sign in to continue your collection."] : mode === "register" ? ["Begin your story.", "Join a community that values things made to last."] : ["Find your way back.", "We'll send a secure reset link to your email."];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const fullName = formData.get('fullName') as string

    try {
      if (mode === "login") {
        await signIn(email, password)
      } else if (mode === "register") {
        await signUp(email, password, fullName || '', selectedRole)
      }
      onLogin()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      {/* ... existing JSX ... */}
      <form onSubmit={handleSubmit}>
        {/* ... form fields ... */}
        {error && <div className="error-message">{error}</div>}
        <button type="submit" className="button primary wide-button" disabled={loading}>
          {loading ? 'Processing...' : (mode === "login" ? "Sign in" : mode === "register" ? "Create account" : "Send reset link")} <Icon name="arrow" />
        </button>
      </form>
      {/* ... */}
    </main>
  );
}
```

## Step 6: Update ProductCard Component

Update to handle new Product type:

```typescript
function ProductCard({
  product,
  onOpen,
  favorite,
  onFavorite,
}: {
  product: Product;
  onOpen: () => void;
  favorite: boolean;
  onFavorite: () => void;
}) {
  return (
    <article className="product-card">
      <div className="product-image" onClick={onOpen}>
        {/* Use first image from array */}
        <img src={product.images[0] || '/placeholder.jpg'} alt={product.name} />
        {/* ... rest of component ... */}
      </div>
      <button className="product-copy" onClick={onOpen}>
        <div className="product-meta">{product.category_name || 'Uncategorized'} · {product.year || 'Unknown'}</div>
        <h3>{product.name}</h3>
        <div className="product-bottom">
          <strong>{money(product.price)}</strong>
          <span className="mini-verified"><Icon name="check" size={12} /> {product.verified}</span>
        </div>
      </button>
    </article>
  );
}
```

## Step 7: Update Checkout Component

Replace with real order creation:

```typescript
function Checkout({ cart, navigate, createOrder }: { cart: CartItem[]; navigate: (page: Page) => void; createOrder: any }) {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const formData = new FormData(e.currentTarget)
    const shippingAddress = {
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      street: formData.get('street'),
      city: formData.get('city'),
      state: formData.get('state'),
      zip: formData.get('zip'),
      country: formData.get('country'),
    }

    const total = cartTotal + (cartTotal >= 500 ? 0 : 24)
    const shippingCost = cartTotal >= 500 ? 0 : 24

    const orderItems = cart.map(item => ({
      product_id: item.product_id,
      product_name: item.product?.name || '',
      product_condition: item.product?.condition,
      price: item.product?.price || 0,
      quantity: item.quantity,
    }))

    try {
      await createOrder(user.id, orderItems, shippingAddress, total, shippingCost)
      navigate('confirmation')
    } catch (error) {
      console.error('Error creating order:', error)
    }
  }

  // ... rest of component
}
```

## Step 8: Update Dashboard Component

Replace stats with real data:

```typescript
function Dashboard({ navigate, userId }: { navigate: (page: Page) => void; userId: string }) {
  const { products } = useProducts({ sellerId: userId, status: 'active' })
  const { orders } = useOrders(userId, true)

  const totalProducts = products.length
  const activeListings = products.filter(p => p.status === 'active').length
  const soldItems = products.filter(p => p.status === 'sold').length
  const totalSales = orders.reduce((sum, order) => sum + order.total, 0)

  const stats = [
    ["Total products", totalProducts.toString(), "+0 this month", "box"],
    ["Active listings", activeListings.toString(), `${Math.round((activeListings / totalProducts) * 100)}% of inventory`, "bag"],
    ["Items sold", soldItems.toString(), "+0 this month", "check"],
    ["Total sales", `$${(totalSales / 1000).toFixed(1)}k`, "+0% this month", "chart"],
  ]

  // ... rest of component
}
```

## Step 9: Update Shop Component

Add filtering logic:

```typescript
function Shop({ navigate, toggleWishlist }: { navigate: (page: Page, product?: Product) => void; toggleWishlist: (id: string) => void }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All categories");
  const [condition, setCondition] = useState("All conditions");
  const [sort, setSort] = useState("Newest");

  const { products, loading } = useProducts({
    search: search || undefined,
    category: category === "All categories" ? undefined : category,
    condition: condition === "All conditions" ? undefined : condition,
  })

  // Apply sorting client-side
  const sortedProducts = useMemo(() => {
    let items = [...products]
    if (sort === "Price: low to high") items.sort((a, b) => a.price - b.price)
    if (sort === "Price: high to low") items.sort((a, b) => b.price - a.price)
    return items
  }, [products, sort])

  // ... rest of component
}
```

## Step 10: Update Main App Render

Update the main render to pass the correct props:

```typescript
export default function App() {
  // ... hooks and state

  if (authLoading || productsLoading) {
    return <div className="loading">Loading...</div>
  }

  let content: React.ReactNode;
  if (page === "home") content = <Home navigate={navigate} toggleFavorite={toggleWishlist} />;
  else if (page === "shop") content = <Shop navigate={navigate} toggleWishlist={toggleWishlist} />;
  else if (page === "product" && selectedProduct) content = <ProductDetail product={selectedProduct} toggleFavorite={() => toggleWishlist(selectedProduct.id)} addToCart={() => addToCart(selectedProduct.id)} navigate={navigate} />;
  else if (page === "wishlist") content = <Wishlist navigate={navigate} toggleWishlist={toggleWishlist} />;
  else if (page === "cart") content = <Cart cart={cart} removeFromCart={removeFromCart} navigate={navigate} />;
  else if (page === "checkout") content = <Checkout cart={cart} createOrder={createOrder} navigate={navigate} />;
  else if (page === "confirmation") content = <Confirmation navigate={navigate} />;
  else if (page === "orders") content = <Orders orders={orders} />;
  else if (page === "profile") content = <Profile profile={profile} updateProfile={updateProfile} onLogout={signOut} navigate={navigate} />;
  else if (page === "dashboard") content = <Dashboard navigate={navigate} userId={user?.id || ''} />;
  else if (page === "products") content = <SellerProducts navigate={navigate} userId={user?.id || ''} />;
  else if (page === "seller-orders") content = <SellerOrders orders={orders} />;
  else if (page === "sales") content = <Sales orders={orders} />;
  else if (page === "seller-profile") content = <SellerProfile profile={profile} updateProfile={updateProfile} onLogout={signOut} navigate={navigate} />;
  else content = <Auth mode={page as "login" | "register" | "forgot"} navigate={navigate} onLogin={() => {}} />;

  const authPage = page === "login" || page === "register" || page === "forgot";

  return (
    <div className="app">
      {!authPage && <Header role={role} page={page} cartCount={cartCount} onNavigate={navigate} onLogout={signOut} />}
      {content}
    </div>
  );
}
```

## Important Notes

1. **Loading States**: Add loading indicators while data is being fetched
2. **Error Handling**: Add error boundaries and error messages
3. **Empty States**: Handle cases where there's no data (empty products, empty cart, etc.)
4. **Image Handling**: Update all image references to use `product.images[0]` instead of `product.image`
5. **ID Changes**: Product IDs are now UUIDs (strings) instead of numbers
6. **Authentication**: The app now requires users to be logged in to access most features

## Testing Checklist

- [ ] Sign up as a buyer
- [ ] Sign up as a seller
- [ ] Login/logout works
- [ ] Seller can add products
- [ ] Buyer can browse products
- [ ] Search and filter works
- [ ] Add to wishlist works
- [ ] Add to cart works
- [ ] Checkout creates order
- [ ] Order history displays correctly
- [ ] Seller dashboard shows real stats
- [ ] Profile updates work
