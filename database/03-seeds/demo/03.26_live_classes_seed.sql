-- ============================================================================
-- SQL Seed File: 03.26_live_classes_seed.sql
-- Domain: Live Classes, Sessions, Attendance & Interaction Demo Seeding
-- ============================================================================

SET search_path = public;

-- 1. Seed Live Class (Biology Marathon Scheduled for Today)
INSERT INTO public.live_classes (
    id, tenant_id, course_id, academic_year_id, batch_id, subject_id, chapter_id, topic_id,
    title, subtitle, description, class_type, meeting_provider, scheduled_start, scheduled_end, status,
    published_by, published_at
)
VALUES (
    '4a000000-0000-0000-0000-000000000001', 
    'a0000000-0000-0000-0000-000000000001', -- ABC Tenant
    'f0000000-0000-0000-0000-000000000011', -- Course
    'c0000000-0000-0000-0000-000000000011', -- AY
    '2e000000-0000-0000-0000-000000000011', -- Batch
    '1a000000-0000-0000-0000-000000000013', -- Subject (Botany)
    '1c000000-0000-0000-0000-000000000013', -- Chapter (Cell Bio)
    '1d000000-0000-0000-0000-000000000013', -- Topic (DNA)
    'Botany Cell Division Marathon Class',
    'Interactive DNA replication deep-dive session',
    'Special revision marathon covering chromosome structures and mitotic processes.',
    'LIVE', 'ZOOM',
    now() - interval '30 minutes',
    now() + interval '90 minutes',
    'LIVE',
    '3b000000-0000-0000-0000-000000000013', -- Published by staff
    now() - interval '1 hour'
)
ON CONFLICT (id) DO NOTHING;

-- 2. Link Instructor to Class (Chitra N as primary Host)
INSERT INTO public.live_class_instructors (id, tenant_id, live_class_id, staff_profile_id, role, is_primary)
VALUES (
    '4b000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    '4a000000-0000-0000-0000-000000000001',
    '3b000000-0000-0000-0000-000000000015', -- Chitra's staff user ID
    'HOST',
    true
)
ON CONFLICT (id) DO NOTHING;

-- 3. Seed Execution Session
INSERT INTO public.live_class_sessions (
    id, tenant_id, live_class_id, session_number, provider_session_id, provider_metadata,
    status, started_at, host_joined_at, peak_participants, network_quality_score
)
VALUES (
    '4c000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    '4a000000-0000-0000-0000-000000000001',
    1,
    'zoom_meeting_88921820',
    '{"connection_type": "websocket", "datacenter": "mumbai"}',
    'STARTED',
    now() - interval '25 minutes',
    now() - interval '25 minutes',
    12,
    4.85
)
ON CONFLICT (id) DO NOTHING;

-- 4. Log Student Participant Connection
INSERT INTO public.live_class_participants (
    id, tenant_id, session_id, student_admission_id, device_type, browser, os, ip_address, network_type, joined_at
)
VALUES (
    '4d000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    '4c000000-0000-0000-0000-000000000001',
    '2f000000-0000-0000-0000-000000000100', -- Karthik R
    'DESKTOP', 'Chrome 122', 'Windows 11', '192.168.1.50', 'WIFI',
    now() - interval '22 minutes'
)
ON CONFLICT (id) DO NOTHING;

-- 5. Seed Attendance Analytics
INSERT INTO public.live_class_attendance (
    id, tenant_id, session_id, student_admission_id, attendance_status, total_duration_seconds, late_minutes,
    camera_on_percentage, mic_on_percentage, attention_score, focus_score
)
VALUES (
    '4e000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    '4c000000-0000-0000-0000-000000000001',
    '2f000000-0000-0000-0000-000000000100',
    'PRESENT',
    1320, -- 22 minutes
    0,
    85.50,
    12.00,
    95.00,
    98.00
)
ON CONFLICT (id) DO NOTHING;

