-- Enable Supabase Realtime for leads table (required for kanban live updates).
-- Run in Supabase SQL Editor or via migration if not already enabled.

ALTER PUBLICATION supabase_realtime ADD TABLE leads;
