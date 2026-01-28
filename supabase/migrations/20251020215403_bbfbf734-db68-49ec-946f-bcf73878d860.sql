-- Add admin role for melwishjamo2805@gmail.com
INSERT INTO user_roles (user_id, role) 
VALUES ('d6529d04-3363-4d7c-839f-21b978b43301', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;