-- 6. Add Chat Thread Message
INSERT INTO public.live_class_chat_messages (
    id, tenant_id, session_id, sender_id, sender_role, message_type, message
)
VALUES (
    '4f000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    '4c000000-0000-0000-0000-000000000001',
    '3b000000-0000-0000-0000-000000000100', -- Karthik's user ID
    'GUEST',
    'TEXT',
    'Ma''am, will this session cover double crossovers?'
)
ON CONFLICT (id) DO NOTHING;

-- 7. Teacher Launched Poll
INSERT INTO public.live_class_polls (
    id, tenant_id, session_id, question, options, poll_type, correct_answer, status, starts_at
)
VALUES (
    '5a000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    '4c000000-0000-0000-0000-000000000001',
    'Which phase of meiosis does crossing over occur in?',
    '[{"label": "A", "text": "Prophase I"}, {"label": "B", "text": "Metaphase I"}, {"label": "C", "text": "Anaphase II"}]'::jsonb,
    'MCQ',
    'A',
    'ACTIVE',
    now() - interval '10 minutes'
)
ON CONFLICT (id) DO NOTHING;

-- 8. Log Student Poll Response
INSERT INTO public.live_class_poll_responses (
    id, tenant_id, poll_id, student_admission_id, selected_option, time_taken_seconds, is_correct
)
VALUES (
    '5b000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    '5a000000-0000-0000-0000-000000000001',
    '2f000000-0000-0000-0000-000000000100',
    'A',
    8,
    true
)
ON CONFLICT (id) DO NOTHING;

-- 9. Whiteboard snapshot
INSERT INTO public.live_class_whiteboard_snapshots (
    id, tenant_id, session_id, storage_object_id, page_number, drawing_version, ocr_status, ocr_text, captured_by
)
VALUES (
    '5c000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    '4c000000-0000-0000-0000-000000000001',
    'whiteboards/session_1/page_3.png',
    3, 1,
    'COMPLETED',
    'Meiotic Crossing Over Diagram Phase 1',
    '3b000000-0000-0000-0000-000000000015' -- Captured by Chitra
)
ON CONFLICT (id) DO NOTHING;

-- 10. Student Raise Hand Queue
INSERT INTO public.live_class_raise_hands (
    id, tenant_id, session_id, student_admission_id, status, raised_at
)
VALUES (
    '5d000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    '4c000000-0000-0000-0000-000000000001',
    '2f000000-0000-0000-0000-000000000100',
    'PENDING',
    now() - interval '5 minutes'
)
ON CONFLICT (id) DO NOTHING;

-- 11. Breakout Room Layout
INSERT INTO public.live_class_breakout_rooms (
    id, tenant_id, session_id, room_name, topic_focus, started_at
)
VALUES (
    '5e000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    '4c000000-0000-0000-0000-000000000001',
    'Breakout Room 1: DNA Structure doubt discussion',
    'Discuss double-helix hydrogen bonds properties.',
    now() - interval '15 minutes'
)
ON CONFLICT (id) DO NOTHING;

-- 12. Breakout Room Student Membership
INSERT INTO public.breakout_room_participants (
    id, tenant_id, breakout_room_id, student_admission_id, joined_at
)
VALUES (
    '5f000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    '5e000000-0000-0000-0000-000000000001',
    '2f000000-0000-0000-0000-000000000100',
    now() - interval '14 minutes'
)
ON CONFLICT (id) DO NOTHING;

-- 13. Session Timeline Events Audit Trail Ledger
INSERT INTO public.live_class_events (
    id, tenant_id, session_id, event_type, event_payload, triggered_by, occurred_at
)
VALUES (
    '6a000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    '4c000000-0000-0000-0000-000000000001',
    'HOST_JOINED',
    '{"role": "HOST", "name": "Chitra N"}'::jsonb,
    '3b000000-0000-0000-0000-000000000015',
    now() - interval '25 minutes'
)
ON CONFLICT (id) DO NOTHING;
