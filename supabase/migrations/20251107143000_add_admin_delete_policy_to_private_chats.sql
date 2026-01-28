CREATE POLICY "Admins can delete chats"
ON public.private_chats
FOR DELETE
TO authenticated
USING (EXISTS (
  SELECT 1
  FROM user_roles
  WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::app_role
));
