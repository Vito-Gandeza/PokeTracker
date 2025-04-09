-- Enable UUID extension (already enabled in Supabase)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_admin BOOLEAN DEFAULT FALSE,
    profile_data JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    rarity TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id),
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id),
    is_public BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS public.user_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    card_id UUID REFERENCES public.cards(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, card_id)
);

CREATE TABLE IF NOT EXISTS public.collection_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    collection_id UUID REFERENCES public.collections(id) ON DELETE CASCADE,
    card_id UUID REFERENCES public.cards(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(collection_id, card_id)
);

CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id),
    is_active BOOLEAN DEFAULT TRUE
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile"
    ON public.users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.users FOR UPDATE
    USING (auth.uid() = id);

-- Cards policies
CREATE POLICY "Anyone can view cards"
    ON public.cards FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage cards"
    ON public.cards FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND is_admin = true
    ));

-- Collections policies
CREATE POLICY "Users can view public collections"
    ON public.collections FOR SELECT
    USING (is_public = true);

CREATE POLICY "Users can view their own collections"
    ON public.collections FOR SELECT
    USING (created_by = auth.uid());

CREATE POLICY "Users can manage their own collections"
    ON public.collections FOR ALL
    USING (created_by = auth.uid());

-- User cards policies
CREATE POLICY "Users can view their own cards"
    ON public.user_cards FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own cards"
    ON public.user_cards FOR ALL
    USING (user_id = auth.uid());

-- Collection cards policies
CREATE POLICY "Users can view cards in public collections"
    ON public.collection_cards FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.collections
        WHERE id = collection_id AND is_public = true
    ));

CREATE POLICY "Users can view cards in their own collections"
    ON public.collection_cards FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.collections
        WHERE id = collection_id AND created_by = auth.uid()
    ));

CREATE POLICY "Users can manage cards in their own collections"
    ON public.collection_cards FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.collections
        WHERE id = collection_id AND created_by = auth.uid()
    ));

-- Announcements policies
CREATE POLICY "Anyone can view active announcements"
    ON public.announcements FOR SELECT
    USING (is_active = true);

CREATE POLICY "Admins can manage announcements"
    ON public.announcements FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND is_admin = true
    ));

-- Create functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, username)
    VALUES (NEW.id, NEW.email, NEW.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to check admin status
CREATE OR REPLACE FUNCTION public.is_admin_check()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND is_admin = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 