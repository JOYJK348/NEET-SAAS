-- ============================================================================
-- File       : 002_states.sql
-- Module     : Shared
-- Purpose    : Seed states for primary markets (India, US, UAE, UK, Canada).
-- Depends On : states, countries
-- Author     : Agaran Platform
-- Version    : 1.0.0
-- ============================================================================

-- India States
WITH c AS (SELECT id FROM countries WHERE iso2 = 'IN')
INSERT INTO states (country_id, code, name, type, display_order)
SELECT c.id, code, name, 'STATE', display_order
FROM c, (VALUES
    ('AP', 'Andhra Pradesh', 1), ('AR', 'Arunachal Pradesh', 2), ('AS', 'Assam', 3),
    ('BR', 'Bihar', 4), ('CG', 'Chhattisgarh', 5), ('GA', 'Goa', 6),
    ('GJ', 'Gujarat', 7), ('HR', 'Haryana', 8), ('HP', 'Himachal Pradesh', 9),
    ('JH', 'Jharkhand', 10), ('KA', 'Karnataka', 11), ('KL', 'Kerala', 12),
    ('MP', 'Madhya Pradesh', 13), ('MH', 'Maharashtra', 14), ('MN', 'Manipur', 15),
    ('ML', 'Meghalaya', 16), ('MZ', 'Mizoram', 17), ('NL', 'Nagaland', 18),
    ('OD', 'Odisha', 19), ('PB', 'Punjab', 20), ('RJ', 'Rajasthan', 21),
    ('SK', 'Sikkim', 22), ('TN', 'Tamil Nadu', 23), ('TS', 'Telangana', 24),
    ('TR', 'Tripura', 25), ('UP', 'Uttar Pradesh', 26), ('UK', 'Uttarakhand', 27),
    ('WB', 'West Bengal', 28), ('DL', 'Delhi', 29, 'TERRITORY'),
    ('CH', 'Chandigarh', 30, 'TERRITORY'), ('PY', 'Puducherry', 31, 'TERRITORY'),
    ('JK', 'Jammu & Kashmir', 32), ('LD', 'Ladakh', 33),
    ('AN', 'Andaman & Nicobar', 34, 'TERRITORY'), ('DN', 'Dadra & Nagar Haveli and Daman & Diu', 35, 'TERRITORY'),
    ('LA', 'Lakshadweep', 36, 'TERRITORY')
) AS t(code, name, display_order, type)
WHERE NOT EXISTS (SELECT 1 FROM states s WHERE s.country_id = c.id AND s.code = t.code);

-- US States
WITH c AS (SELECT id FROM countries WHERE iso2 = 'US')
INSERT INTO states (country_id, code, name, type, display_order)
SELECT c.id, code, name, 'STATE', display_order
FROM c, (VALUES
    ('AL', 'Alabama', 1), ('AK', 'Alaska', 2), ('AZ', 'Arizona', 3),
    ('AR', 'Arkansas', 4), ('CA', 'California', 5), ('CO', 'Colorado', 6),
    ('CT', 'Connecticut', 7), ('DE', 'Delaware', 8), ('FL', 'Florida', 9),
    ('GA', 'Georgia', 10), ('HI', 'Hawaii', 11), ('ID', 'Idaho', 12),
    ('IL', 'Illinois', 13), ('IN', 'Indiana', 14), ('IA', 'Iowa', 15),
    ('KS', 'Kansas', 16), ('KY', 'Kentucky', 17), ('LA', 'Louisiana', 18),
    ('ME', 'Maine', 19), ('MD', 'Maryland', 20), ('MA', 'Massachusetts', 21),
    ('MI', 'Michigan', 22), ('MN', 'Minnesota', 23), ('MS', 'Mississippi', 24),
    ('MO', 'Missouri', 25), ('MT', 'Montana', 26), ('NE', 'Nebraska', 27),
    ('NV', 'Nevada', 28), ('NH', 'New Hampshire', 29), ('NJ', 'New Jersey', 30),
    ('NM', 'New Mexico', 31), ('NY', 'New York', 32), ('NC', 'North Carolina', 33),
    ('ND', 'North Dakota', 34), ('OH', 'Ohio', 35), ('OK', 'Oklahoma', 36),
    ('OR', 'Oregon', 37), ('PA', 'Pennsylvania', 38), ('RI', 'Rhode Island', 39),
    ('SC', 'South Carolina', 40), ('SD', 'South Dakota', 41), ('TN', 'Tennessee', 42),
    ('TX', 'Texas', 43), ('UT', 'Utah', 44), ('VT', 'Vermont', 45),
    ('VA', 'Virginia', 46), ('WA', 'Washington', 47), ('WV', 'West Virginia', 48),
    ('WI', 'Wisconsin', 49), ('WY', 'Wyoming', 50),
    ('DC', 'District of Columbia', 51, 'TERRITORY')
) AS t(code, name, display_order, type)
WHERE NOT EXISTS (SELECT 1 FROM states s WHERE s.country_id = c.id AND s.code = t.code);

-- UAE Emirates
WITH c AS (SELECT id FROM countries WHERE iso2 = 'AE')
INSERT INTO states (country_id, code, name, type, display_order)
SELECT c.id, code, name, 'EMIRATE', display_order
FROM c, (VALUES
    ('AZ', 'Abu Dhabi', 1), ('DU', 'Dubai', 2), ('SH', 'Sharjah', 3),
    ('AJ', 'Ajman', 4), ('UQ', 'Umm Al Quwain', 5), ('RK', 'Ras Al Khaimah', 6),
    ('FU', 'Fujairah', 7)
) AS t(code, name, display_order)
WHERE NOT EXISTS (SELECT 1 FROM states s WHERE s.country_id = c.id AND s.code = t.code);

-- UK Countries
WITH c AS (SELECT id FROM countries WHERE iso2 = 'GB')
INSERT INTO states (country_id, code, name, type, display_order)
SELECT c.id, code, name, 'REGION', display_order
FROM c, (VALUES
    ('ENG', 'England', 1), ('SCT', 'Scotland', 2), ('WLS', 'Wales', 3),
    ('NIR', 'Northern Ireland', 4)
) AS t(code, name, display_order)
WHERE NOT EXISTS (SELECT 1 FROM states s WHERE s.country_id = c.id AND s.code = t.code);

-- Canada Provinces
WITH c AS (SELECT id FROM countries WHERE iso2 = 'CA')
INSERT INTO states (country_id, code, name, type, display_order)
SELECT c.id, code, name, type, display_order
FROM c, (VALUES
    ('AB', 'Alberta', 'PROVINCE', 1), ('BC', 'British Columbia', 'PROVINCE', 2),
    ('MB', 'Manitoba', 'PROVINCE', 3), ('NB', 'New Brunswick', 'PROVINCE', 4),
    ('NL', 'Newfoundland and Labrador', 'PROVINCE', 5),
    ('NS', 'Nova Scotia', 'PROVINCE', 6), ('ON', 'Ontario', 'PROVINCE', 7),
    ('PE', 'Prince Edward Island', 'PROVINCE', 8), ('QC', 'Quebec', 'PROVINCE', 9),
    ('SK', 'Saskatchewan', 'PROVINCE', 10),
    ('NT', 'Northwest Territories', 'TERRITORY', 11),
    ('NU', 'Nunavut', 'TERRITORY', 12), ('YT', 'Yukon', 'TERRITORY', 13)
) AS t(code, name, type, display_order)
WHERE NOT EXISTS (SELECT 1 FROM states s WHERE s.country_id = c.id AND s.code = t.code);
