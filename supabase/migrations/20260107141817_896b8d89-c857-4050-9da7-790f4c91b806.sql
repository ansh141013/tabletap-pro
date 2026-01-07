-- Fix orders table RLS policies
-- Drop existing permissive policies
DROP POLICY IF EXISTS "Allow read access to orders" ON public.orders;
DROP POLICY IF EXISTS "Allow insert orders" ON public.orders;
DROP POLICY IF EXISTS "Allow update orders" ON public.orders;

-- Owners can view orders for their restaurants
CREATE POLICY "Owners can view their restaurant orders"
ON public.orders
FOR SELECT
USING (
  restaurant_id IN (
    SELECT id FROM restaurants WHERE owner_id = auth.uid()
  )
);

-- Guests can insert orders to restaurants with setup complete
CREATE POLICY "Guests can create orders"
ON public.orders
FOR INSERT
WITH CHECK (
  restaurant_id IN (
    SELECT id FROM restaurants WHERE setup_complete = true
  )
  AND customer_name IS NOT NULL
  AND table_number IS NOT NULL
);

-- Owners can update orders for their restaurants
CREATE POLICY "Owners can update their restaurant orders"
ON public.orders
FOR UPDATE
USING (
  restaurant_id IN (
    SELECT id FROM restaurants WHERE owner_id = auth.uid()
  )
);

-- Fix order_items table RLS policies
DROP POLICY IF EXISTS "Allow read access to order_items" ON public.order_items;
DROP POLICY IF EXISTS "Allow insert order_items" ON public.order_items;

-- Owners can view order items for their restaurant orders
CREATE POLICY "Owners can view their order items"
ON public.order_items
FOR SELECT
USING (
  order_id IN (
    SELECT o.id FROM orders o
    JOIN restaurants r ON r.id = o.restaurant_id
    WHERE r.owner_id = auth.uid()
  )
);

-- Guests can insert order items for valid orders
CREATE POLICY "Guests can create order items"
ON public.order_items
FOR INSERT
WITH CHECK (
  order_id IN (
    SELECT id FROM orders
  )
);