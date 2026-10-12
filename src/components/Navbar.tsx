import { useState } from 'react';
import { Icon } from './Icon';
import type { Role, Page } from '../types';

export function Navbar({
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
