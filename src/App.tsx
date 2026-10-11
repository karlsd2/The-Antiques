import { useMemo, useState } from "react";
import { useAuth, type UserRole } from "./hooks/useAuth";
import { useProducts, useCategories, deleteProduct, type Product as ProductType, type Category } from "./hooks/useProducts";
import { useWishlist } from "./hooks/useWishlist";
import { useCart } from "./hooks/useCart";

type Role = "buyer" | "seller";
type Page =
  | "home"
  | "shop"
  | "product"
  | "wishlist"
  | "cart"
  | "checkout"
  | "confirmation"
  | "orders"
  | "profile"
  | "dashboard"
  | "products"
  | "seller-orders"
  | "sales"
  | "seller-profile"
  | "login"
  | "register"
  | "forgot";

type Product = {
  id: string;
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
  images: string[];
  status: "active" | "draft" | "sold";
  seller_name?: string;
  created_at: string;
  updated_at: string;
};

const iconPaths: Record<string, React.ReactNode> = {
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></>,
  heart: <path d="M20.8 5.7a5.4 5.4 0 0 0-7.6 0L12 6.9l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6L12 22l8.8-8.7a5.4 5.4 0 0 0 0-7.6Z" />,
  cart: <><path d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.6L20.5 8H6" /><circle cx="10" cy="20" r="1" /><circle cx="18" cy="20" r="1" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4.5 21a7.5 7.5 0 0 1 15 0" /></>,
  arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
  check: <path d="m5 12 4 4L19 6" />,
  shield: <path d="M12 3 5 6v5c0 4.8 2.8 8.1 7 10 4.2-1.9 7-5.2 7-10V6l-7-3Z" />,
  plus: <path d="M12 5v14M5 12h14" />,
  trash: <><path d="M4 7h16M9 7V4h6v3m3 0-1 14H7L6 7m4 4v6m4-6v6" /></>,
  edit: <><path d="m4 16-1 5 5-1L19 9l-4-4L4 16Z" /><path d="m13.5 6.5 4 4" /></>,
  bag: <><path d="M5 8h14l-1 13H6L5 8Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></>,
  chart: <><path d="M4 20V10m6 10V4m6 16v-7m5 7H2" /></>,
  box: <><path d="m4 7 8-4 8 4-8 4-8-4Z" /><path d="M4 7v10l8 4 8-4V7M12 11v10" /></>,
  chevron: <path d="m9 18 6-6-6-6" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  truck: <><path d="M3 6h11v11H3zM14 10h4l3 3v4h-7" /><circle cx="7" cy="19" r="2" /><circle cx="18" cy="19" r="2" /></>,
  signout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></>,
};

function Icon({ name, size = 20, filled = false }: { name: string; size?: number; filled?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {iconPaths[name]}
    </svg>
  );
}

const money = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

function Badge({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return <span className={`badge ${dark ? "badge-dark" : ""}`}><Icon name="shield" size={13} />{children}</span>;
}

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
        <img src={product.images?.[0] || ''} alt={product.name} />
        <button
          className={`favorite-button ${favorite ? "active" : ""}`}
          onClick={(event) => {
            event.stopPropagation();
            onFavorite();
          }}
          aria-label={favorite ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Icon name="heart" size={18} filled={favorite} />
        </button>
        <span className="condition-chip">{product.condition}</span>
      </div>
      <button className="product-copy" onClick={onOpen}>
        <div className="product-meta">{product.category_name || 'Uncategorized'} · {product.year || 'Unknown'}</div>
        <h3>{product.name}</h3>
        <div className="product-bottom">
          <strong>{money(product.price)}</strong>
          <span className="mini-verified"><Icon name="check" size={12} /> Verified</span>
        </div>
      </button>
    </article>
  );
}

function SectionTitle({ eyebrow, title, action, onAction }: { eyebrow: string; title: string; action?: string; onAction?: () => void }) {
  return (
    <div className="section-heading">
      <div><span>{eyebrow}</span><h2>{title}</h2></div>
      {action && <button className="text-link" onClick={onAction}>{action}<Icon name="arrow" size={17} /></button>}
    </div>
  );
}

