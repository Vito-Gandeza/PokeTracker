-- Create the schema for Pokemon cards collection
CREATE TABLE IF NOT EXISTS public.cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  set_name TEXT NOT NULL,
  set_code TEXT,
  card_number TEXT,
  rarity TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create user collections table
CREATE TABLE IF NOT EXISTS public.collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT collections_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Create junction table for cards in collections
CREATE TABLE IF NOT EXISTS public.collection_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(collection_id, card_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS cards_name_idx ON public.cards(name);
CREATE INDEX IF NOT EXISTS cards_set_name_idx ON public.cards(set_name);
CREATE INDEX IF NOT EXISTS collections_user_id_idx ON public.collections(user_id);

-- Enable Row Level Security for collections
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

-- Enable Row Level Security for collection_cards 
ALTER TABLE public.collection_cards ENABLE ROW LEVEL SECURITY;

-- Create policies for collections
-- Policy to allow users to view/read their own collections
CREATE POLICY "Users can view their own collections"
  ON public.collections
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy to allow users to create their own collections
CREATE POLICY "Users can create their own collections"
  ON public.collections
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update their own collections
CREATE POLICY "Users can update their own collections"
  ON public.collections
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy to allow users to delete their own collections
CREATE POLICY "Users can delete their own collections"
  ON public.collections
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for collection_cards
-- Policy to allow users to view/read cards in their own collections
CREATE POLICY "Users can view cards in their own collections"
  ON public.collection_cards
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.collections WHERE id = collection_id
    )
  );

-- Policy to allow users to add cards to their own collections
CREATE POLICY "Users can add cards to their own collections"
  ON public.collection_cards
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.collections WHERE id = collection_id
    )
  );

-- Policy to allow users to update cards in their own collections
CREATE POLICY "Users can update cards in their own collections"
  ON public.collection_cards
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.collections WHERE id = collection_id
    )
  );

-- Policy to allow users to delete cards from their own collections
CREATE POLICY "Users can delete cards from their own collections"
  ON public.collection_cards
  FOR DELETE
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.collections WHERE id = collection_id
    )
  );

-- Create policies for cards
-- All users can view cards
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All users can view cards"
  ON public.cards
  FOR SELECT
  USING (true);

-- Create admin RLS policies for collections
CREATE POLICY "Admins can access all collections"
  ON public.collections
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE is_admin = true
    )
  );

-- Create admin RLS policies for collection_cards
CREATE POLICY "Admins can access all collection_cards"
  ON public.collection_cards
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE is_admin = true
    )
  );

-- Create admin RLS policies for cards
CREATE POLICY "Admins can modify all cards"
  ON public.cards
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE is_admin = true
    )
  ); 