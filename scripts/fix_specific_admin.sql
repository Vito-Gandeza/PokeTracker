-- This script updates the specific admin user mentioned in the issue
-- To run:
-- 1. Navigate to the Supabase dashboard
-- 2. Go to the SQL Editor
-- 3. Paste this script and execute it

-- Fix the specific admin user
DO $$
DECLARE
  admin_id UUID := '5e4e5971-c6b2-4a1f-b496-a05381749afe';
BEGIN
  -- First, verify the user exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = admin_id) THEN
    RAISE EXCEPTION 'User with ID % does not exist in auth.users', admin_id;
  END IF;
  
  -- First, force update the profile
  UPDATE public.profiles
  SET 
    is_admin = TRUE,
    role = 'admin'
  WHERE id = admin_id;
  
  -- Verify the update succeeded for profile
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = admin_id AND is_admin = TRUE AND role = 'admin') THEN
    RAISE EXCEPTION 'Failed to update admin privileges for user with ID %', admin_id;
  END IF;
  
  -- Also update the auth.users raw_user_meta_data
  UPDATE auth.users
  SET raw_user_meta_data = jsonb_build_object('role', 'admin', 'is_admin', true)
  WHERE id = admin_id;
  
  -- Update app metadata to set admin claims in JWT
  UPDATE auth.users
  SET raw_app_meta_data = jsonb_build_object('role', 'admin', 'is_admin', true)
  WHERE id = admin_id;
  
  RAISE NOTICE 'Successfully updated admin user (ID: %)', admin_id;
END $$; 