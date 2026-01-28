-- Add estate_id column to user_preferences table for proper estate-based matching

ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS estate_id uuid REFERENCES public.estates(id) ON DELETE SET NULL;

-- Create index for faster estate-based queries
CREATE INDEX IF NOT EXISTS idx_user_preferences_estate_id ON public.user_preferences(estate_id);

-- Comment
COMMENT ON COLUMN public.user_preferences.estate_id IS 'Reference to the estate/apartment complex for location-based matching';
