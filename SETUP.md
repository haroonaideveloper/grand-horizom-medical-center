# ZENVΛIR Storefront — Complete Setup Guide (Beginner-Friendly)

This is a static site (`index.html`) plus one tiny serverless function (`api/config.js`). No build step, no framework. Follow these steps in order.

---

## Step 1 — Push the folder to GitHub

1. Create a new repository on GitHub (e.g. `zenvair-store`).
2. Upload these files, keeping the folder structure exactly as given:
   ```
   index.html
   api/
     config.js
   ```

## Step 2 — Create your Supabase project (if you haven't already)

You've already got one running (`Ecommerce` project, with `products`, `orders`, `customers` tables) — you can skip to Step 3.

## Step 3 — Get your Supabase credentials

1. Go to **supabase.com/dashboard** → open your `Ecommerce` project.
2. Left sidebar → **Project Settings** (gear icon) → **API**.
3. Copy two values:
   - **Project URL** — looks like `https://mhuushfwfjaqvtnmmnno.supabase.co`
   - **anon / public key** — a long string starting with `eyJ...`

Keep this tab open, you'll paste these in the next step.

## Step 4 — Deploy to Vercel

1. Go to **vercel.com** → **Add New → Project** → import your GitHub repo.
2. Framework Preset: choose **Other** (it's not Next.js/React, just static + one function).
3. **Before clicking Deploy**, open **Environment Variables** on that same screen and add:

   | Name | Value |
   |---|---|
   | `SUPABASE_URL` | the Project URL you copied |
   | `SUPABASE_ANON_KEY` | the anon key you copied |

4. Click **Deploy**.

This is the important part: your credentials now live only in Vercel's dashboard — never in your HTML file, never in your GitHub repo. The `api/config.js` function reads them from Vercel's environment at runtime and hands them to the page when it loads. If you ever need to change them, do it in Vercel → your project → **Settings → Environment Variables**, then redeploy.

## Step 5 — Turn off email confirmation

So customers can sign up and be logged in immediately, without waiting on a confirmation email:

1. Supabase Dashboard → **Authentication** (left sidebar) → **Sign In / Providers**.
2. Find the **Email** provider.
3. Turn **"Confirm email" OFF**.
4. Save.

## Step 6 — Lock down your tables (Row Level Security)

Your tables are currently open to anyone with the anon key. Run this in Supabase → **SQL Editor**:

```sql
alter table products enable row level security;
create policy "Public can read products" on products for select using (true);

alter table orders enable row level security;
create policy "Anyone can insert an order" on orders for insert with check (true);
create policy "Customers can read their own orders" on orders
  for select using (auth.jwt() ->> 'email' = "Email");

alter table customers enable row level security;
-- Tell me which column in `customers` holds their email/login identifier
-- and I'll give you the exact matching policy for this table.
```

## Step 7 — Add some products so the catalog isn't empty

In Supabase → Table Editor → `products` → Insert row. Example values:
- `id`: `1`
- `name`: `Oversized Bomber Jacket`
- `category`: `Men`
- `price`: `89.99`
- `discount_percent`: `15`
- `sizes`: `S,M,L,XL`
- `colors`: `Black,Olive,Stone`
- `stock_quantity`: `12`
- `image_url`: (a direct image URL)
- `status`: `active`
- `quantity_called`: `false`

## Step 8 — Test it end to end

1. Open your live Vercel URL.
2. Products should load from Supabase.
3. Add something to your bag, go to checkout, fill in name/email/phone/address/city/postal code.
4. Try **Card Payment** — it's sandbox-only, so use test card `4242 4242 4242 4242`, any future expiry (e.g. `12/28`), any 3-digit CVV. It'll show a real-looking "Processing Payment" step then confirm the order — no real charge happens, and no card details are sent anywhere (not to Supabase, not to your webhook).
5. Or use **Cash on Delivery** instead — same order flow, no card step.
6. Check your Supabase `orders` table — the new order should appear there.

## Step 9 — Webhooks that need a Supabase-side trigger (not just JS)

Two of your automations need to run even when nobody has the site open, so they live in Supabase/n8n, not the browser:

**Low stock alert** — set up a Database Webhook (Supabase Dashboard → Database → Webhooks) on the `products` table: fire on UPDATE where `stock_quantity < 5` and `quantity_called = false`, pointing to your `low-stock-alert` URL.

**Cart abandoned (2+ hrs unpaid)** — the site already posts every cart change (with phone number, once entered at checkout) to your `cart-abandoned` webhook. Have your n8n workflow log these into a table and run a scheduled job every few minutes to check for carts that have been idle 2+ hours without a completed order.

## Step 10 — When you're ready to take real payments

Card payment is sandbox-only right now by design — it's built to demo convincingly for a client without being able to process (or even accept) anyone's real card. When you're ready to go live:

1. Create a free Stripe (or regional equivalent) account — test-mode API keys are available immediately, no business verification needed just to try it.
2. Swap the sandbox card form for **Stripe Checkout** or **Stripe Elements** — this means card numbers go straight to Stripe, never through your own server or Supabase, which is what real PCI compliance requires.
3. `paymentStatusWebhook(orderId, status, transactionId)` is already defined in the code, ready to be called from Stripe's payment confirmation callback.

---

## Data shape reference

**products**: `id, name, category, sub_category, price, discount_percent, sizes (comma-separated), colors (comma-separated), stock_quantity, image_url, description, sku, status, quantity_called`

**orders**: `id, customer_name, phone_number, address, city, postal_code, product_ids (JSON string), size_selected, color_selected, quantity, total_amount, payment_status, order_status, order_date, Email`

**customers**: `id, name, phone_number, total_orders, last_order_date`

## What's fully working right now

- Live product grid, search, sort, category + size filters — pulled from Supabase
- Product modal with size/color selection, low-stock messaging, related products
- Wishlist, cart drawer with quantity controls
- Checkout collecting name, email, phone, address, city, postal code
- Cash on Delivery (live) and Card Payment (sandbox demo, test cards only, no card data ever transmitted)
- Order confirmation + order tracking by email, via Supabase `orders`
- Refund request flow, chatbot panel, WhatsApp click-to-chat
- Email/phone + password auth via Supabase Auth, no verification step
- Supabase credentials kept out of your GitHub repo via Vercel environment variables
