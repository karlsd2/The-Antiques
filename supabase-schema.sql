-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('buyer', 'seller')),
  store_name TEXT,
  store_description TEXT,
  phone TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Categories table
CREATE TABLE public.categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Products table
CREATE TABLE public.products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  condition TEXT NOT NULL CHECK (condition IN ('Mint', 'Excellent', 'Good', 'Fair')),
  year TEXT,
  verified TEXT NOT NULL DEFAULT 'Pending',
  stock INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  images TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'draft', 'sold')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Wishlist table
CREATE TABLE public.wishlist (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  UNIQUE(user_id, product_id)
);

-- Cart table
CREATE TABLE public.cart (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  UNIQUE(user_id, product_id)
);

-- Orders table
CREATE TABLE public.orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  buyer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  shipping_cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Confirmed' CHECK (status IN ('Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled')),
  shipping_address JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Order items table
CREATE TABLE public.order_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_condition TEXT,
  price DECIMAL(10, 2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_products_seller ON public.products(seller_id);
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_status ON public.products(status);
CREATE INDEX idx_wishlist_user ON public.wishlist(user_id);
CREATE INDEX idx_wishlist_product ON public.wishlist(product_id);
CREATE INDEX idx_cart_user ON public.cart(user_id);
CREATE INDEX idx_orders_buyer ON public.orders(buyer_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_order_items_order ON public.order_items(order_id);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for categories
CREATE POLICY "Anyone can view categories" ON public.categories FOR SELECT USING (true);

-- RLS Policies for products
CREATE POLICY "Anyone can view active products" ON public.products FOR SELECT USING (status = 'active');
CREATE POLICY "Sellers can view their own products" ON public.products FOR SELECT USING (auth.uid() = seller_id);
CREATE POLICY "Sellers can insert products" ON public.products FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Sellers can update their own products" ON public.products FOR UPDATE USING (auth.uid() = seller_id);
CREATE POLICY "Sellers can delete their own products" ON public.products FOR DELETE USING (auth.uid() = seller_id);

-- RLS Policies for wishlist
CREATE POLICY "Users can view own wishlist" ON public.wishlist FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert into wishlist" ON public.wishlist FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete from wishlist" ON public.wishlist FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for cart
CREATE POLICY "Users can view own cart" ON public.cart FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert into cart" ON public.cart FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cart" ON public.cart FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete from cart" ON public.cart FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for orders
CREATE POLICY "Buyers can view own orders" ON public.orders FOR SELECT USING (auth.uid() = buyer_id);
CREATE POLICY "Sellers can view orders for their products" ON public.orders FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.order_items oi
    JOIN public.products p ON oi.product_id = p.id
    WHERE oi.order_id = orders.id AND p.seller_id = auth.uid()
  )
);
CREATE POLICY "Users can insert orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Sellers can update order status" ON public.orders FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.order_items oi
    JOIN public.products p ON oi.product_id = p.id
    WHERE oi.order_id = orders.id AND p.seller_id = auth.uid()
  )
);

-- RLS Policies for order items
CREATE POLICY "Users can view order items" ON public.order_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id AND o.buyer_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.orders o
    JOIN public.products p ON p.id = order_items.product_id
    WHERE o.id = order_items.order_id AND p.seller_id = auth.uid()
  )
);
CREATE POLICY "Users can insert order items" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update order items" ON public.order_items FOR UPDATE USING (true);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'buyer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call handle_new_user on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cart_updated_at BEFORE UPDATE ON public.cart
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
