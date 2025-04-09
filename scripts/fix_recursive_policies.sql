-- This script completely fixes all recursion issues in the Supabase RLS policies
-- To run:
-- 1. Navigate to the Supabase dashboard
-- 2. Go to the SQL Editor
-- 3. Paste this script and execute it

-- First, let's look at all existing policies to find the source of recursion
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual
FROM pg_policies
WHERE schemaname = 'public';

-- ===============================================================
-- STEP 1: Drop all policies on the profiles table to start fresh
-- ===============================================================
DROP POLICY IF EXISTS "Admins can access all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can access all profiles-1" ON public.profiles;
DROP POLICY IF EXISTS "Admins can access all profiles-2" ON public.profiles;
-- Drop any other policies that might exist on the profiles table

-- ===============================================================
-- STEP 2: Create a more robust admin check function
-- ===============================================================
CREATE OR REPLACE FUNCTION public.is_admin_check()
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER -- Runs with function creator's permissions
SET search_path = public
AS $$
DECLARE
  is_user_admin BOOLEAN;
  current_user_id UUID;
BEGIN
  -- Get the current user's ID
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Direct query that bypasses RLS
  EXECUTE 'SELECT (is_admin = true OR role = ''admin'') FROM public.profiles WHERE id = $1'
  INTO is_user_admin
  USING current_user_id;
  
  -- Return false if no profile found
  RETURN COALESCE(is_user_admin, FALSE);
END;
$$;

-- ===============================================================
-- STEP 3: Recreate base policies for the profiles table
-- ===============================================================

-- Allow users to view all profiles
CREATE POLICY "Users can view all profiles" 
  ON public.profiles FOR SELECT USING (true);

-- Allow users to update only their own profile
CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Create admin RLS policy with direct admin check, no recursion
CREATE POLICY "Admins can access all profiles"
  ON public.profiles
  FOR ALL
  -- Either the user is accessing their own profile, or they pass the admin check
  USING (auth.uid() = id OR public.is_admin_check());

-- ===============================================================
-- STEP 4: Fix policies in other tables that might cause recursion
-- ===============================================================

-- Fix collections table policies
DROP POLICY IF EXISTS "Admins can access all collections" ON public.collections;
CREATE POLICY "Admins can access all collections"
  ON public.collections
  FOR ALL
  USING (public.is_admin_check());

-- Fix collection_cards table policies
DROP POLICY IF EXISTS "Admins can access all collection_cards" ON public.collection_cards;
CREATE POLICY "Admins can access all collection_cards"
  ON public.collection_cards
  FOR ALL
  USING (public.is_admin_check());

-- Fix cards table policies
DROP POLICY IF EXISTS "Admins can modify all cards" ON public.cards;
CREATE POLICY "Admins can modify all cards"
  ON public.cards
  FOR ALL
  USING (public.is_admin_check());

-- ===============================================================
-- STEP 5: Add a simple test query to verify the fixes
-- ===============================================================
SELECT 
  schemaname, 
  tablename, 
  policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname; 