-- Drop existing cards table if it exists
DROP TABLE IF EXISTS public.cards CASCADE;

-- Create the updated cards table
CREATE TABLE IF NOT EXISTS public.cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    set_name TEXT NOT NULL,
    card_number TEXT,
    rarity TEXT NOT NULL,
    image_url TEXT,
    price DECIMAL(10,2) NOT NULL,
    condition TEXT,
    description TEXT,
    seller_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id)
);

-- Enable RLS
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view cards"
    ON public.cards FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage cards"
    ON public.cards FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND is_admin = true
    )); 