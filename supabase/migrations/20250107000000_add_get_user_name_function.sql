-- Function to get user name from auth.users
CREATE OR REPLACE FUNCTION get_user_name(user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_name text;
BEGIN
  SELECT 
    COALESCE(
      raw_user_meta_data->>'full_name',
      raw_user_meta_data->>'name',
      split_part(email, '@', 1),
      user_id::text
    )
  INTO user_name
  FROM auth.users
  WHERE id = user_id;
  
  RETURN COALESCE(user_name, user_id::text);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_name(uuid) TO authenticated;
