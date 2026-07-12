-- ============================================================================
-- File       : 011_countries_phone_codes.sql
-- Module     : Shared
-- Purpose    : Seed phone validation rules for primary markets.
-- Depends On : countries_phone_codes, countries
-- Author     : Agaran Platform
-- Version    : 1.0.0
-- ============================================================================

-- India
WITH c AS (SELECT id FROM countries WHERE iso2 = 'IN')
INSERT INTO countries_phone_codes (country_id, phone_code, example, mobile_length_min, mobile_length_max, landline_length_min, landline_length_max, national_prefix, validation_regex)
SELECT c.id, '+91', '+91 98765 43210', 10, 10, 8, 11, '0', '^[6-9]\d{9}$'
FROM c
WHERE NOT EXISTS (SELECT 1 FROM countries_phone_codes WHERE country_id = c.id AND phone_code = '+91');

-- US
WITH c AS (SELECT id FROM countries WHERE iso2 = 'US')
INSERT INTO countries_phone_codes (country_id, phone_code, example, mobile_length_min, mobile_length_max, landline_length_min, landline_length_max, national_prefix, validation_regex)
SELECT c.id, '+1', '+1 (555) 123-4567', 10, 10, 10, 10, '1', '^\d{10}$'
FROM c
WHERE NOT EXISTS (SELECT 1 FROM countries_phone_codes WHERE country_id = c.id AND phone_code = '+1');

-- UAE
WITH c AS (SELECT id FROM countries WHERE iso2 = 'AE')
INSERT INTO countries_phone_codes (country_id, phone_code, example, mobile_length_min, mobile_length_max, landline_length_min, landline_length_max, national_prefix, validation_regex)
SELECT c.id, '+971', '+971 50 123 4567', 9, 9, 7, 8, '0', '^0?5[0-9]{8}$'
FROM c
WHERE NOT EXISTS (SELECT 1 FROM countries_phone_codes WHERE country_id = c.id AND phone_code = '+971');

-- GB
WITH c AS (SELECT id FROM countries WHERE iso2 = 'GB')
INSERT INTO countries_phone_codes (country_id, phone_code, example, mobile_length_min, mobile_length_max, landline_length_min, landline_length_max, national_prefix, validation_regex)
SELECT c.id, '+44', '+44 7700 900123', 10, 11, 10, 10, '0', '^0?7[0-9]{9}$'
FROM c
WHERE NOT EXISTS (SELECT 1 FROM countries_phone_codes WHERE country_id = c.id AND phone_code = '+44');

-- Australia
WITH c AS (SELECT id FROM countries WHERE iso2 = 'AU')
INSERT INTO countries_phone_codes (country_id, phone_code, example, mobile_length_min, mobile_length_max, landline_length_min, landline_length_max, national_prefix, validation_regex)
SELECT c.id, '+61', '+61 4 1234 5678', 9, 10, 9, 10, '0', '^0?4[0-9]{8}$'
FROM c
WHERE NOT EXISTS (SELECT 1 FROM countries_phone_codes WHERE country_id = c.id AND phone_code = '+61');

-- Canada
WITH c AS (SELECT id FROM countries WHERE iso2 = 'CA')
INSERT INTO countries_phone_codes (country_id, phone_code, example, mobile_length_min, mobile_length_max, landline_length_min, landline_length_max, national_prefix, validation_regex)
SELECT c.id, '+1', '+1 (416) 555-0123', 10, 10, 10, 10, '1', '^\d{10}$'
FROM c
WHERE NOT EXISTS (SELECT 1 FROM countries_phone_codes WHERE country_id = c.id AND phone_code = '+1');

-- Saudi Arabia
WITH c AS (SELECT id FROM countries WHERE iso2 = 'SA')
INSERT INTO countries_phone_codes (country_id, phone_code, example, mobile_length_min, mobile_length_max, landline_length_min, landline_length_max, national_prefix, validation_regex)
SELECT c.id, '+966', '+966 5 1234 5678', 9, 9, 7, 9, '0', '^0?5[0-9]{8}$'
FROM c
WHERE NOT EXISTS (SELECT 1 FROM countries_phone_codes WHERE country_id = c.id AND phone_code = '+966');

-- Singapore
WITH c AS (SELECT id FROM countries WHERE iso2 = 'SG')
INSERT INTO countries_phone_codes (country_id, phone_code, example, mobile_length_min, mobile_length_max, landline_length_min, landline_length_max, national_prefix, validation_regex)
SELECT c.id, '+65', '+65 8123 4567', 8, 8, 8, 8, NULL, '^\d{8}$'
FROM c
WHERE NOT EXISTS (SELECT 1 FROM countries_phone_codes WHERE country_id = c.id AND phone_code = '+65');

