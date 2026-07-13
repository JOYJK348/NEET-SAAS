-- ============================================================================
-- File       : 012_date_formats.sql
-- Module     : Shared
-- Purpose    : Seed common date/time format patterns for localization.
-- Depends On : date_formats
-- Author     : Agaran Platform
-- Version    : 1.0.0
-- ============================================================================

INSERT INTO date_formats (code, name, format_pattern, category, example_output, display_order)
VALUES
    -- Date formats
    ('DD_MM_YYYY', 'DD/MM/YYYY', 'DD/MM/YYYY', 'DATE', '12/07/2026', 1),
    ('MM_DD_YYYY', 'MM/DD/YYYY', 'MM/DD/YYYY', 'DATE', '07/12/2026', 2),
    ('YYYY_MM_DD', 'YYYY-MM-DD', 'YYYY-MM-DD', 'DATE', '2026-07-12', 3),
    ('DD_MMM_YYYY', 'DD MMM YYYY', 'DD MMM YYYY', 'DATE', '12 Jul 2026', 4),
    ('MMM_DD_YYYY', 'MMM DD, YYYY', 'MMM DD, YYYY', 'DATE', 'Jul 12, 2026', 5),
    ('DD_MMMM_YYYY', 'DD MMMM YYYY', 'DD MMMM YYYY', 'DATE', '12 July 2026', 6),
    ('MMMM_DD_YYYY', 'MMMM DD, YYYY', 'MMMM DD, YYYY', 'DATE', 'July 12, 2026', 7),

    -- Time formats
    ('HH_MM_24', 'HH:mm (24h)', 'HH:mm', 'TIME', '14:30', 8),
    ('HH_MM_SS_24', 'HH:mm:ss (24h)', 'HH:mm:ss', 'TIME', '14:30:00', 9),
    ('HH_MM_12', 'hh:mm A (12h)', 'hh:mm A', 'TIME', '02:30 PM', 10),
    ('HH_MM_SS_12', 'hh:mm:ss A (12h)', 'hh:mm:ss A', 'TIME', '02:30:00 PM', 11),

    -- Datetime formats
    ('DD_MM_YYYY_HH_MM_24', 'DD/MM/YYYY HH:mm', 'DD/MM/YYYY HH:mm', 'DATETIME', '12/07/2026 14:30', 12),
    ('YYYY_MM_DD_HH_MM_24', 'YYYY-MM-DD HH:mm', 'YYYY-MM-DD HH:mm', 'DATETIME', '2026-07-12 14:30', 13),
    ('DD_MMM_YYYY_HH_MM_12', 'DD MMM YYYY hh:mm A', 'DD MMM YYYY hh:mm A', 'DATETIME', '12 Jul 2026 02:30 PM', 14),
    ('ISO_8601', 'ISO 8601', 'YYYY-MM-DDTHH:mm:ssZ', 'DATETIME', '2026-07-12T14:30:00Z', 15),

    -- Month formats
    ('MM_YYYY', 'MM/YYYY', 'MM/YYYY', 'MONTH', '07/2026', 16),
    ('MMM_YYYY', 'MMM YYYY', 'MMM YYYY', 'MONTH', 'Jul 2026', 17),

    -- Year formats
    ('YYYY', 'YYYY', 'YYYY', 'YEAR', '2026', 18),
    ('YY', 'YY', 'YY', 'YEAR', '26', 19)
ON CONFLICT (code) DO NOTHING;
