-- Create restaurants table
CREATE TABLE public.restaurants (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id UUID NOT NULL,
    name TEXT NOT NULL,
    logo_url TEXT,
    location TEXT,
    currency TEXT DEFAULT 'USD',
    language TEXT DEFAULT 'en',
    setup_complete BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create profiles table for owner info
CREATE TABLE public.profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    full_name TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create categories table
CREATE TABLE public.categories (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create menu_items table
CREATE TABLE public.menu_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL,
    image_url TEXT,
    available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

-- Profiles policies (users can only access their own profile)
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

-- Restaurants policies (owners can only access their own restaurants)
CREATE POLICY "Owners can view their own restaurants"
ON public.restaurants FOR SELECT
USING (auth.uid() = owner_id);

CREATE POLICY "Owners can insert their own restaurants"
ON public.restaurants FOR INSERT
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their own restaurants"
ON public.restaurants FOR UPDATE
USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their own restaurants"
ON public.restaurants FOR DELETE
USING (auth.uid() = owner_id);

-- Categories policies (owners can access categories of their restaurants)
CREATE POLICY "Owners can view categories of their restaurants"
ON public.categories FOR SELECT
USING (
    restaurant_id IN (
        SELECT id FROM public.restaurants WHERE owner_id = auth.uid()
    )
);

CREATE POLICY "Owners can insert categories to their restaurants"
ON public.categories FOR INSERT
WITH CHECK (
    restaurant_id IN (
        SELECT id FROM public.restaurants WHERE owner_id = auth.uid()
    )
);

CREATE POLICY "Owners can update categories of their restaurants"
ON public.categories FOR UPDATE
USING (
    restaurant_id IN (
        SELECT id FROM public.restaurants WHERE owner_id = auth.uid()
    )
);

CREATE POLICY "Owners can delete categories of their restaurants"
ON public.categories FOR DELETE
USING (
    restaurant_id IN (
        SELECT id FROM public.restaurants WHERE owner_id = auth.uid()
    )
);

-- Menu items policies (owners can access menu items of their restaurants)
CREATE POLICY "Owners can view menu items of their restaurants"
ON public.menu_items FOR SELECT
USING (
    restaurant_id IN (
        SELECT id FROM public.restaurants WHERE owner_id = auth.uid()
    )
);

CREATE POLICY "Owners can insert menu items to their restaurants"
ON public.menu_items FOR INSERT
WITH CHECK (
    restaurant_id IN (
        SELECT id FROM public.restaurants WHERE owner_id = auth.uid()
    )
);

CREATE POLICY "Owners can update menu items of their restaurants"
ON public.menu_items FOR UPDATE
USING (
    restaurant_id IN (
        SELECT id FROM public.restaurants WHERE owner_id = auth.uid()
    )
);

CREATE POLICY "Owners can delete menu items of their restaurants"
ON public.menu_items FOR DELETE
USING (
    restaurant_id IN (
        SELECT id FROM public.restaurants WHERE owner_id = auth.uid()
    )
);

-- Add public read access for guests viewing menus
CREATE POLICY "Anyone can view restaurant info"
ON public.restaurants FOR SELECT
USING (setup_complete = true);

CREATE POLICY "Anyone can view categories"
ON public.categories FOR SELECT
USING (
    restaurant_id IN (
        SELECT id FROM public.restaurants WHERE setup_complete = true
    )
);

CREATE POLICY "Anyone can view available menu items"
ON public.menu_items FOR SELECT
USING (
    available = true AND
    restaurant_id IN (
        SELECT id FROM public.restaurants WHERE setup_complete = true
    )
);

-- Add triggers for updated_at
CREATE TRIGGER update_restaurants_updated_at
BEFORE UPDATE ON public.restaurants
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_menu_items_updated_at
BEFORE UPDATE ON public.menu_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('restaurant-logos', 'restaurant-logos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('menu-items', 'menu-items', true);

-- Storage policies for restaurant logos
CREATE POLICY "Anyone can view restaurant logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'restaurant-logos');

CREATE POLICY "Authenticated users can upload restaurant logos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'restaurant-logos' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update their logos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'restaurant-logos' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete their logos"
ON storage.objects FOR DELETE
USING (bucket_id = 'restaurant-logos' AND auth.role() = 'authenticated');

-- Storage policies for menu item images
CREATE POLICY "Anyone can view menu item images"
ON storage.objects FOR SELECT
USING (bucket_id = 'menu-items');

CREATE POLICY "Authenticated users can upload menu item images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'menu-items' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update menu item images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'menu-items' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete menu item images"
ON storage.objects FOR DELETE
USING (bucket_id = 'menu-items' AND auth.role() = 'authenticated');