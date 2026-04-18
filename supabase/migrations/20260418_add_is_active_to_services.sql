-- Migration: Add is_active column to services table
-- Date: 2026-04-18
-- Description: Supports archiving services that cannot be deleted due to FK constraints.

ALTER TABLE IF EXISTS public.services 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update RLS to ensure active/inactive filtering can be handled by app logic
-- (Policies already allow ALL access to business members, so no change needed to policies)