function Header({
  role,
  page,
  cartCount,
  onNavigate,
  onLogout,
}: {
  role: Role;
  page: Page;
  cartCount: number;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const buyerNav: [string, Page][] = [["Home", "home"], ["Shop", "shop"], ["Categories", "shop"], ["Wishlist", "wishlist"], ["Orders", "orders"]];
  const sellerNav: [string, Page][] = [["Dashboard", "dashboard"], ["Products", "products"], ["Orders", "seller-orders"], ["Sales", "sales"]];
  const nav = role === "buyer" ? buyerNav : sellerNav;
  return (
    <>
      <header>
        <button className="brand" onClick={() => onNavigate(role === "buyer" ? "home" : "dashboard")}>
          <span className="brand-mark">A</span>
          <span>The Antiques</span>
        </button>
        <nav className={open ? "open" : ""}>
          {nav.map(([label, destination]) => (
            <button key={label} className={page === destination ? "active" : ""} onClick={() => { onNavigate(destination); setOpen(false); }}>{label}</button>
          ))}
          <div className="mobile-logout">
            <button onClick={onLogout}>Sign out</button>
          </div>
        </nav>
        <div className="header-actions">
          {role === "buyer" && (
            <button className="icon-button" onClick={() => onNavigate("cart")} aria-label="Cart">
              <Icon name="bag" size={21} />{cartCount > 0 && <span>{cartCount}</span>}
            </button>
          )}
          <button className="icon-button" onClick={() => onNavigate(role === "buyer" ? "profile" : "seller-profile")} aria-label="Profile"><Icon name="user" size={21} /></button>
          <button className="icon-button" onClick={onLogout} aria-label="Sign out"><Icon name="signout" size={18} /></button>
          <button className="menu-button" onClick={() => setOpen(!open)} aria-label="Menu"><Icon name={open ? "close" : "menu"} size={23} /></button>
        </div>
      </header>
    </>
  );
}

function Home({ navigate, favorites, toggleFavorite, products, categories, loading, error }: { navigate: (page: Page, product?: Product) => void; favorites: string[]; toggleFavorite: (id: string) => void; products: Product[]; categories: Category[]; loading: boolean; error: Error | null }) {
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

function Shop({ navigate, favorites, toggleFavorite, products, categories, loading, error }: { navigate: (page: Page, product?: Product) => void; favorites: string[]; toggleFavorite: (id: string) => void; products: Product[]; categories: Category[]; loading: boolean; error: Error | null }) {
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
          <p>Loading...</p>
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
        <h1>Pieces with a past,<br /><em>ready for what’s next.</em></h1>
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

function ProductDetail({ product, favorite, toggleFavorite, addToCart, navigate }: { product: Product; favorite: boolean; toggleFavorite: () => void; addToCart: () => void; navigate: (page: Page) => void }) {
  return (
    <main className="inner-page product-detail">
      <button className="back-link" onClick={() => navigate("shop")}>← Back to collection</button>
      <div className="detail-grid">
        <div className="detail-gallery">
          <div className="main-image"><img src={product.images?.[0] || ''} alt={product.name} /><span className="image-counter">1 / {product.images?.length || 1}</span></div>
          <div className="thumbnails">{(product.images?.slice(1, 4) || []).map((img, idx) => <button key={idx}><img src={img} alt="" /></button>)}</div>
        </div>
        <div className="detail-copy">
          <div className="detail-topline"><span>{product.category_name || 'Uncategorized'} · {product.year || 'Unknown'}</span><button onClick={toggleFavorite}><Icon name="heart" filled={favorite} /> {favorite ? "Saved" : "Save"}</button></div>
          <h1>{product.name}</h1>
          <div className="detail-price">{money(product.price)}</div>
          <div className="badge-row"><Badge>{product.verified}</Badge><Badge>{product.condition} condition</Badge></div>
          <p className="description">{product.description}</p>
          <div className="condition-panel">
            <div><span>Condition</span><strong>{product.condition}</strong></div>
            <div className="condition-scale"><i /><i /><i /><i className={product.condition === "Mint" ? "on" : ""} /></div>
            <p>Carefully inspected. Light signs of age are visible and consistent with the piece’s history.</p>
          </div>
          <dl className="product-specs">
            <div><dt>Era / year</dt><dd>{product.year || 'Unknown'}</dd></div><div><dt>Category</dt><dd>{product.category_name || 'Uncategorized'}</dd></div><div><dt>Ships from</dt><dd>Brooklyn, New York</dd></div><div><dt>Availability</dt><dd>Only {product.stock} available</dd></div>
          </dl>
          <div className="purchase-actions">
            <button className="button primary" onClick={addToCart}>Add to cart <Icon name="bag" /></button>
            <button className="button outline" onClick={() => { addToCart(); navigate("checkout"); }}>Buy it now</button>
          </div>
          <div className="seller-card">
            <div className="avatar">{product.seller_name?.[0] || 'S'}</div><div><small>Sold by</small><strong>{product.seller_name || 'Seller'} <Icon name="check" size={14} /></strong><span>Trusted seller · 98% positive</span></div><button>View shop</button>
          </div>
        </div>
      </div>
      <section className="detail-story">
        <span className="eyebrow">Why it’s special</span><h2>A piece made to last.</h2>
        <p>Selected for its enduring design, honest materials and exceptional preservation. This is the kind of object that becomes more personal with every passing year.</p>
      </section>
    </main>
  );
}

function Cart({ items, remove, navigate }: { items: Product[]; remove: (id: string) => void; navigate: (page: Page) => void }) {
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  return (
    <main className="inner-page narrow">
      <div className="page-intro compact"><span className="eyebrow">Your selection</span><h1>Shopping cart</h1><p>{items.length} one-of-a-kind {items.length === 1 ? "piece" : "pieces"} reserved for you.</p></div>
      {items.length === 0 ? (
        <div className="empty-state"><Icon name="bag" size={36} /><h2>Your cart is waiting</h2><p>Explore the collection and find a piece worth keeping.</p><button className="button primary" onClick={() => navigate("shop")}>Browse collection</button></div>
      ) : (
        <div className="cart-layout">
          <div className="cart-list">
            {items.map((item) => <div className="cart-item" key={item.id}><img src={item.images?.[0] || ''} alt={item.name} /><div><span>{item.category_name || 'Uncategorized'}</span><h3>{item.name}</h3><Badge>{item.condition}</Badge><button onClick={() => remove(item.id)}><Icon name="trash" size={16} /> Remove</button></div><strong>{money(item.price)}</strong></div>)}
          </div>
          <aside className="summary-card"><h2>Order summary</h2><div><span>Subtotal</span><strong>{money(subtotal)}</strong></div><div><span>Insured shipping</span><strong>{subtotal >= 500 ? "Complimentary" : "$24"}</strong></div><div><span>Estimated tax</span><span>Calculated at checkout</span></div><hr /><div className="total"><span>Total</span><strong>{money(subtotal + (subtotal >= 500 ? 0 : 24))}</strong></div><button className="button primary" onClick={() => navigate("checkout")}>Proceed to checkout <Icon name="arrow" /></button><small><Icon name="shield" size={14} /> Protected purchase guarantee</small></aside>
        </div>
      )}
    </main>
  );
}

function Checkout({ items, navigate }: { items: Product[]; navigate: (page: Page) => void }) {
  const total = items.reduce((sum, item) => sum + item.price, 0) + (items.reduce((sum, item) => sum + item.price, 0) >= 500 ? 0 : 24);
  return (
    <main className="checkout-page">
      <div className="checkout-form">
        <button className="back-link" onClick={() => navigate("cart")}>← Return to cart</button>
        <span className="eyebrow">Secure checkout</span><h1>Where should we<br /><em>send your find?</em></h1>
        <form onSubmit={(e) => { e.preventDefault(); navigate("confirmation"); }}>
          <h3>Contact</h3>
          <div className="form-grid"><label className="wide">Email address<input required type="email" placeholder="you@example.com" /></label></div>
          <h3>Shipping address</h3>
          <div className="form-grid">
            <label>First name<input required placeholder="Maya" /></label><label>Last name<input required placeholder="Rivera" /></label>
            <label className="wide">Street address<input required placeholder="123 Bedford Avenue" /></label>
            <label>City<input required placeholder="Brooklyn" /></label><label>State<select><option>New York</option><option>California</option></select></label>
            <label>ZIP code<input required placeholder="11211" /></label><label>Country<select><option>United States</option><option>Canada</option></select></label>
          </div>
          <h3>Payment</h3>
          <div className="payment-box"><label>Card number<input required placeholder="4242 4242 4242 4242" /></label><div><label>Expiration<input required placeholder="MM / YY" /></label><label>Security code<input required placeholder="CVC" /></label></div></div>
          <button className="button primary wide-button" type="submit">Place order · {money(total)} <Icon name="arrow" /></button>
        </form>
      </div>
      <aside className="checkout-summary">
        <h2>Your order</h2>
        {items.map((item) => <div className="checkout-item" key={item.id}><img src={item.images?.[0] || ''} alt="" /><div><strong>{item.name}</strong><span>{item.condition} · Qty 1</span></div><b>{money(item.price)}</b></div>)}
        <hr /><div><span>Subtotal</span><strong>{money(items.reduce((sum, item) => sum + item.price, 0))}</strong></div><div><span>Shipping</span><strong>{total > 500 ? "Complimentary" : "$24"}</strong></div><div className="total"><span>Total</span><strong>{money(total)}</strong></div>
        <p><Icon name="shield" /> Every order is protected by our authenticity and condition guarantee.</p>
      </aside>
    </main>
  );
}

function Confirmation({ navigate }: { navigate: (page: Page) => void }) {
  return <main className="confirmation"><div className="success-mark"><Icon name="check" size={36} /></div><span className="eyebrow">Order confirmed</span><h1>A new story<br /><em>is on its way.</em></h1><p>Thank you, Maya. We’ve sent confirmation and tracking details to your email.</p><div className="order-ticket"><div><span>Order number</span><strong>#TA-2048</strong></div><div><span>Estimated delivery</span><strong>June 18–21</strong></div></div><div className="hero-actions"><button className="button primary" onClick={() => navigate("orders")}>View your order</button><button className="button outline" onClick={() => navigate("shop")}>Keep exploring</button></div></main>;
}

const orderData = [
  ["#TA-2048", "Walnut Turntable", "Jun 12, 2026", "$285", "Confirmed"],
  ["#TA-1891", "Brass Desk Lamp", "May 20, 2026", "$164", "Delivered"],
  ["#TA-1764", "Kodak Brownie Camera", "Apr 03, 2026", "$98", "Delivered"],
  ["#TA-1590", "Silk Evening Scarf", "Mar 14, 2026", "$72", "Cancelled"],
];

function Orders({ seller = false }: { seller?: boolean }) {
  return (
    <main className="inner-page">
      <div className="dashboard-title"><div><span className="eyebrow">{seller ? "Seller workspace" : "Your collection"}</span><h1>{seller ? "Manage orders" : "Your orders"}</h1><p>{seller ? "Keep buyers updated from purchase to delivery." : "Follow every piece from the seller’s hands to yours."}</p></div></div>
      <div className="table-card">
        <div className="table-tools"><strong>{orderData.length} orders</strong><label className="search-field"><Icon name="search" size={17} /><input placeholder="Search orders" /></label></div>
        <div className="data-table">
          <div className="table-row header"><span>Order</span><span>{seller ? "Buyer / Product" : "Product"}</span><span>Date</span><span>Total</span><span>Status</span><span></span></div>
          {orderData.map((order, index) => <div className="table-row" key={order[0]}><strong>{order[0]}</strong><span>{seller && <small>{["Maya Rivera", "Noah Reed", "Ava Brooks", "Liam Chen"][index]} · </small>}{order[1]}</span><span>{order[2]}</span><span>{order[3]}</span><span><i className={`status ${order[4].toLowerCase()}`}>{order[4]}</i></span><button>{seller ? "Update" : "View"} <Icon name="chevron" size={14} /></button></div>)}
        </div>
      </div>
    </main>
  );
}

function Profile({ seller = false, navigate, onLogout }: { seller?: boolean; navigate: (page: Page) => void; onLogout: () => void }) {
  return (
    <main className="inner-page profile-page">
      <div className="profile-hero">
        <div className="large-avatar">{seller ? "FF" : "MR"}</div>
        <div><span className="eyebrow">{seller ? "Trusted seller since 2022" : "Member since 2024"}</span><h1>{seller ? "Found & Form" : "Maya Rivera"}</h1><p>{seller ? "Considered vintage objects for slower, more personal homes." : "Collector of analog cameras, records and beautifully made things."}</p></div>
        <div className="profile-actions"><button className="button outline"><Icon name="edit" size={17} /> Edit profile</button><button className="button outline" onClick={onLogout}><Icon name="close" size={17} /> Sign out</button></div>
      </div>
      <div className="profile-grid">
        <div className="profile-panel"><h2>{seller ? "Store information" : "Profile information"}</h2><dl><div><dt>Email</dt><dd>{seller ? "hello@foundandform.co" : "maya.rivera@example.com"}</dd></div><div><dt>Phone</dt><dd>+1 718 555 0142</dd></div><div><dt>Location</dt><dd>Brooklyn, New York</dd></div></dl><button className="text-link">Update information <Icon name="arrow" /></button></div>
        <div className="profile-panel"><h2>{seller ? "Store performance" : "Saved address"}</h2>{seller ? <div className="mini-stats"><div><strong>48</strong><span>Listed</span></div><div><strong>126</strong><span>Sold</span></div><div><strong>4.9</strong><span>Rating</span></div></div> : <><p><strong>Home</strong><br />Maya Rivera<br />123 Bedford Avenue<br />Brooklyn, NY 11211</p><button className="text-link">Manage addresses <Icon name="arrow" /></button></>}</div>
      </div>
      <div className="quick-links">
        {(seller ? [["Listed products", "products"], ["Sold products", "sales"], ["Seller orders", "seller-orders"]] : [["Order history", "orders"], ["Your wishlist", "wishlist"], ["Account settings", "profile"]]).map(([label, destination]) => <button key={label} onClick={() => navigate(destination as Page)}>{label}<Icon name="arrow" /></button>)}
      </div>
    </main>
  );
}

function Dashboard({ navigate, products, loading }: { navigate: (page: Page) => void; products: Product[]; loading: boolean }) {
  const stats = [["Total products", "48", "+4 this month", "box"], ["Active listings", "41", "85% of inventory", "bag"], ["Items sold", "126", "+12 this month", "check"], ["Total sales", "$18.4k", "+18.2% this month", "chart"]];
  return (
    <main className="inner-page">
      <div className="dashboard-title"><div><span className="eyebrow">Seller workspace</span><h1>Good morning, Found & Form.</h1><p>Here’s what’s happening with your collection today.</p></div><button className="button primary" onClick={() => navigate("products")}><Icon name="plus" /> Add a product</button></div>
      <div className="stats-grid">{stats.map(([label, value, note, icon]) => <div className="stat-card" key={label}><span><Icon name={icon} /></span><small>{label}</small><strong>{value}</strong><p>{note}</p></div>)}</div>
      <div className="dashboard-grid">
        <div className="table-card"><div className="panel-heading"><h2>Recent orders</h2><button className="text-link" onClick={() => navigate("seller-orders")}>View all <Icon name="arrow" /></button></div>{orderData.slice(0, 3).map((order) => <div className="recent-row" key={order[0]}><div className="avatar small">{order[1][0]}</div><div><strong>{order[1]}</strong><span>{order[0]} · {order[2]}</span></div><b>{order[3]}</b><i className={`status ${order[4].toLowerCase()}`}>{order[4]}</i></div>)}</div>
        <div className="table-card"><div className="panel-heading"><h2>Recent listings</h2><button className="text-link" onClick={() => navigate("products")}>Manage <Icon name="arrow" /></button></div>{loading ? <p>Loading...</p> : products.slice(0, 3).map((product) => <div className="recent-row" key={product.id}><img src={product.images?.[0] || ''} alt="" /><div><strong>{product.name}</strong><span>{product.condition} · Stock {product.stock}</span></div><b>{money(product.price)}</b></div>)}</div>
      </div>
      <div className="seller-tip"><Icon name="shield" size={30} /><div><strong>Trust makes a difference.</strong><p>Listings with detailed condition notes and authenticity information sell 32% faster.</p></div><button onClick={() => navigate("products")}>Improve listings</button></div>
    </main>
  );
}

function SellerProducts({ navigate }: { navigate: (page: Page) => void }) {
  const { user, profile } = useAuth();
  const { products, loading, error, refetch } = useProducts({ sellerId: user?.id });
  const { categories } = useCategories();
  const [showAdd, setShowAdd] = useState(false);
  const [removed, setRemoved] = useState<string[]>([]);

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

  if (!user || profile?.role !== 'seller') {
    return <main className="inner-page"><div className="page-intro"><span className="eyebrow">Access denied</span><h1>Seller access required</h1></div></main>;
  }

  return (
    <main className="inner-page">
      <div className="dashboard-title"><div><span className="eyebrow">Inventory</span><h1>Your products</h1><p>Manage active, draft and sold pieces in your collection.</p></div><button className="button primary" onClick={() => setShowAdd(true)}><Icon name="plus" /> Add a product</button></div>
      <div className="table-card">
        <div className="table-tools"><div className="tab-buttons"><button className="active">Active {products.filter(p => p.status === 'active').length}</button><button>Drafts {products.filter(p => p.status === 'draft').length}</button><button>Sold {products.filter(p => p.status === 'sold').length}</button></div><label className="search-field"><Icon name="search" size={17} /><input placeholder="Search inventory" /></label></div>
        <div className="inventory-list">
          {loading ? <p>Loading...</p> : error ? <p>Error: {error.message}</p> : products.filter((p) => !removed.includes(p.id)).map((product) => <div className="inventory-row" key={product.id}><img src={product.images?.[0] || ''} alt="" /><div className="inventory-name"><strong>{product.name}</strong><span>{product.category_name || 'Uncategorized'} · {product.year || 'Unknown'}</span></div><strong>{money(product.price)}</strong><span>{product.condition}</span><span><Badge>{product.verified}</Badge></span><span>{product.stock} in stock</span><div className="row-actions"><button aria-label="View" onClick={() => navigate("shop")}><Icon name="search" size={16} /></button><button aria-label="Edit"><Icon name="edit" size={16} /></button><button aria-label="Delete" onClick={() => handleDelete(product.id)}><Icon name="trash" size={16} /></button></div></div>)}
        </div>
      </div>
      {showAdd && <div className="modal-backdrop" onClick={() => setShowAdd(false)}><div className="modal" onClick={(e) => e.stopPropagation()}><button className="modal-close" onClick={() => setShowAdd(false)}><Icon name="close" /></button><span className="eyebrow">New listing</span><h2>Add a vintage piece</h2><form onSubmit={(e) => { e.preventDefault(); setShowAdd(false); }}>
        <div className="image-upload"><Icon name="plus" /><strong>Add product images</strong><span>Up to 8 images, JPG or PNG</span></div>
        <div className="form-grid"><label className="wide">Product name<input required placeholder="e.g. 1960s ceramic table lamp" /></label><label>Category<select><option value="">Select category</option>{categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}</select></label><label>Price<input required type="number" placeholder="0.00" /></label><label>Condition<select><option>Mint</option><option>Excellent</option><option>Good</option><option>Fair</option></select></label><label>Year / era<input placeholder="e.g. 1960s" /></label><label>Brand or maker<input placeholder="If known" /></label><label>Quantity<input type="number" defaultValue="1" /></label><label className="wide">Description<textarea required placeholder="Tell buyers what makes this piece special..." /></label><label className="wide">Authenticity information<textarea placeholder="Provenance, markings, expert inspection..." /></label></div>
        <div className="modal-actions"><button type="button" className="button outline" onClick={() => setShowAdd(false)}>Save draft</button><button className="button primary" type="submit">Publish listing</button></div>
      </form></div></div>}
    </main>
  );
}

function Sales({ products }: { products: Product[] }) {
  return (
    <main className="inner-page">
      <div className="dashboard-title"><div><span className="eyebrow">Performance</span><h1>Sales overview</h1><p>Understand how your collection is performing.</p></div><select><option>Last 6 months</option><option>This year</option></select></div>
      <div className="stats-grid"><div className="stat-card"><small>Gross sales</small><strong>$18,420</strong><p>+18.2% from last period</p></div><div className="stat-card"><small>Net earnings</small><strong>$16,578</strong><p>After marketplace fees</p></div><div className="stat-card"><small>Average order</small><strong>$146</strong><p>Across 126 sales</p></div><div className="stat-card"><small>Conversion</small><strong>4.8%</strong><p>+0.6% improvement</p></div></div>
      <div className="sales-chart table-card"><div className="panel-heading"><h2>Sales activity</h2><Badge>Healthy growth</Badge></div><div className="chart-bars">{[34, 48, 42, 65, 58, 82, 76, 92, 68, 88, 79, 100].map((height, i) => <div key={i}><i style={{ height: `${height}%` }} /><span>{["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"][i]}</span></div>)}</div></div>
      <div className="table-card best-sellers"><div className="panel-heading"><h2>Best-selling pieces</h2></div>{products.slice(0, 4).map((product, index) => <div className="recent-row" key={product.id}><span className="rank">0{index + 1}</span><img src={product.images?.[0] || ''} alt="" /><div><strong>{product.name}</strong><span>{index * 4 + 7} sold</span></div><b>{money(product.price * (index * 4 + 7))}</b></div>)}</div>
    </main>
  );
}

function Auth({ mode, navigate, onLogin }: { mode: "login" | "register" | "forgot"; navigate: (page: Page) => void; onLogin: () => void }) {
  const [selectedRole, setSelectedRole] = useState<UserRole>("buyer");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signUp, signIn } = useAuth();
  const copy = mode === "login" ? ["Welcome back.", "Sign in to continue your collection."] : mode === "register" ? ["Begin your story.", "Join a community that values things made to last."] : ["Find your way back.", "We’ll send a secure reset link to your email."];
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const fullName = formData.get('fullName') as string;

    try {
      if (mode === "login") {
        await signIn(email, password);
      } else if (mode === "register") {
        await signUp(email, password, fullName || '', selectedRole);
      }
      onLogin();
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <main className="auth-page">
      <div className="auth-image"><img src="https://images.unsplash.com/photo-1739134471861-d56aac3b0e87?auto=format&fit=crop&w=1200&q=85" alt="A curated room of vintage objects" /><div><span className="brand-mark">A</span><blockquote>“The most meaningful rooms are built one story at a time.”</blockquote><small>THE ANTIQUES</small></div></div>
      <div className="auth-form-wrap">
        <button className="auth-brand" onClick={() => navigate("login")}>The Antiques</button>
        <div className="auth-form">
          <span className="eyebrow">{mode === "login" ? "Member access" : mode === "register" ? "Create an account" : "Password recovery"}</span><h1>{copy[0]}</h1><p>{copy[1]}</p>
          {(mode === "login" || mode === "register") && <div className="role-cards"><button className={selectedRole === "buyer" ? "active" : ""} onClick={() => setSelectedRole("buyer")}><Icon name="bag" /><span><strong>Buyer</strong><small>Discover and collect</small></span></button><button className={selectedRole === "seller" ? "active" : ""} onClick={() => setSelectedRole("seller")}><Icon name="box" /><span><strong>Seller</strong><small>List and manage pieces</small></span></button></div>}
          <form onSubmit={handleSubmit}>
            {mode === "register" && <label>Full name<input name="fullName" required placeholder="Your name" /></label>}
            <label>Email address<input name="email" required type="email" placeholder="you@example.com" /></label>
            {mode !== "forgot" && <label>Password<input name="password" required type="password" placeholder="At least 8 characters" /></label>}
            {mode === "login" && <button type="button" className="forgot-link" onClick={() => navigate("forgot")}>Forgot password?</button>}
            {error && <div className="error-message" style={{ color: '#dc2626', marginTop: '1rem', fontSize: '0.875rem' }}>{error}</div>}
            <button type="submit" className="button primary wide-button" disabled={loading}>{loading ? 'Processing...' : (mode === "login" ? "Sign in" : mode === "register" ? "Create account" : "Send reset link")} <Icon name="arrow" /></button>
          </form>
          <p className="auth-switch">{mode === "login" ? "New to The Antiques?" : "Already have an account?"} <button onClick={() => navigate(mode === "login" ? "register" : "login")}>{mode === "login" ? "Create account" : "Sign in"}</button></p>
        </div>
      </div>
    </main>
  );
}

export default function App() {
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const [page, setPage] = useState<Page>("login");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Fetch products and categories for buyers
  const { products, loading: productsLoading, error: productsError } = useProducts();
  const { categories, loading: categoriesLoading, error: categoriesError } = useCategories();

  // Fetch wishlist for authenticated users
  const { wishlist, toggleWishlist } = useWishlist(user?.id || null);

  // Fetch cart for authenticated users
  const { cart, addToCart: addToCartDb, removeFromCart: removeFromCartDb, cartCount } = useCart(user?.id || null);

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

  const toggleFavorite = (id: string) => {
    if (user) {
      toggleWishlist(id);
    }
  };

  const addToCart = (product: Product) => {
    if (user) {
      addToCartDb(product.id);
    }
  };

  const removeFromCart = (id: string) => {
    if (user) {
      removeFromCartDb(id);
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
  if (page === "home") content = <Home navigate={navigate} favorites={wishlist} toggleFavorite={toggleFavorite} products={products} categories={categories} loading={productsLoading || categoriesLoading} error={productsError || categoriesError} />;
  else if (page === "shop") content = <Shop navigate={navigate} favorites={wishlist} toggleFavorite={toggleFavorite} products={products} categories={categories} loading={productsLoading || categoriesLoading} error={productsError || categoriesError} />;
  else if (page === "product") content = selectedProduct ? <ProductDetail product={selectedProduct} favorite={wishlist.includes(selectedProduct.id)} toggleFavorite={() => toggleFavorite(selectedProduct.id)} addToCart={() => addToCart(selectedProduct)} navigate={navigate} /> : null;
  else if (page === "wishlist") content = <main className="inner-page"><div className="page-intro compact"><span className="eyebrow">Saved for later</span><h1>Your wishlist</h1><p>Pieces that caught your eye.</p></div><div className="product-grid four">{products.filter((p) => wishlist.includes(p.id)).map((p) => <ProductCard key={p.id} product={p} onOpen={() => navigate("product", p)} favorite onFavorite={() => toggleFavorite(p.id)} />)}</div></main>;
  else if (page === "cart") content = <Cart items={cartProducts} remove={removeFromCart} navigate={navigate} />;
  else if (page === "checkout") content = <Checkout items={cartProducts.length ? cartProducts : products.slice(0, 1)} navigate={navigate} />;
  else if (page === "confirmation") content = <Confirmation navigate={navigate} />;
  else if (page === "orders") content = <Orders />;
  else if (page === "profile") content = <Profile navigate={navigate} onLogout={handleLogout} />;
  else if (page === "dashboard") content = <Dashboard navigate={navigate} products={products} loading={productsLoading} />;
  else if (page === "products") content = <SellerProducts navigate={navigate} />;
  else if (page === "seller-orders") content = <Orders seller />;
  else if (page === "sales") content = <Sales products={products} />;
  else if (page === "seller-profile") content = <Profile seller navigate={navigate} onLogout={handleLogout} />;
  else content = <Auth mode={page as "login" | "register" | "forgot"} navigate={navigate} onLogin={handleLogin} />;

  return (
    <div className="app">
      {!authPage && <Header role={role} page={page} cartCount={cartCount} onNavigate={navigate} onLogout={handleLogout} />}
      {content}
    </div>
  );
}
