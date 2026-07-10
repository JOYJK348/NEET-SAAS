-- ============================================================================
-- SQL File: 03.01_permissions_seed.sql
-- Domain: Authentication Role-Based Access Control (RBAC) System Seeds
-- Design Strategy:
-- 1. Pure idempotent SQL DML seed inserting global permissions metadata.
-- 2. Uses ON CONFLICT(code) DO UPDATE to support safe subsequent executions.
-- 3. Groups permission definitions logically by functional module codes.
-- 4. Exclusively registers system-owned (is_system = true) metadata records.
-- ============================================================================

-- Ensure target schema scope
SET search_path = public;

-- Seed permission catalog configurations
INSERT INTO public.permissions (
    code,
    name,
    description,
    module_code,
    display_order,
    is_active,
    is_system,
    version
) VALUES
    -- ============================================================================
    -- SYSTEM MODULE
    -- ============================================================================
    ('system.governance.read', 'Read Governance Settings', 'View system-wide setup configurations and platform metrics', 'SYSTEM', 1, true, true, 1),
    ('system.governance.update', 'Update Governance Settings', 'Modify system-wide parameter scopes and database environment parameters', 'SYSTEM', 2, true, true, 1),
    ('dashboard.read', 'Read Dashboard Layout', 'View basic welcome dashboards and metrics summary panels', 'SYSTEM', 3, true, true, 1),
    ('dashboard.analytics.read', 'Read Analytical Dashboards', 'Access operational summaries, registrations graphs, and performance widgets', 'SYSTEM', 4, true, true, 1),

    -- ============================================================================
    -- SECURITY MODULE
    -- ============================================================================
    ('security.audit.read', 'Read Security Audit Logs', 'View audit logs, compliance events, and platform login histories', 'SECURITY', 1, true, true, 1),
    ('security.audit.export', 'Export Security Audit Logs', 'Export sensitive audit logs to CSV or analytical formats', 'SECURITY', 2, true, true, 1),
    ('security.session.read', 'Read Active Sessions', 'Monitor live device sessions and token metrics', 'SECURITY', 3, true, true, 1),
    ('security.session.revoke', 'Revoke Device Sessions', 'Force terminate active client sessions', 'SECURITY', 4, true, true, 1),

    -- ============================================================================
    -- AUTH MODULE
    -- ============================================================================
    ('users.read', 'Read User Registry', 'View the list of registered user profiles', 'AUTH', 1, true, true, 1),
    ('users.create', 'Create User Profiles', 'Onboard new user profile records manually', 'AUTH', 2, true, true, 1),
    ('users.update', 'Update User Profiles', 'Modify status properties and branch mappings of user profiles', 'AUTH', 3, true, true, 1),
    ('users.delete', 'Delete User Profiles', 'Soft delete or suspend user authentication profiles', 'AUTH', 4, true, true, 1),
    
    ('roles.read', 'Read Roles Catalog', 'View the list of available tenant and system roles', 'AUTH', 5, true, true, 1),
    ('roles.create', 'Create Custom Roles', 'Define custom tenant roles', 'AUTH', 6, true, true, 1),
    ('roles.update', 'Update Custom Roles', 'Modify name, description, and permission scopes mapped to roles', 'AUTH', 7, true, true, 1),
    ('roles.delete', 'Delete Custom Roles', 'Soft delete custom tenant roles', 'AUTH', 8, true, true, 1),
    
    ('user_roles.assign', 'Assign User Roles', 'Map authorization roles to user profiles', 'AUTH', 9, true, true, 1),
    ('user_roles.revoke', 'Revoke User Roles', 'Revoke mapped roles from user profiles', 'AUTH', 10, true, true, 1),

    -- ============================================================================
    -- ACADEMICS MODULE
    -- ============================================================================
    ('institutes.read', 'Read Institute Setup', 'View brand styles, billing rules, and configuration settings', 'ACADEMICS', 1, true, true, 1),
    ('institutes.update', 'Update Institute Setup', 'Modify base tenant configurations and details', 'ACADEMICS', 2, true, true, 1),
    
    ('branches.read', 'Read Branch Locations', 'Browse campus locations profiles', 'ACADEMICS', 3, true, true, 1),
    ('branches.create', 'Create Branch Locations', 'Add new campus branch locations', 'ACADEMICS', 4, true, true, 1),
    ('branches.update', 'Update Branch Locations', 'Modify campus branch settings and details', 'ACADEMICS', 5, true, true, 1),
    ('branches.delete', 'Delete Branch Locations', 'Soft delete branch locations', 'ACADEMICS', 6, true, true, 1),
    
    ('academic_years.read', 'Read Academic Years', 'View active calendar cycles and semesters schedules', 'ACADEMICS', 7, true, true, 1),
    ('academic_years.create', 'Create Academic Years', 'Define new calendar cycles', 'ACADEMICS', 8, true, true, 1),
    ('academic_years.update', 'Update Academic Years', 'Modify calendar cycle durations and boundaries', 'ACADEMICS', 9, true, true, 1),
    
    ('departments.read', 'Read Departments', 'Browse designations and functional departments lists', 'ACADEMICS', 10, true, true, 1),
    ('departments.create', 'Create Departments', 'Add new departments', 'ACADEMICS', 11, true, true, 1),
    ('departments.update', 'Update Departments', 'Modify department configurations and profiles', 'ACADEMICS', 12, true, true, 1),
    
    ('courses.read', 'Read Course Catalog', 'Browse the curriculum course catalogs', 'ACADEMICS', 13, true, true, 1),
    ('courses.create', 'Create Master Courses', 'Provision new courses', 'ACADEMICS', 14, true, true, 1),
    ('courses.update', 'Update Master Courses', 'Modify course duration parameters and descriptions', 'ACADEMICS', 15, true, true, 1),
    ('courses.delete', 'Delete Master Courses', 'Soft delete master courses', 'ACADEMICS', 16, true, true, 1),
    
    ('subjects.read', 'Read Subjects Directory', 'Browse master subject catalog', 'ACADEMICS', 17, true, true, 1),
    ('subjects.create', 'Create Subjects', 'Provision new subjects', 'ACADEMICS', 18, true, true, 1),
    ('subjects.update', 'Update Subjects', 'Modify subject names and type classifications', 'ACADEMICS', 19, true, true, 1),
    
    ('chapters.read', 'Read Chapters Syllabus', 'Browse chapters trees mapped to course subjects', 'ACADEMICS', 20, true, true, 1),
    ('chapters.create', 'Create Syllabus Chapters', 'Add new chapters to course subjects', 'ACADEMICS', 21, true, true, 1),
    ('chapters.update', 'Update Syllabus Chapters', 'Modify chapter profiles, descriptions, and session sizes', 'ACADEMICS', 22, true, true, 1),
    
    ('topics.read', 'Read Syllabus Topics', 'Browse topics mapped to chapters', 'ACADEMICS', 23, true, true, 1),
    ('topics.create', 'Create Syllabus Topics', 'Add new topics to chapters', 'ACADEMICS', 24, true, true, 1),
    ('topics.update', 'Update Syllabus Topics', 'Modify topic difficulties and estimated sessions limits', 'ACADEMICS', 25, true, true, 1),
    
    ('batches.read', 'Read Classroom Batches', 'Browse student enrollment batches and timetables', 'ACADEMICS', 26, true, true, 1),
    ('batches.create', 'Create Classroom Batches', 'Provision new classroom enrollment batches', 'ACADEMICS', 27, true, true, 1),
    ('batches.update', 'Update Classroom Batches', 'Modify batch structures, delivery modes, and session bounds', 'ACADEMICS', 28, true, true, 1),
    ('batches.delete', 'Delete Classroom Batches', 'Soft delete enrollment batches', 'ACADEMICS', 29, true, true, 1),
    
    ('timetable.read', 'Read Lecture Timetables', 'View weekly timetables and session schedules', 'ACADEMICS', 30, true, true, 1),
    ('timetable.create', 'Create Timetable Slots', 'Generate schedule structures for classroom batches', 'ACADEMICS', 31, true, true, 1),
    ('timetable.update', 'Update Timetable Slots', 'Edit timetabled hours and class mappings', 'ACADEMICS', 32, true, true, 1),
    ('timetable.publish', 'Publish Timetables', 'Release weekly timetables schedules to teachers and students', 'ACADEMICS', 33, true, true, 1),

    -- ============================================================================
    -- PEOPLE MODULE
    -- ============================================================================
    ('staff.read', 'Read Staff Profiles', 'View employee and teacher profiles lists', 'PEOPLE', 1, true, true, 1),
    ('staff.create', 'Create Staff Profiles', 'Register new staff/employee entries', 'PEOPLE', 2, true, true, 1),
    ('staff.update', 'Update Staff Profiles', 'Modify staff profiles and department assignments', 'PEOPLE', 3, true, true, 1),
    ('staff.delete', 'Delete Staff Profiles', 'Deactivate or soft delete staff members', 'PEOPLE', 4, true, true, 1),
    
    ('students.read', 'Read Student Profiles', 'Browse registered student catalogs', 'PEOPLE', 5, true, true, 1),
    ('students.create', 'Create Student Profiles', 'Register new students', 'PEOPLE', 6, true, true, 1),
    ('students.update', 'Update Student Profiles', 'Modify student registrations, batches, and contacts info', 'PEOPLE', 7, true, true, 1),
    ('students.delete', 'Delete Student Profiles', 'Suspend or soft delete student profiles', 'PEOPLE', 8, true, true, 1),
    ('students.export', 'Export Student Registry', 'Export student directories databases to CSV/Excel', 'PEOPLE', 9, true, true, 1),
    
    ('parents.read', 'Read Parent Contacts', 'Browse parent/guardian maps', 'PEOPLE', 10, true, true, 1),
    ('parents.create', 'Create Parent Profiles', 'Add new parent/guardian profiles', 'PEOPLE', 11, true, true, 1),
    ('parents.update', 'Update Parent Profiles', 'Modify parent profile details', 'PEOPLE', 12, true, true, 1),

    -- ============================================================================
    -- ATTENDANCE MODULE
    -- ============================================================================
    ('attendance.read', 'Read Attendance Sheets', 'View daily attendance logs and metrics summaries', 'ATTENDANCE', 1, true, true, 1),
    ('attendance.mark', 'Mark Student Attendance', 'Mark daily class attendance for student batches', 'ATTENDANCE', 2, true, true, 1),
    ('attendance.publish', 'Publish Attendance Logs', 'Verify and publish daily attendance logs', 'ATTENDANCE', 3, true, true, 1),
    ('attendance.override', 'Override Attendance Logs', 'Edit historical attendance registry sheets', 'ATTENDANCE', 4, true, true, 1),

    -- ============================================================================
    -- FINANCE MODULE
    -- ============================================================================
    ('fees.read', 'Read Fees Structures', 'View fee templates, configurations, and receipt catalogs', 'FINANCE', 1, true, true, 1),
    ('fees.create', 'Create Fee Templates', 'Draft new fee models and setups', 'FINANCE', 2, true, true, 1),
    ('fees.update', 'Update Fee Templates', 'Modify active fee structures and timelines', 'FINANCE', 3, true, true, 1),
    ('fees.delete', 'Delete Fee Templates', 'Soft delete fee structures', 'FINANCE', 4, true, true, 1),
    ('fees.collect', 'Collect Fee Payments', 'Process student fee payment collections', 'FINANCE', 5, true, true, 1),
    ('fees.refund', 'Refund Fee Payments', 'Process fee payment refunds', 'FINANCE', 6, true, true, 1),
    ('fees.waive', 'Waive Student Fees', 'Apply fee waivers or custom discounts', 'FINANCE', 7, true, true, 1),
    ('fees.export', 'Export Fee Logs', 'Export fee transaction logs database to CSV/Excel', 'FINANCE', 8, true, true, 1),

    -- ============================================================================
    -- EXAMS MODULE
    -- ============================================================================
    ('tests.read', 'Read Exam Lists', 'Browse active tests rosters', 'EXAMS', 1, true, true, 1),
    ('tests.create', 'Create Exam Templates', 'Generate draft mock/NEET tests', 'EXAMS', 2, true, true, 1),
    ('tests.update', 'Update Exam Templates', 'Modify test duration parameters and chapters coverage', 'EXAMS', 3, true, true, 1),
    ('tests.publish', 'Publish Exam Papers', 'Publish exams schedules to student portals', 'EXAMS', 4, true, true, 1),
    ('tests.evaluate', 'Evaluate Exam Papers', 'Input scores and evaluation details for student tests', 'EXAMS', 5, true, true, 1),
    ('tests.override', 'Override Exam Results', 'Modify scored tests marks after publication', 'EXAMS', 6, true, true, 1),

    -- ============================================================================
    -- COMMUNICATION MODULE
    -- ============================================================================
    ('notifications.read', 'Read Dispatch Logs', 'Browse SMS/Email/WhatsApp dispatch histories', 'COMMUNICATION', 1, true, true, 1),
    ('notifications.create', 'Create Dispatch Templates', 'Draft templates for notification broadcasts', 'COMMUNICATION', 2, true, true, 1),
    ('notifications.send', 'Send Broadcasts', 'Execute WhatsApp/SMS/Email notifications broadcasts dispatches', 'COMMUNICATION', 3, true, true, 1),

    -- ============================================================================
    -- FILES MODULE
    -- ============================================================================
    ('documents.read', 'Read Files Metadata', 'Browse metadata folders of uploaded study resources', 'FILES', 1, true, true, 1),
    ('documents.download', 'Download Study Assets', 'Download uploaded PDFs and assets', 'FILES', 2, true, true, 1),
    ('documents.create', 'Upload Study Files', 'Upload new lecture notes and study material files', 'FILES', 3, true, true, 1),
    ('documents.update', 'Update Files Metadata', 'Rename or re-organize files folders mappings', 'FILES', 4, true, true, 1),
    ('documents.delete', 'Delete Files', 'Soft delete uploaded files', 'FILES', 5, true, true, 1),

    -- ============================================================================
    -- REPORTS MODULE
    -- ============================================================================
    ('reports.read', 'Read Analytical Reports', 'Access analytical reports and dashboard widgets', 'REPORTS', 1, true, true, 1),
    ('reports.export', 'Export Analytical Reports', 'Export analytical reports to PDF/Excel formats', 'REPORTS', 2, true, true, 1),

    -- ============================================================================
    -- AI MODULE
    -- ============================================================================
    ('ai.chat', 'Access AI Assistant', 'Query active AI assistant modules', 'AI', 1, true, true, 1),
    ('ai.generate', 'Generate Study Assets', 'Request AI generation of study plans and mock queries', 'AI', 2, true, true, 1)

ON CONFLICT ON CONSTRAINT uq_permissions_code DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    module_code = EXCLUDED.module_code,
    display_order = EXCLUDED.display_order,
    is_active = EXCLUDED.is_active,
    is_system = EXCLUDED.is_system,
    updated_at = CASE 
        WHEN (permissions.name IS DISTINCT FROM EXCLUDED.name 
              OR permissions.description IS DISTINCT FROM EXCLUDED.description
              OR permissions.module_code IS DISTINCT FROM EXCLUDED.module_code
              OR permissions.display_order IS DISTINCT FROM EXCLUDED.display_order
              OR permissions.is_active IS DISTINCT FROM EXCLUDED.is_active) THEN now()
        ELSE permissions.updated_at
    END,
    version = CASE 
        WHEN (permissions.name IS DISTINCT FROM EXCLUDED.name 
              OR permissions.description IS DISTINCT FROM EXCLUDED.description
              OR permissions.module_code IS DISTINCT FROM EXCLUDED.module_code
              OR permissions.display_order IS DISTINCT FROM EXCLUDED.display_order
              OR permissions.is_active IS DISTINCT FROM EXCLUDED.is_active) THEN permissions.version + 1
        ELSE permissions.version
    END;


