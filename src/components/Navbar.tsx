import { useState, useRef, useEffect } from 'react';
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
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);
  const logoutButtonRef = useRef<HTMLDivElement>(null);
  const buyerNav: [string, Page][] = [["Home", "home"], ["Shop", "shop"], ["Categories", "shop"], ["Wishlist", "wishlist"], ["Messages", "messages"], ["Orders", "orders"]];
  const sellerNav: [string, Page][] = [["Dashboard", "dashboard"], ["Products", "products"], ["Messages", "messages"], ["Orders", "seller-orders"], ["Sales", "sales"]];
  const nav = role === "buyer" ? buyerNav : sellerNav;

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (logoutButtonRef.current && !logoutButtonRef.current.contains(event.target as Node)) {
        setShowLogoutPopup(false);
      }
    };

    if (showLogoutPopup) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLogoutPopup]);

  const handleLogoutClick = () => {
    setShowLogoutPopup(true);
  };

  const handleConfirmLogout = () => {
    setShowLogoutPopup(false);
    onLogout();
  };

  const handleCancelLogout = () => {
    setShowLogoutPopup(false);
  };

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
            <button onClick={() => {
              if (window.confirm('Are you sure you want to sign out?')) {
                onLogout();
              }
            }}>Sign out</button>
          </div>
        </nav>
        <div className="header-actions">
          {role === "buyer" && (
            <button className="icon-button" onClick={() => onNavigate("cart")} aria-label="Cart">
              <Icon name="bag" size={21} />{cartCount > 0 && <span>{cartCount}</span>}
            </button>
          )}
          <button className="icon-button" onClick={() => onNavigate("messages")} aria-label="Messages">
            <Icon name="message" size={21} />
          </button>
          <button className="icon-button" onClick={() => onNavigate(role === "buyer" ? "profile" : "seller-profile")} aria-label="Profile"><Icon name="user" size={21} /></button>
          <div className="icon-button-wrapper" ref={logoutButtonRef}>
            <button className="icon-button" onClick={handleLogoutClick} aria-label="Sign out">
              <Icon name="signout" size={18} />
            </button>
            {showLogoutPopup && (
              <div className="logout-popup">
                <p>Are you sure you want to sign out?</p>
                <div className="logout-popup-actions">
                  <button className="button outline" onClick={handleCancelLogout}>Cancel</button>
                  <button className="button primary" onClick={handleConfirmLogout}>Sign Out</button>
                </div>
              </div>
            )}
          </div>
          <button className="menu-button" onClick={() => setOpen(!open)} aria-label="Menu"><Icon name={open ? "close" : "menu"} size={23} /></button>
        </div>
      </header>
      {open && <div className="menu-backdrop open" onClick={() => setOpen(false)} />}
    </>
  );
}
