-- ============================================================================
-- SQL File: 03.02_menus_seed.sql
-- Domain: Authentication UI Navigation Menu Layout Seeds
-- Design Strategy:
-- 1. Idempotent DML seed inserting global menus tree hierarchy.
-- 2. Uses nested subquery selects to dynamically resolve parent_id links from codes.
-- 3. Employs ON CONFLICT ON CONSTRAINT uq_menus_code to match constraints correctly.
-- ============================================================================

-- Ensure target schema scope
SET search_path = public;

-- 1. Seed Parent Modules and Groups First (parent_id = NULL)
INSERT INTO public.menus (
    code, name, route, icon_key, page_title, menu_type, display_order, show_in_sidebar, is_visible, is_system, is_active
) VALUES
    -- Dashboard is configured directly as a MENU node since it has no child menus
    ('dashboard', 'Dashboard', '/dashboard', 'dashboard', 'Dashboard', 'MENU', 1, true, true, true, true),
    
    -- Modules (Level 1 Root Navigation Groups)
    ('academics', 'Academics', NULL, 'academics', NULL, 'MODULE', 2, true, true, true, true),
    ('people', 'People', NULL, 'people', NULL, 'MODULE', 3, true, true, true, true),
    ('finance', 'Finance', NULL, 'finance', NULL, 'MODULE', 4, true, true, true, true),
    ('administration', 'Administration', NULL, 'administration', NULL, 'MODULE', 5, true, true, true, true)
ON CONFLICT ON CONSTRAINT uq_menus_code DO UPDATE SET
    name = EXCLUDED.name,
    route = EXCLUDED.route,
    icon_key = EXCLUDED.icon_key,
    page_title = EXCLUDED.page_title,
    menu_type = EXCLUDED.menu_type,
    display_order = EXCLUDED.display_order,
    show_in_sidebar = EXCLUDED.show_in_sidebar,
    is_visible = EXCLUDED.is_visible,
    is_system = EXCLUDED.is_system,
    is_active = EXCLUDED.is_active,
    updated_at = CASE 
        WHEN (menus.name IS DISTINCT FROM EXCLUDED.name 
              OR menus.route IS DISTINCT FROM EXCLUDED.route
              OR menus.icon_key IS DISTINCT FROM EXCLUDED.icon_key
              OR menus.page_title IS DISTINCT FROM EXCLUDED.page_title
              OR menus.menu_type IS DISTINCT FROM EXCLUDED.menu_type
              OR menus.display_order IS DISTINCT FROM EXCLUDED.display_order
              OR menus.show_in_sidebar IS DISTINCT FROM EXCLUDED.show_in_sidebar
              OR menus.is_visible IS DISTINCT FROM EXCLUDED.is_visible
              OR menus.is_active IS DISTINCT FROM EXCLUDED.is_active) THEN now()
        ELSE menus.updated_at
    END,
    version = CASE 
        WHEN (menus.name IS DISTINCT FROM EXCLUDED.name 
              OR menus.route IS DISTINCT FROM EXCLUDED.route
              OR menus.icon_key IS DISTINCT FROM EXCLUDED.icon_key
              OR menus.page_title IS DISTINCT FROM EXCLUDED.page_title
              OR menus.menu_type IS DISTINCT FROM EXCLUDED.menu_type
              OR menus.display_order IS DISTINCT FROM EXCLUDED.display_order
              OR menus.show_in_sidebar IS DISTINCT FROM EXCLUDED.show_in_sidebar
              OR menus.is_visible IS DISTINCT FROM EXCLUDED.is_visible
              OR menus.is_active IS DISTINCT FROM EXCLUDED.is_active) THEN menus.version + 1
        ELSE menus.version
    END;

-- 2. Seed Level 2 Child Groups (mapping parent modules)
INSERT INTO public.menus (
    parent_id, code, name, route, icon_key, menu_type, display_order, show_in_sidebar, is_visible, is_system, is_active
) VALUES
    -- Academics Child Groups
    ((SELECT id FROM public.menus WHERE code = 'academics'), 'academics.institutes', 'Institutes', NULL, NULL, 'GROUP', 1, true, true, true, true),
    ((SELECT id FROM public.menus WHERE code = 'academics'), 'academics.syllabus', 'Syllabus', NULL, NULL, 'GROUP', 2, true, true, true, true),
    ((SELECT id FROM public.menus WHERE code = 'academics'), 'academics.planning', 'Planning', NULL, NULL, 'GROUP', 3, true, true, true, true),
    
    -- People Child Groups
    ((SELECT id FROM public.menus WHERE code = 'people'), 'people.staff', 'Staff & Faculty', NULL, NULL, 'GROUP', 1, true, true, true, true),
    ((SELECT id FROM public.menus WHERE code = 'people'), 'people.students', 'Students & Parents', NULL, NULL, 'GROUP', 2, true, true, true, true),
    
    -- Finance Child Groups
    ((SELECT id FROM public.menus WHERE code = 'finance'), 'finance.billing', 'Fee Collections', NULL, NULL, 'GROUP', 1, true, true, true, true),
    
    -- Administration Child Groups
    ((SELECT id FROM public.menus WHERE code = 'administration'), 'administration.rbac', 'RBAC Settings', NULL, NULL, 'GROUP', 1, true, true, true, true),
    ((SELECT id FROM public.menus WHERE code = 'administration'), 'administration.compliance', 'Compliance & Logs', NULL, NULL, 'GROUP', 2, true, true, true, true)
