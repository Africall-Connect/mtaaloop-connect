/*
  # Fix user_roles INSERT policy for signup
  
  ## Changes
  - Add INSERT policy to allow authenticated users to create their own role record during signup
  - This enables new users to successfully complete the registration process
  
  ## Security
  - Users can only insert a role for themselves (auth.uid() = user_id)
  - RLS remains enabled and restrictive
*/

-- Add policy to allow users to insert their own role during signup
CREATE POLICY "Users can insert own role"
  ON user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
