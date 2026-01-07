-- Create tables table for restaurant table management
CREATE TABLE IF NOT EXISTS public.tables (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    table_number INTEGER NOT NULL,
    capacity INTEGER DEFAULT 4,
    is_locked BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'available',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(restaurant_id, table_number)
);

-- Create waiter_calls table
CREATE TABLE IF NOT EXISTS public.waiter_calls (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    table_id UUID REFERENCES public.tables(id) ON DELETE SET NULL,
    table_number INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Create abuse_tracking table
CREATE TABLE IF NOT EXISTS public.abuse_tracking (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    customer_phone TEXT,
    customer_name TEXT,
    abuse_score INTEGER DEFAULT 0,
    last_incident_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waiter_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abuse_tracking ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Owners can view their tables" ON public.tables;
DROP POLICY IF EXISTS "Owners can manage their tables" ON public.tables;
DROP POLICY IF EXISTS "Public can view tables for ordering" ON public.tables;
DROP POLICY IF EXISTS "Owners can view their waiter calls" ON public.waiter_calls;
DROP POLICY IF EXISTS "Owners can manage their waiter calls" ON public.waiter_calls;
DROP POLICY IF EXISTS "Public can create waiter calls" ON public.waiter_calls;
DROP POLICY IF EXISTS "Owners can view their abuse tracking" ON public.abuse_tracking;
DROP POLICY IF EXISTS "Owners can manage their abuse tracking" ON public.abuse_tracking;

-- Tables policies
CREATE POLICY "Owners can view their tables"
ON public.tables FOR SELECT
USING (restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid()));

CREATE POLICY "Owners can insert their tables"
ON public.tables FOR INSERT
WITH CHECK (restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid()));

CREATE POLICY "Owners can update their tables"
ON public.tables FOR UPDATE
USING (restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid()));

CREATE POLICY "Owners can delete their tables"
ON public.tables FOR DELETE
USING (restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid()));

CREATE POLICY "Public can view tables for ordering"
ON public.tables FOR SELECT
USING (restaurant_id IN (SELECT id FROM public.restaurants WHERE setup_complete = true));

-- Waiter calls policies
CREATE POLICY "Owners can view their waiter calls"
ON public.waiter_calls FOR SELECT
USING (restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid()));

CREATE POLICY "Owners can update their waiter calls"
ON public.waiter_calls FOR UPDATE
USING (restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid()));

CREATE POLICY "Owners can delete their waiter calls"
ON public.waiter_calls FOR DELETE
USING (restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid()));

CREATE POLICY "Public can create waiter calls"
ON public.waiter_calls FOR INSERT
WITH CHECK (restaurant_id IN (SELECT id FROM public.restaurants WHERE setup_complete = true));

-- Abuse tracking policies
CREATE POLICY "Owners can view their abuse tracking"
ON public.abuse_tracking FOR SELECT
USING (restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid()));

CREATE POLICY "Owners can insert abuse tracking"
ON public.abuse_tracking FOR INSERT
WITH CHECK (restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid()));

CREATE POLICY "Owners can update abuse tracking"
ON public.abuse_tracking FOR UPDATE
USING (restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid()));

-- Add triggers only if they don't exist
DROP TRIGGER IF EXISTS update_tables_updated_at ON public.tables;
CREATE TRIGGER update_tables_updated_at
BEFORE UPDATE ON public.tables
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_abuse_tracking_updated_at ON public.abuse_tracking;
CREATE TRIGGER update_abuse_tracking_updated_at
BEFORE UPDATE ON public.abuse_tracking
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.waiter_calls;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tables;