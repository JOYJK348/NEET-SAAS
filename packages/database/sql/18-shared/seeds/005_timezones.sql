-- ============================================================================
-- File       : 005_timezones.sql
-- Module     : Shared
-- Purpose    : Seed IANA timezones for primary markets.
-- Depends On : timezones
-- Author     : Agaran Platform
-- Version    : 1.0.0
-- ============================================================================

INSERT INTO timezones (name, utc_offset, utc_offset_minutes, observes_dst, display_order)
VALUES
    ('Asia/Kolkata', '+05:30', 330, false, 1),
    ('Asia/Dubai', '+04:00', 240, false, 2),
    ('Asia/Riyadh', '+03:00', 180, false, 3),
    ('Asia/Qatar', '+03:00', 180, false, 4),
    ('Asia/Kuwait', '+03:00', 180, false, 5),
    ('Asia/Muscat', '+04:00', 240, false, 6),
    ('Asia/Bahrain', '+03:00', 180, false, 7),
    ('Asia/Karachi', '+05:00', 300, false, 8),
    ('Asia/Dhaka', '+06:00', 360, false, 9),
    ('Asia/Colombo', '+05:30', 330, false, 10),
    ('Asia/Kathmandu', '+05:45', 345, false, 11),
    ('Asia/Singapore', '+08:00', 480, false, 12),
    ('Asia/Kuala_Lumpur', '+08:00', 480, false, 13),
    ('Asia/Bangkok', '+07:00', 420, false, 14),
    ('Asia/Ho_Chi_Minh', '+07:00', 420, false, 15),
    ('Asia/Manila', '+08:00', 480, false, 16),
    ('Asia/Jakarta', '+07:00', 420, false, 17),
    ('Asia/Tokyo', '+09:00', 540, false, 18),
    ('Asia/Seoul', '+09:00', 540, false, 19),
    ('Asia/Shanghai', '+08:00', 480, false, 20),
    ('Asia/Hong_Kong', '+08:00', 480, false, 21),
    ('Europe/London', '+00:00', 0, true, 22),
    ('Europe/Paris', '+01:00', 60, true, 23),
    ('Europe/Berlin', '+01:00', 60, true, 24),
    ('Europe/Rome', '+01:00', 60, true, 25),
    ('Europe/Madrid', '+01:00', 60, true, 26),
    ('Europe/Amsterdam', '+01:00', 60, true, 27),
    ('Europe/Stockholm', '+01:00', 60, true, 28),
    ('Europe/Oslo', '+01:00', 60, true, 29),
    ('Europe/Zurich', '+01:00', 60, true, 30),
    ('Europe/Istanbul', '+03:00', 180, false, 31),
    ('Europe/Moscow', '+03:00', 180, false, 32),
    ('America/New_York', '-05:00', -300, true, 33),
    ('America/Chicago', '-06:00', -360, true, 34),
    ('America/Denver', '-07:00', -420, true, 35),
    ('America/Los_Angeles', '-08:00', -480, true, 36),
    ('America/Toronto', '-05:00', -300, true, 37),
    ('America/Vancouver', '-08:00', -480, true, 38),
    ('America/Sao_Paulo', '-03:00', -180, false, 39),
    ('Australia/Sydney', '+10:00', 600, true, 40),
    ('Australia/Melbourne', '+10:00', 600, true, 41),
    ('Pacific/Auckland', '+12:00', 720, true, 42),
    ('Africa/Cairo', '+02:00', 120, false, 43),
    ('Africa/Lagos', '+01:00', 60, false, 44),
    ('Africa/Johannesburg', '+02:00', 120, false, 45),
    ('Africa/Nairobi', '+03:00', 180, false, 46),
    ('UTC', '+00:00', 0, false, 47)
ON CONFLICT (name) DO NOTHING;
