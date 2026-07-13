-- ============================================================================
-- SQL Seed File: 03.14_batch_delivery_types_seed.sql
-- Domain: Batch Delivery Types Demo Seeding
-- ============================================================================

SET search_path = public;

INSERT INTO public.batch_delivery_types (id, tenant_id, code, name, attendance_mode, is_default, is_active, is_system)
VALUES 
    -- ABC NEET Delivery Types (Hex prefix: 2d...)
    ('2d000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000001', 'OFFLINE', 'Offline Classroom Mode', 'CLASSROOM', true, true, true),
    ('2d000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000001', 'ONLINE', 'Online Distance Mode', 'ONLINE', false, true, true),
    ('2d000000-0000-0000-0000-000000000013', 'a0000000-0000-0000-0000-000000000001', 'HYBRID', 'Hybrid Integrated Mode', 'HYBRID', false, true, false),

    -- XYZ Medical Delivery Types
    ('2d000000-0000-0000-0000-000000000021', 'a0000000-0000-0000-0000-000000000002', 'OFFLINE', 'Offline Classroom Mode', 'CLASSROOM', true, true, true)
ON CONFLICT (id) DO UPDATE 
SET 
    name = EXCLUDED.name,
    is_default = EXCLUDED.is_default,
    is_active = EXCLUDED.is_active,
    version = batch_delivery_types.version + 1
WHERE batch_delivery_types.name IS DISTINCT FROM EXCLUDED.name 
   OR batch_delivery_types.is_default IS DISTINCT FROM EXCLUDED.is_default
   OR batch_delivery_types.is_active IS DISTINCT FROM EXCLUDED.is_active;
