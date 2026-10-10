# Supabase Setup Guide

## 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Choose a name (e.g., "the-antiques")
5. Choose a database password (save it securely)
6. Choose a region closest to your users
7. Click "Create new project"

## 2. Get Your Credentials

Once your project is created:

1. Go to Project Settings → API
2. Copy the following values:
   - **Project URL** (this is your `VITE_SUPABASE_URL`)
   - **anon/public key** (this is your `VITE_SUPABASE_ANON_KEY`)

## 3. Set Up Environment Variables

1. Create a `.env` file in the project root:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

## 4. Run the Database Schema

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Click "New Query"
4. Copy the contents of `supabase-schema.sql`
5. Paste it into the SQL editor
6. Click "Run" to execute the schema

This will create:
- `profiles` table (user profiles with role)
- `categories` table (product categories)
- `products` table (product listings)
- `wishlist` table (user wishlists)
- `cart` table (shopping cart)
- `orders` table (order information)
- `order_items` table (order line items)
- Row Level Security (RLS) policies
- Triggers for automatic timestamps

## 5. Create Initial Categories

Run this SQL to add initial categories:

```sql
INSERT INTO public.categories (name) VALUES
  ('Vinyl Records'),
  ('Classic Toys'),
  ('Retro Fashion'),
  ('Old Banknotes'),
  ('Vintage Electronics'),
  ('Collectibles'),
  ('Memorabilia'),
  ('Home Decor');
```

## 6. Set Up Storage for Images (Optional)

If you want to store product images in Supabase Storage:

1. Go to Storage in your Supabase dashboard
2. Create a new bucket called "products"
3. Make it public (for read access)
4. Update the bucket policy to allow authenticated users to upload

## 7. Test the Connection

Restart your dev server:
```bash
npm run dev
```

The app should now connect to Supabase. You can test by:
1. Signing up as a new user (Buyer or Seller)
2. The user profile will be automatically created
3. Sellers can add products
4. Buyers can browse, add to cart, and checkout

## Important Notes

- **Never commit your `.env` file** - it contains sensitive credentials
- The `anon` key is safe to use in frontend code
- Never use the `service_role` key in frontend code
- Row Level Security (RLS) is enabled to protect your data
- Users can only access their own data (except for public products)
