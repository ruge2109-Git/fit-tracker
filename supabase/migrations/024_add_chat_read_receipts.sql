-- Add is_read to direct_messages
ALTER TABLE public.direct_messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;

-- Allow users to mark messages as read (receiver only)
DROP POLICY IF EXISTS "dm_update_read" ON public.direct_messages;
CREATE POLICY "dm_update_read" ON public.direct_messages
  FOR UPDATE
  USING (receiver_id = auth.uid())
  WITH CHECK (receiver_id = auth.uid());
