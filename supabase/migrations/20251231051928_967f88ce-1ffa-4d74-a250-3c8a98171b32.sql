-- Create managers table with permissions for each PG
CREATE TABLE public.managers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pg_id UUID NOT NULL REFERENCES public.pgs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  -- Permissions (what the manager can access/manage)
  can_view_guests BOOLEAN NOT NULL DEFAULT true,
  can_manage_guests BOOLEAN NOT NULL DEFAULT false,
  can_view_rents BOOLEAN NOT NULL DEFAULT true,
  can_manage_rents BOOLEAN NOT NULL DEFAULT false,
  can_view_payments BOOLEAN NOT NULL DEFAULT true,
  can_verify_payments BOOLEAN NOT NULL DEFAULT false,
  can_view_complaints BOOLEAN NOT NULL DEFAULT true,
  can_manage_complaints BOOLEAN NOT NULL DEFAULT false,
  can_view_expenses BOOLEAN NOT NULL DEFAULT false,
  can_manage_expenses BOOLEAN NOT NULL DEFAULT false,
  can_view_rooms BOOLEAN NOT NULL DEFAULT true,
  can_manage_rooms BOOLEAN NOT NULL DEFAULT false,
  can_view_announcements BOOLEAN NOT NULL DEFAULT true,
  can_manage_announcements BOOLEAN NOT NULL DEFAULT false,
  can_view_analytics BOOLEAN NOT NULL DEFAULT false,
  -- Unique constraint: one user can be manager of one PG only once
  UNIQUE(pg_id, user_id),
  UNIQUE(pg_id, email)
);

-- Enable Row Level Security
ALTER TABLE public.managers ENABLE ROW LEVEL SECURITY;

-- Create trigger for updated_at
CREATE TRIGGER update_managers_updated_at
BEFORE UPDATE ON public.managers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for managers table

-- Block anonymous access
CREATE POLICY "Block anonymous access to managers"
ON public.managers
FOR SELECT
TO anon
USING (false);

-- Owners can view their managers
CREATE POLICY "Owners can view their managers"
ON public.managers
FOR SELECT
TO authenticated
USING (pg_id IN (SELECT id FROM public.pgs WHERE owner_id = auth.uid()));

-- Owners can insert managers
CREATE POLICY "Owners can insert managers"
ON public.managers
FOR INSERT
TO authenticated
WITH CHECK (pg_id IN (SELECT id FROM public.pgs WHERE owner_id = auth.uid()));

-- Owners can update their managers
CREATE POLICY "Owners can update managers"
ON public.managers
FOR UPDATE
TO authenticated
USING (pg_id IN (SELECT id FROM public.pgs WHERE owner_id = auth.uid()));

-- Owners can delete their managers
CREATE POLICY "Owners can delete managers"
ON public.managers
FOR DELETE
TO authenticated
USING (pg_id IN (SELECT id FROM public.pgs WHERE owner_id = auth.uid()));

-- Managers can view themselves
CREATE POLICY "Managers can view themselves"
ON public.managers
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Create a helper function to check if user is a manager for a PG
CREATE OR REPLACE FUNCTION public.is_manager_of_pg(_user_id UUID, _pg_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.managers
    WHERE user_id = _user_id
      AND pg_id = _pg_id
  )
$$;

-- Create a helper function to get manager permissions
CREATE OR REPLACE FUNCTION public.get_manager_permission(_user_id UUID, _pg_id UUID, _permission TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE _permission
    WHEN 'can_view_guests' THEN can_view_guests
    WHEN 'can_manage_guests' THEN can_manage_guests
    WHEN 'can_view_rents' THEN can_view_rents
    WHEN 'can_manage_rents' THEN can_manage_rents
    WHEN 'can_view_payments' THEN can_view_payments
    WHEN 'can_verify_payments' THEN can_verify_payments
    WHEN 'can_view_complaints' THEN can_view_complaints
    WHEN 'can_manage_complaints' THEN can_manage_complaints
    WHEN 'can_view_expenses' THEN can_view_expenses
    WHEN 'can_manage_expenses' THEN can_manage_expenses
    WHEN 'can_view_rooms' THEN can_view_rooms
    WHEN 'can_manage_rooms' THEN can_manage_rooms
    WHEN 'can_view_announcements' THEN can_view_announcements
    WHEN 'can_manage_announcements' THEN can_manage_announcements
    WHEN 'can_view_analytics' THEN can_view_analytics
    ELSE FALSE
  END
  FROM public.managers
  WHERE user_id = _user_id
    AND pg_id = _pg_id
$$;