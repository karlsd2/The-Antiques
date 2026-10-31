// Re-export database types
export * from './database';

// Re-export auth types
export type { UserRole, Profile } from '../hooks/useAuth';

// Local types from App.tsx
export type Role = "buyer" | "seller";

export type Page =
  | "home"
  | "shop"
  | "product"
  | "wishlist"
  | "cart"
  | "checkout"
  | "confirmation"
  | "orders"
  | "profile"
  | "messages"
  | "dashboard"
  | "products"
  | "seller-orders"
  | "sales"
  | "seller-profile"
  | "seller-shop"
  | "login"
  | "register"
  | "forgot";

export type Product = {
  id: string;
  seller_id: string;
  name: string;
  price: number;
  category_id: string | null;
  category_name?: string;
  categories?: { name: string };
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

export type Category = {
  id: string;
  name: string;
  created_at: string;
};

export type ChatMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
  is_me: boolean;
  images?: string[];
};

export type Conversation = {
  id: string;
  buyer_id: string;
  seller_id: string;
  product_id: string;
  created_at: string;
  updated_at: string;
  product: Product;
  buyer_name: string;
  seller_name: string;
  seller_initials: string;
  last_message?: string;
  unread_count: number;
  messages?: { body: string }[];
};
