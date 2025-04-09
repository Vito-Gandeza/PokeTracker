-- This script updates the admin user's permissions
-- To run:
-- 1. Navigate to the Supabase dashboard
-- 2. Go to the SQL Editor
-- 3. Paste this script and execute it

-- First, check if the admin user exists
DO $$
DECLARE
  admin_email TEXT := 'admin@gmail.com';
  user_id UUID;
BEGIN
  -- Find the user ID from profiles table
  SELECT id INTO user_id FROM public.profiles WHERE email = admin_email;
  
  IF user_id IS NULL THEN
    RAISE NOTICE 'Admin user with email % not found. Run the create_admin.js script first.', admin_email;
    RETURN;
  END IF;
  
  -- Update the user's profile to have admin privileges
  UPDATE public.profiles
  SET 
    is_admin = true,
    role = 'admin'
  WHERE id = user_id;
  
  RAISE NOTICE 'Admin user % (ID: %) has been updated with admin privileges.', admin_email, user_id;

  -- Verify the update
  PERFORM pg_sleep(0.5); -- Give a moment for the update to complete
  
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id AND is_admin = true AND role = 'admin') THEN
    RAISE NOTICE 'Verification succeeded: User has admin privileges.';
  ELSE
    RAISE NOTICE 'Verification failed: User does not have admin privileges.';
  END IF;
END $$; 