ON CONFLICT ON CONSTRAINT uq_menus_code DO UPDATE SET
    parent_id = EXCLUDED.parent_id,
    name = EXCLUDED.name,
    route = EXCLUDED.route,
    icon_key = EXCLUDED.icon_key,
    page_title = EXCLUDED.page_title,
    menu_type = EXCLUDED.menu_type,
    display_order = EXCLUDED.display_order,
    show_in_sidebar = EXCLUDED.show_in_sidebar,
    is_visible = EXCLUDED.is_visible,
    is_system = EXCLUDED.is_system,
    is_active = EXCLUDED.is_active,
    updated_at = CASE 
        WHEN (menus.parent_id IS DISTINCT FROM EXCLUDED.parent_id
              OR menus.name IS DISTINCT FROM EXCLUDED.name 
              OR menus.route IS DISTINCT FROM EXCLUDED.route
              OR menus.icon_key IS DISTINCT FROM EXCLUDED.icon_key
              OR menus.page_title IS DISTINCT FROM EXCLUDED.page_title
              OR menus.menu_type IS DISTINCT FROM EXCLUDED.menu_type
              OR menus.display_order IS DISTINCT FROM EXCLUDED.display_order
              OR menus.show_in_sidebar IS DISTINCT FROM EXCLUDED.show_in_sidebar
              OR menus.is_visible IS DISTINCT FROM EXCLUDED.is_visible
              OR menus.is_active IS DISTINCT FROM EXCLUDED.is_active) THEN now()
        ELSE menus.updated_at
    END,
    version = CASE 
        WHEN (menus.parent_id IS DISTINCT FROM EXCLUDED.parent_id
              OR menus.name IS DISTINCT FROM EXCLUDED.name 
              OR menus.route IS DISTINCT FROM EXCLUDED.route
              OR menus.icon_key IS DISTINCT FROM EXCLUDED.icon_key
              OR menus.page_title IS DISTINCT FROM EXCLUDED.page_title
              OR menus.menu_type IS DISTINCT FROM EXCLUDED.menu_type
              OR menus.display_order IS DISTINCT FROM EXCLUDED.display_order
              OR menus.show_in_sidebar IS DISTINCT FROM EXCLUDED.show_in_sidebar
              OR menus.is_visible IS DISTINCT FROM EXCLUDED.is_visible
              OR menus.is_active IS DISTINCT FROM EXCLUDED.is_active) THEN menus.version + 1
        ELSE menus.version
    END;