-- Malaysia
WITH c AS (SELECT id FROM countries WHERE iso2 = 'MY')
INSERT INTO countries_phone_codes (country_id, phone_code, example, mobile_length_min, mobile_length_max, landline_length_min, landline_length_max, national_prefix, validation_regex)
SELECT c.id, '+60', '+60 12 345 6789', 9, 10, 8, 9, '0', '^0?1[0-9]{7,8}$'
FROM c
WHERE NOT EXISTS (SELECT 1 FROM countries_phone_codes WHERE country_id = c.id AND phone_code = '+60');

-- Pakistan
WITH c AS (SELECT id FROM countries WHERE iso2 = 'PK')
INSERT INTO countries_phone_codes (country_id, phone_code, example, mobile_length_min, mobile_length_max, landline_length_min, landline_length_max, national_prefix, validation_regex)
SELECT c.id, '+92', '+92 3 001 234567', 10, 10, 9, 10, '0', '^0?3[0-9]{9}$'
FROM c
WHERE NOT EXISTS (SELECT 1 FROM countries_phone_codes WHERE country_id = c.id AND phone_code = '+92');

-- Bangladesh
WITH c AS (SELECT id FROM countries WHERE iso2 = 'BD')
INSERT INTO countries_phone_codes (country_id, phone_code, example, mobile_length_min, mobile_length_max, landline_length_min, landline_length_max, national_prefix, validation_regex)
SELECT c.id, '+880', '+880 18 1234 5678', 10, 10, 8, 10, '0', '^0?1[3-9][0-9]{8}$'
FROM c
WHERE NOT EXISTS (SELECT 1 FROM countries_phone_codes WHERE country_id = c.id AND phone_code = '+880');

-- Sri Lanka
WITH c AS (SELECT id FROM countries WHERE iso2 = 'LK')
INSERT INTO countries_phone_codes (country_id, phone_code, example, mobile_length_min, mobile_length_max, landline_length_min, landline_length_max, national_prefix, validation_regex)
SELECT c.id, '+94', '+94 71 234 5678', 9, 9, 8, 10, '0', '^0?7[0-9]{8}$'
FROM c
WHERE NOT EXISTS (SELECT 1 FROM countries_phone_codes WHERE country_id = c.id AND phone_code = '+94');

-- Nigeria
WITH c AS (SELECT id FROM countries WHERE iso2 = 'NG')
INSERT INTO countries_phone_codes (country_id, phone_code, example, mobile_length_min, mobile_length_max, landline_length_min, landline_length_max, national_prefix, validation_regex)
SELECT c.id, '+234', '+234 803 123 4567', 10, 10, 7, 10, '0', '^0?7[0-1][0-9]{8}$'
FROM c
WHERE NOT EXISTS (SELECT 1 FROM countries_phone_codes WHERE country_id = c.id AND phone_code = '+234');

-- Egypt
WITH c AS (SELECT id FROM countries WHERE iso2 = 'EG')
INSERT INTO countries_phone_codes (country_id, phone_code, example, mobile_length_min, mobile_length_max, landline_length_min, landline_length_max, national_prefix, validation_regex)
SELECT c.id, '+20', '+20 10 1234 5678', 10, 10, 8, 9, '0', '^0?1[0-9]{9}$'
FROM c
WHERE NOT EXISTS (SELECT 1 FROM countries_phone_codes WHERE country_id = c.id AND phone_code = '+20');

-- Kenya
WITH c AS (SELECT id FROM countries WHERE iso2 = 'KE')
INSERT INTO countries_phone_codes (country_id, phone_code, example, mobile_length_min, mobile_length_max, landline_length_min, landline_length_max, national_prefix, validation_regex)
SELECT c.id, '+254', '+254 712 345 678', 9, 9, 7, 10, '0', '^0?7[0-9]{8}$'
FROM c
WHERE NOT EXISTS (SELECT 1 FROM countries_phone_codes WHERE country_id = c.id AND phone_code = '+254');

-- South Africa
WITH c AS (SELECT id FROM countries WHERE iso2 = 'ZA')
INSERT INTO countries_phone_codes (country_id, phone_code, example, mobile_length_min, mobile_length_max, landline_length_min, landline_length_max, national_prefix, validation_regex)
SELECT c.id, '+27', '+27 82 123 4567', 9, 9, 9, 10, '0', '^0?[6-8][0-9]{8}$'
FROM c
WHERE NOT EXISTS (SELECT 1 FROM countries_phone_codes WHERE country_id = c.id AND phone_code = '+27');
