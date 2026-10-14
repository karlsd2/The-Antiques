import { useState, useEffect } from "react";
import { useAuth, type Profile } from "./hooks/useAuth";
import { useProducts, useCategories } from "./hooks/useProducts";
import { useWishlist } from "./hooks/useWishlist";
import { useCart } from "./hooks/useCart";
import { useOrders } from "./hooks/useOrders";
import { Navbar } from "./components/Navbar";
import type { Page, Product, Role } from "./types";

// Page imports
import { Home } from "./pages/Home";
import { Shop } from "./pages/Shop";
import { ProductDetails } from "./pages/ProductDetails";
import { Cart } from "./pages/Cart";
import { Checkout } from "./pages/Checkout";
import { Confirmation } from "./pages/Confirmation";
import { Orders } from "./pages/Orders";
import { Profile as ProfilePage } from "./pages/Profile";
import { Wishlist } from "./pages/Wishlist";
import { Auth } from "./pages/Auth";
import { Dashboard } from "./pages/seller/Dashboard";
import { Products } from "./pages/seller/Products";
import { SellerOrders } from "./pages/seller/SellerOrders";
import { Sales } from "./pages/seller/Sales";
import { SellerProfile } from "./pages/seller/SellerProfile";

export default function App() {
  const { user, profile, loading: authLoading, signOut, updateProfile } = useAuth();
  const [page, setPage] = useState<Page>("login");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [lastOrder, setLastOrder] = useState<{ id: string; order_number: string } | null>(null);
  const [orderProcessing, setOrderProcessing] = useState(false);

  // Navigate to appropriate page after auth loads (only if on auth pages)
  useEffect(() => {
    if (!authLoading && user && profile) {
      if (page === "login" || page === "register" || page === "forgot") {
        const initialPage = profile.role === 'seller' ? 'dashboard' : 'home';
        setPage(initialPage);
      }
    }
  }, [authLoading, user, profile, page]);

  // Fetch products and categories for buyers
  const { products, loading: productsLoading, error: productsError, refetch: refetchProducts } = useProducts();
  const { categories, loading: categoriesLoading, error: categoriesError } = useCategories();

  // Fetch seller-specific products for dashboard
  const { products: sellerProducts, loading: sellerProductsLoading, refetch: refetchSellerProducts } = useProducts({ sellerId: user?.id });

  // Fetch wishlist for authenticated users
  const { wishlist, toggleWishlist, loading: wishlistLoading, error: wishlistError } = useWishlist(user?.id || null);

  // Fetch cart for authenticated users
  const { cart, addToCart: addToCartDb, removeFromCart: removeFromCartDb, updateQuantity, cartCount, loading: cartLoading, error: cartError, clearCart } = useCart(user?.id || null);

  // Orders hook
  const { createOrder } = useOrders(user?.id || null, false);

  const role = profile?.role || "buyer";

  const buyerPages: Set<Page> = new Set(["home", "shop", "product", "wishlist", "cart", "checkout", "confirmation", "orders", "profile"]);
  const sellerPages: Set<Page> = new Set(["dashboard", "products", "seller-orders", "sales", "seller-profile"]);
  const authPages: Set<Page> = new Set(["login", "register", "forgot"]);

  const navigate = (destination: Page, product?: Product) => {
    // Role protection: check if the destination is accessible to the current role
    if (!authPages.has(destination)) {
      if (role === "buyer" && !buyerPages.has(destination)) {
        // Buyer trying to access seller page - redirect to buyer home
        setPage("home");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      if (role === "seller" && !sellerPages.has(destination)) {
        // Seller trying to access buyer page - redirect to seller dashboard
        setPage("dashboard");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
    }

    if (product) setSelectedProduct(product);
    setPage(destination);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLogin = () => {
    navigate(profile?.role === "seller" ? "dashboard" : "home");
  };

  const handleLogout = async () => {
    await signOut();
    navigate("login");
  };

  const toggleFavorite = async (id: string) => {
    if (user) {
      try {
        await toggleWishlist(id);
      } catch (err) {
        console.error('Error toggling wishlist:', err);
        alert('Failed to update wishlist. Please try again.');
      }
    }
  };

  const addToCart = async (product: Product) => {
    if (user) {
      try {
        await addToCartDb(product.id);
      } catch (err: any) {
        console.error('Error adding to cart:', err);
        alert(err.message || 'Failed to add to cart. Please try again.');
      }
    }
  };

  const removeFromCart = async (id: string) => {
    if (user) {
      try {
        await removeFromCartDb(id);
      } catch (err) {
        console.error('Error removing from cart:', err);
        alert('Failed to remove item from cart. Please try again.');
      }
    }
  };

  const handleUpdateQuantity = async (id: string, quantity: number) => {
    if (user) {
      try {
        await updateQuantity(id, quantity);
      } catch (err: any) {
        console.error('Error updating quantity:', err);
        alert(err.message || 'Failed to update quantity. Please try again.');
      }
    }
  };

  const handleCreateOrder = async (formData: FormData) => {
    if (!user) {
      alert('You must be logged in to place an order');
      return;
    }

    try {
      setOrderProcessing(true);

      // Get cart items with full product data
      const cartItemsWithProducts = cart.map(item => ({
        product_id: item.product_id,
        product_name: item.product?.name || '',
        product_condition: item.product?.condition || null,
        price: item.product?.price || 0,
        quantity: item.quantity,
      }));

      if (cartItemsWithProducts.length === 0) {
        throw new Error('Your cart is empty');
      }

      // Calculate totals from verified prices
      const subtotal = cartItemsWithProducts.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      // Shipping fee: configurable flat rate for Philippine orders (PHP)
      // TODO: Integrate with actual courier API for real-time rates
      const shippingCost = subtotal >= 5000 ? 0 : 150;
      const total = subtotal + shippingCost;

      // Build shipping address from form data (Philippine format with manual text inputs)
      const shippingAddress = {
        email: formData.get('email') as string,
        first_name: formData.get('firstName') as string,
        last_name: formData.get('lastName') as string,
        mobile_number: formData.get('mobileNumber') as string,
        street_address: formData.get('streetAddress') as string,
        barangay: formData.get('barangay') as string,
        city_municipality: formData.get('cityMunicipality') as string,
        province: formData.get('province') as string,
        region: formData.get('region') as string,
        postal_code: formData.get('postalCode') as string,
      };

      // Validate shipping address (basic check - detailed validation in Checkout.tsx)
      if (!shippingAddress.email || !shippingAddress.first_name || !shippingAddress.last_name ||
          !shippingAddress.mobile_number || !shippingAddress.street_address || !shippingAddress.barangay ||
          !shippingAddress.city_municipality || !shippingAddress.province || !shippingAddress.region ||
          !shippingAddress.postal_code) {
        throw new Error('Please fill in all required fields');
      }

      // Create order via Supabase
      const order = await createOrder(
        user.id,
        cartItemsWithProducts,
        shippingAddress,
        total,
        shippingCost
      );

      // Store order for confirmation page
      setLastOrder({ id: order.id, order_number: order.order_number });

      // Clear cart after successful order
      await clearCart();

      // Navigate to confirmation
      setPage("confirmation");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      console.error('Error creating order:', err);
      alert(err.message || 'Failed to place order. Please try again.');
    } finally {
      setOrderProcessing(false);
    }
  };

  const authPage = page === "login" || page === "register" || page === "forgot";

  if (authLoading) {
    return <div className="loading" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '1.5rem' }}>Loading...</div>;
  }

  // Convert cart items to Product format for components
  const cartProducts: Product[] = cart.map(item => ({
    id: item.product_id,
    seller_id: item.product?.seller_id || '',
    name: item.product?.name || '',
    price: item.product?.price || 0,
    category_id: item.product?.category_id || null,
    category_name: item.product?.category_name,
    condition: item.product?.condition || 'Good',
    year: item.product?.year || null,
    verified: item.product?.verified || 'Pending',
    stock: item.product?.stock || 0,
    description: item.product?.description || null,
    images: item.product?.images || [],
    status: item.product?.status || 'active',
    seller_name: item.product?.seller_name,
    created_at: item.product?.created_at || '',
    updated_at: item.product?.updated_at || '',
  }));

  let content: React.ReactNode;
  if (page === "home") {
    content = <Home navigate={navigate} favorites={wishlist} toggleFavorite={toggleFavorite} products={products} categories={categories} loading={productsLoading || categoriesLoading} error={productsError || categoriesError} />;
  } else if (page === "shop") {
    content = <Shop navigate={navigate} favorites={wishlist} toggleFavorite={toggleFavorite} products={products} categories={categories} loading={productsLoading || categoriesLoading} error={productsError || categoriesError} />;
  } else if (page === "product") {
    content = selectedProduct ? <ProductDetails product={selectedProduct} favorite={wishlist.includes(selectedProduct.id)} toggleFavorite={() => toggleFavorite(selectedProduct.id)} addToCart={() => addToCart(selectedProduct)} navigate={navigate} /> : null;
  } else if (page === "wishlist") {
    content = <Wishlist navigate={navigate} favorites={wishlist} toggleFavorite={toggleFavorite} products={products} loading={wishlistLoading} error={wishlistError} />;
  } else if (page === "cart") {
    content = <Cart items={cartProducts} cartItems={cart} remove={removeFromCart} updateQuantity={handleUpdateQuantity} navigate={navigate} loading={cartLoading} error={cartError} />;
  } else if (page === "checkout") {
    if (cartProducts.length === 0) {
      setPage("cart");
      window.scrollTo({ top: 0, behavior: "smooth" });
      content = null;
    } else {
      content = <Checkout items={cartProducts} cartItems={cart} navigate={navigate} onSubmitOrder={handleCreateOrder} isProcessing={orderProcessing} />;
    }
  } else if (page === "confirmation") {
    content = <Confirmation navigate={navigate} orderNumber={lastOrder?.order_number} />;
  } else if (page === "orders") {
    content = <Orders />;
  } else if (page === "profile") {
    content = <ProfilePage navigate={navigate} onLogout={handleLogout} profile={profile} updateProfile={updateProfile} user={user} />;
  } else if (page === "dashboard") {
    content = <Dashboard navigate={navigate} products={sellerProducts} loading={sellerProductsLoading} profile={profile} user={user} refetch={refetchSellerProducts} />;
  } else if (page === "products") {
    content = <Products navigate={navigate} onProductCreated={refetchSellerProducts} />;
  } else if (page === "seller-orders") {
    content = <SellerOrders />;
  } else if (page === "sales") {
    content = <Sales products={products} />;
  } else if (page === "seller-profile") {
    content = <SellerProfile navigate={navigate} onLogout={handleLogout} profile={profile} updateProfile={updateProfile} user={user} />;
  } else {
    content = <Auth mode={page as "login" | "register" | "forgot"} navigate={navigate} onLogin={handleLogin} />;
  }

  return (
    <div className="app">
      {!authPage && <Navbar role={role} page={page} cartCount={cartCount} onNavigate={navigate} onLogout={handleLogout} />}
      {content}
    </div>
  );
}