-- 3. Seed Level 3 Child Menus (mapping parent groups, carrying routes)
INSERT INTO public.menus (
    parent_id, code, name, route, icon_key, page_title, menu_type, display_order, show_in_sidebar, is_visible, is_system, is_active
) VALUES
    -- Academics.Institutes Child Menus
    ((SELECT id FROM public.menus WHERE code = 'academics.institutes'), 'academics.institutes.profile', 'Institutes', '/institutes', 'institute', 'Institutes', 'MENU', 1, true, true, true, true),
    ((SELECT id FROM public.menus WHERE code = 'academics.institutes'), 'academics.institutes.branches', 'Branches', '/branches', 'branch', 'Branches', 'MENU', 2, true, true, true, true),
    ((SELECT id FROM public.menus WHERE code = 'academics.institutes'), 'academics.institutes.ay', 'Academic Years', '/academic-years', 'calendar', 'Academic Years', 'MENU', 3, true, true, true, true),
    
    -- Academics.Syllabus Child Menus
    ((SELECT id FROM public.menus WHERE code = 'academics.syllabus'), 'academics.syllabus.courses', 'Courses', '/courses', 'course', 'Courses', 'MENU', 1, true, true, true, true),
    ((SELECT id FROM public.menus WHERE code = 'academics.syllabus'), 'academics.syllabus.subjects', 'Subjects', '/subjects', 'subject', 'Subjects', 'MENU', 2, true, true, true, true),
    
    -- Academics.Planning Child Menus
    ((SELECT id FROM public.menus WHERE code = 'academics.planning'), 'academics.planning.batches', 'Batches', '/batches', 'batch', 'Batches', 'MENU', 1, true, true, true, true),
    ((SELECT id FROM public.menus WHERE code = 'academics.planning'), 'academics.planning.timetable', 'Timetables', '/timetable', 'timetable', 'Timetables', 'MENU', 2, true, true, true, true),
    
    -- People.Staff Child Menus
    ((SELECT id FROM public.menus WHERE code = 'people.staff'), 'people.staff.employees', 'Staff', '/staff', 'staff', 'Staff', 'MENU', 1, true, true, true, true),
    
    -- People.Students Child Menus
    ((SELECT id FROM public.menus WHERE code = 'people.students'), 'people.students.directory', 'Students', '/students', 'student', 'Students', 'MENU', 1, true, true, true, true),
    ((SELECT id FROM public.menus WHERE code = 'people.students'), 'people.students.attendance', 'Attendance', '/attendance', 'attendance', 'Attendance', 'MENU', 2, true, true, true, true),
    ((SELECT id FROM public.menus WHERE code = 'people.students'), 'people.students.exams', 'Exams', '/tests', 'test', 'Exams', 'MENU', 3, true, true, true, true),
    
    -- Finance.Billing Child Menus
    ((SELECT id FROM public.menus WHERE code = 'finance.billing'), 'finance.billing.fees', 'Fees', '/fees', 'fees', 'Fees', 'MENU', 1, true, true, true, true),
    
    -- Administration.Rbac Child Menus
    ((SELECT id FROM public.menus WHERE code = 'administration.rbac'), 'administration.rbac.users', 'Users', '/admin/users', 'user', 'Users', 'MENU', 1, true, true, true, true),
    ((SELECT id FROM public.menus WHERE code = 'administration.rbac'), 'administration.rbac.roles', 'Roles', '/admin/roles', 'role', 'Roles', 'MENU', 2, true, true, true, true),
    
    -- Administration.Compliance Child Menus
    ((SELECT id FROM public.menus WHERE code = 'administration.compliance'), 'administration.compliance.audit', 'Audit Logs', '/admin/audit', 'audit', 'Audit Logs', 'MENU', 1, true, true, true, true)
ON CONFLICT ON CONSTRAINT uq_menus_code DO UPDATE SET
    parent_id = EXCLUDED.parent_id,
    name = EXCLUDED.name,
    route = EXCLUDED.route,
    icon_key = EXCLUDED.icon_key,
    page_title = EXCLUDED.page_title,
    menu_type = EXCLUDED.menu_type,
    display_order = EXCLUDED.display_order,
    show_in_sidebar = EXCLUDED.show_in_sidebar,
    is_visible = EXCLUDED.is_visible,
    is_system = EXCLUDED.is_system,
    is_active = EXCLUDED.is_active,
    updated_at = CASE 
        WHEN (menus.parent_id IS DISTINCT FROM EXCLUDED.parent_id
              OR menus.name IS DISTINCT FROM EXCLUDED.name 
              OR menus.route IS DISTINCT FROM EXCLUDED.route
              OR menus.icon_key IS DISTINCT FROM EXCLUDED.icon_key
              OR menus.page_title IS DISTINCT FROM EXCLUDED.page_title
              OR menus.menu_type IS DISTINCT FROM EXCLUDED.menu_type
              OR menus.display_order IS DISTINCT FROM EXCLUDED.display_order
              OR menus.show_in_sidebar IS DISTINCT FROM EXCLUDED.show_in_sidebar
              OR menus.is_visible IS DISTINCT FROM EXCLUDED.is_visible
              OR menus.is_active IS DISTINCT FROM EXCLUDED.is_active) THEN now()
        ELSE menus.updated_at
    END,
    version = CASE 
        WHEN (menus.parent_id IS DISTINCT FROM EXCLUDED.parent_id
              OR menus.name IS DISTINCT FROM EXCLUDED.name 
              OR menus.route IS DISTINCT FROM EXCLUDED.route
              OR menus.icon_key IS DISTINCT FROM EXCLUDED.icon_key
              OR menus.page_title IS DISTINCT FROM EXCLUDED.page_title
              OR menus.menu_type IS DISTINCT FROM EXCLUDED.menu_type
              OR menus.display_order IS DISTINCT FROM EXCLUDED.display_order
              OR menus.show_in_sidebar IS DISTINCT FROM EXCLUDED.show_in_sidebar
              OR menus.is_visible IS DISTINCT FROM EXCLUDED.is_visible
              OR menus.is_active IS DISTINCT FROM EXCLUDED.is_active) THEN menus.version + 1
        ELSE menus.version
    END;
