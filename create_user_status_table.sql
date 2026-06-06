-- Create user_status table for tracking online/offline status
CREATE TABLE IF NOT EXISTS public.user_status (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_online boolean DEFAULT false,
  last_seen timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_status_is_online ON public.user_status(is_online);

-- Enable Row Level Security
ALTER TABLE public.user_status ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Allow users to view all online statuses
CREATE POLICY "Users can view all user statuses" 
  ON public.user_status 
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Allow users to update their own status
CREATE POLICY "Users can update their own status" 
  ON public.user_status 
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Allow users to insert their own status
CREATE POLICY "Users can insert their own status" 
  ON public.user_status 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

-- Create a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_status_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_status_timestamp_trigger ON public.user_status;
CREATE TRIGGER update_user_status_timestamp_trigger
  BEFORE UPDATE ON public.user_status
  FOR EACH ROW
  EXECUTE FUNCTION update_user_status_timestamp();
