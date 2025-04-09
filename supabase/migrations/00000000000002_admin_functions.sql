-- Create a function to check if a user is admin that bypasses RLS policies
CREATE OR REPLACE FUNCTION public.check_if_user_is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- This runs with the privileges of the function creator
SET search_path = public
AS $$
DECLARE
  is_user_admin BOOLEAN;
BEGIN
  -- Direct query that bypasses RLS
  SELECT (is_admin = true OR role = 'admin') INTO is_user_admin
  FROM public.profiles
  WHERE id = user_id;
  
  -- Return false if no profile found
  RETURN COALESCE(is_user_admin, false);
END;
$$; 