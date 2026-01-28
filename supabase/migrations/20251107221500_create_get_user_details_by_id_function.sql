CREATE OR REPLACE FUNCTION get_user_details_by_id(user_ids uuid[])
RETURNS TABLE (
    id uuid,
    email text,
    raw_user_meta_data jsonb,
    created_at timestamp with time zone
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        u.id,
        u.email,
        u.raw_user_meta_data,
        u.created_at
    FROM
        auth.users u
    WHERE
        u.id = ANY(user_ids);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
